import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable } from "@workspace/db";
import {
  checkLinkedInSecrets,
  validateLinkedInCredentials,
  createLinkedInCampaignGroup,
  createLinkedInCampaign,
  createLinkedInCreative,
  getLinkedInCampaignInsights,
} from "../lib/linkedin-ads";

const router: IRouter = Router();

// ─── Validate LinkedIn credentials ────────────────────────────────────────────
router.get("/linkedin/validate", async (_req, res): Promise<void> => {
  const result = await validateLinkedInCredentials();
  res.json(result);
});

// ─── Campaign-level insights ───────────────────────────────────────────────────
router.get("/linkedin/insights/campaign", async (req, res): Promise<void> => {
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
  if (!campaign.linkedinCampaignId) {
    res.status(400).json({ error: "Campaign has not been pushed to LinkedIn Ads yet" });
    return;
  }

  const { ok, missing } = checkLinkedInSecrets();
  if (!ok) {
    res.status(400).json({ error: `Missing LinkedIn Ads secrets: ${missing.join(", ")}` });
    return;
  }

  const datePreset = String(req.query.datePreset ?? "last_7d");
  const result = await getLinkedInCampaignInsights(
    campaign.linkedinCampaignId,
    datePreset,
    campaign.campaignName
  );
  res.json(result);
});

// ─── Push campaign to LinkedIn Campaign Manager ────────────────────────────────
router.post("/linkedin/push/:campaignId", async (req, res): Promise<void> => {
  const campaignId = parseInt(req.params.campaignId ?? "", 10);
  if (isNaN(campaignId)) {
    res.status(400).json({ error: "Invalid campaignId" });
    return;
  }

  // Pre-flight: check all 4 secrets
  const { ok, missing } = checkLinkedInSecrets();
  if (!ok) {
    res.status(400).json({
      error: `Configure LinkedIn Ads credentials first. Missing: ${missing.join(", ")}`,
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
    res.status(400).json({ error: "Campaign must be approved by Human Gate before pushing to LinkedIn Ads" });
    return;
  }
  if (campaign.linkedinCampaignId) {
    res.status(400).json({
      error: "Campaign already pushed to LinkedIn Ads",
      linkedinCampaignId: campaign.linkedinCampaignId,
    });
    return;
  }

  try {
    // 1. Create Campaign Group (LinkedIn requires campaigns to belong to a group)
    const campaignGroupId = await createLinkedInCampaignGroup({
      name: `${campaign.campaignName} – Group`,
    });

    // 2. Create Campaign
    const linkedinCampaignId = await createLinkedInCampaign({
      campaignGroupId,
      name: campaign.campaignName,
      objective: campaign.objective,
      dailyBudget: campaign.dailyBudget ? Number(campaign.dailyBudget) : null,
    });

    // Persist immediately for partial failure recovery
    await db
      .update(campaignsTable)
      .set({ linkedinCampaignId, status: "active" })
      .where(eq(campaignsTable.id, campaign.id));

    // 3. Create Text Ad Creative (placeholder — operator updates in Campaign Manager)
    let creativeId: string | null = null;
    let creativeNote: string;

    try {
      creativeId = await createLinkedInCreative({
        linkedinCampaignId,
        headline: campaign.campaignName.substring(0, 25),
        description: `Pelajari lebih lanjut tentang ${campaign.campaignName}`.substring(0, 75),
        destinationUrl: "https://example.com",
      });
      creativeNote =
        "Text Ad creative created with placeholder copy. Update headline (max 25 chars), description (max 75 chars), and destination URL in LinkedIn Campaign Manager before activating.";
    } catch (creativeErr: unknown) {
      req.log.warn({ creativeErr }, "LinkedIn creative creation failed — campaign created successfully");
      creativeNote =
        "Campaign and campaign group created. Creative creation requires additional setup — add Text Ad creatives in LinkedIn Campaign Manager before activating.";
    }

    res.json({
      success: true,
      message: `Campaign berhasil dipush ke LinkedIn Campaign Manager (status: PAUSED untuk review akhir).`,
      linkedinCampaignId,
      campaignGroupId,
      creativeId,
      note: creativeNote,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "LinkedIn push failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "LinkedIn push failed",
    });
  }
});

export default router;
