import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import {
  checkTikTokSecrets,
  validateTikTokCredentials,
  createTikTokCampaign,
  createTikTokAdGroup,
  createTikTokAd,
  getTikTokCampaignInsights,
} from "../lib/tiktok-ads";

const router: IRouter = Router();

// ─── Validate TikTok Ads credentials ─────────────────────────────────────────
router.get("/tiktok/validate", async (_req, res): Promise<void> => {
  const result = await validateTikTokCredentials();
  res.json(result);
});

// ─── Campaign-level insights ───────────────────────────────────────────────────
router.get("/tiktok/insights/campaign", async (req, res): Promise<void> => {
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
  if (!campaign.tiktokCampaignId) {
    res.status(400).json({ error: "Campaign has not been pushed to TikTok Ads yet" });
    return;
  }

  const { ok, missing } = checkTikTokSecrets();
  if (!ok) {
    res.status(400).json({ error: `Missing TikTok Ads secrets: ${missing.join(", ")}` });
    return;
  }

  const datePreset = String(req.query.datePreset ?? "last_7d");
  const result = await getTikTokCampaignInsights(campaign.tiktokCampaignId, datePreset);
  res.json(result);
});

// ─── Push campaign to TikTok Ads Manager ─────────────────────────────────────
router.post("/tiktok/push/:campaignId", async (req, res): Promise<void> => {
  const campaignId = parseInt(req.params.campaignId ?? "", 10);
  if (isNaN(campaignId)) {
    res.status(400).json({ error: "Invalid campaignId" });
    return;
  }

  // Pre-flight: check all 4 secrets before touching anything
  const { ok, missing } = checkTikTokSecrets();
  if (!ok) {
    res.status(400).json({
      error: `Configure TikTok Ads credentials first. Missing: ${missing.join(", ")}`,
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
    res.status(400).json({ error: "Campaign must be approved by Human Gate before pushing to TikTok Ads" });
    return;
  }
  if (campaign.tiktokCampaignId) {
    res.status(400).json({
      error: "Campaign already pushed to TikTok Ads",
      tiktokCampaignId: campaign.tiktokCampaignId,
    });
    return;
  }

  try {
    // 1. Create TikTok Campaign
    const tiktokCampaignId = await createTikTokCampaign({
      name: campaign.campaignName,
      objective: campaign.objective,
      dailyBudget: campaign.dailyBudget ? Number(campaign.dailyBudget) : null,
    });

    // Persist campaign ID immediately for partial failure recovery
    await db
      .update(campaignsTable)
      .set({ tiktokCampaignId, status: "active" })
      .where(eq(campaignsTable.id, campaign.id));

    // 2. Create Ad Group
    const adGroupId = await createTikTokAdGroup({
      tiktokCampaignId,
      name: `${campaign.campaignName} – Ad Group 1`,
      objective: campaign.objective,
      dailyBudget: campaign.dailyBudget ? Number(campaign.dailyBudget) : null,
    });

    // 3. Create Ad (placeholder — operator uploads video and links it in TikTok Ads Manager)
    // TikTok in-feed video ads require a video asset ID; we create the ad structure
    // without a video_id and note that the operator must attach the video.
    let adId: string | null = null;
    let adNote: string;

    try {
      adId = await createTikTokAd({
        tiktokAdGroupId: adGroupId,
        name: `${campaign.campaignName} – Ad 1`,
        adText: `${campaign.campaignName} — Solusi terbaik untuk Anda! Kunjungi kami sekarang.`.substring(0, 100),
        landingUrl: undefined, // operator sets in TikTok Ads Manager
      });
      adNote =
        "Ad created with placeholder copy. Upload your video to TikTok Creative Hub and attach it to this ad in TikTok Ads Manager before activating.";
    } catch (adErr: unknown) {
      // Ad creation may fail without a video asset — log and continue gracefully
      req.log.warn({ adErr }, "TikTok ad creation failed (likely missing video asset) — campaign and ad group created");
      adNote =
        "Campaign and ad group created successfully. Ad creation requires a video asset — upload your video in TikTok Ads Manager and create the ad there before activating.";
    }

    res.json({
      success: true,
      message: `Campaign berhasil dipush ke TikTok Ads Manager (status: DISABLE untuk review akhir).`,
      tiktokCampaignId,
      adGroupId,
      adId,
      note: adNote,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "TikTok push failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "TikTok push failed",
    });
  }
});

export default router;
