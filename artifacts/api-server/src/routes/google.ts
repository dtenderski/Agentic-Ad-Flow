import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import {
  checkGoogleAdsSecrets,
  validateGoogleCredentials,
  createGoogleCampaign,
  createGoogleAdGroup,
  createGoogleAd,
  getGoogleCampaignInsights,
  getChannelTypeForObjective,
} from "../lib/google-ads";

const router: IRouter = Router();

// ─── Validate Google Ads credentials ─────────────────────────────────────────
router.get("/google/validate", async (_req, res): Promise<void> => {
  const result = await validateGoogleCredentials();
  res.json(result);
});

// ─── Campaign-level insights ───────────────────────────────────────────────────
router.get("/google/insights/campaign", async (req, res): Promise<void> => {
  const campaignId = parseInt(String(req.query.campaignId ?? ""), 10);
  if (isNaN(campaignId)) {
    res.status(400).json({ error: "Invalid campaignId" });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId));

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (!campaign.googleCampaignId) {
    res.status(400).json({ error: "Campaign has not been pushed to Google Ads yet" });
    return;
  }

  const { ok, missing } = checkGoogleAdsSecrets();
  if (!ok) {
    res.status(400).json({ error: `Missing Google Ads secrets: ${missing.join(", ")}` });
    return;
  }

  const datePreset = String(req.query.datePreset ?? "last_7d");
  const result = await getGoogleCampaignInsights(campaign.googleCampaignId, datePreset);
  res.json(result);
});

// ─── Push campaign to Google Ads ──────────────────────────────────────────────
router.post("/google/push/:campaignId", async (req, res): Promise<void> => {
  const campaignId = parseInt(req.params.campaignId ?? "", 10);
  if (isNaN(campaignId)) {
    res.status(400).json({ error: "Invalid campaignId" });
    return;
  }

  // Pre-flight: check all secrets before touching anything
  const { ok, missing } = checkGoogleAdsSecrets();
  if (!ok) {
    res.status(400).json({
      error: `Configure Google Ads credentials first. Missing: ${missing.join(", ")}`,
      missing,
    });
    return;
  }

  // Load campaign
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId));

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.approvalStatus !== "approved") {
    res.status(400).json({ error: "Campaign must be approved by Human Gate before pushing to Google Ads" });
    return;
  }
  if (campaign.googleCampaignId) {
    res.status(400).json({ error: "Campaign already pushed to Google Ads", googleCampaignId: campaign.googleCampaignId });
    return;
  }

  const channelType = getChannelTypeForObjective(campaign.objective);

  try {
    // ── Step 1: Create Google Campaign + Budget (channel-aware) ───────────────
    const { googleCampaignId } = await createGoogleCampaign({
      name: campaign.campaignName,
      objective: campaign.objective,
      dailyBudget: campaign.dailyBudget ? Number(campaign.dailyBudget) : null,
    });

    // Persist immediately — makes partial failures recoverable
    await db
      .update(campaignsTable)
      .set({ googleCampaignId, status: "active" })
      .where(eq(campaignsTable.id, campaign.id));

    let adGroupId: string | null = null;
    let adId: string | null = null;
    let note: string;

    // ── Step 2 & 3: Channel-specific ad group + ad ────────────────────────────
    if (channelType === "app") {
      // App campaigns (MULTI_CHANNEL / APP_CAMPAIGN subtype) are fully automated —
      // Google manages targeting and creatives. No ad groups or ads needed.
      // The operator must update the placeholder app ID in Google Ads Manager
      // before activating the campaign.
      note =
        "App campaign created. Update the app ID (currently a placeholder) and add headlines/descriptions in Google Ads Manager before activating. Google automates targeting and creative delivery.";
    } else if (channelType === "video") {
      // YouTube TrueView: create campaign + VIDEO_TRUE_VIEW_IN_STREAM ad group.
      // Video ad creation requires a YouTube video asset URL (youTubeVideoId) —
      // the operator must upload their video to YouTube and link it in Google Ads Manager.
      adGroupId = await createGoogleAdGroup({
        googleCampaignId,
        name: `${campaign.campaignName} – YouTube Ad Group 1`,
        channelType: "video",
      });
      note =
        "YouTube campaign and ad group created (VIDEO_TRUE_VIEW_IN_STREAM). Upload your video to YouTube and add a video ad in Google Ads Manager before activating — the AdClaw API cannot upload video assets.";
    } else if (channelType === "display") {
      // Display: campaign + DISPLAY_STANDARD ad group.
      // Responsive display ads require image assets — operator adds them in Google Ads Manager.
      adGroupId = await createGoogleAdGroup({
        googleCampaignId,
        name: `${campaign.campaignName} – Display Ad Group 1`,
        channelType: "display",
      });
      note =
        "Display campaign and ad group created. Add responsive display ad assets (images, headlines, descriptions) in Google Ads Manager before activating — image upload is not supported via the AdClaw API.";
    } else {
      // search (TRAFFIC, LEADS, SALES): full flow — ad group + responsive search ad
      adGroupId = await createGoogleAdGroup({
        googleCampaignId,
        name: `${campaign.campaignName} – Search Ad Group 1`,
        channelType: "search",
      });
      adId = await createGoogleAd({
        googleAdGroupId: adGroupId,
        headlines: [
          campaign.campaignName.substring(0, 30),
          "Solusi Terbaik Untuk Anda",
          "Hubungi Kami Sekarang",
          "Promo Terbatas",
          "Dapatkan Penawaran Spesial",
        ],
        descriptions: [
          "Temukan produk dan layanan berkualitas terbaik. Hubungi kami hari ini.",
          "Penawaran eksklusif untuk Anda. Jangan lewatkan kesempatan ini.",
        ],
        finalUrl: "https://example.com",
      });
      note =
        "Search ad created with placeholder copy. Update headlines, descriptions, and final URL in Google Ads Manager before activating.";
    }

    const channelLabels: Record<typeof channelType, string> = {
      search: "Search",
      display: "Display",
      video: "YouTube Video (TrueView)",
      app: "App Campaign",
    };

    res.json({
      success: true,
      message: `Campaign berhasil dipush ke Google Ads sebagai ${channelLabels[channelType]} campaign (status: PAUSED).`,
      googleCampaignId,
      adGroupId,
      adId,
      channelType,
      note,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Google Ads push failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Google Ads push failed",
    });
  }
});

export default router;
