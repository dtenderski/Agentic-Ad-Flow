import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, campaignsTable, adsetsTable, creativesTable } from "@workspace/db";
import {
  validateMetaCredentials,
  createMetaCampaign,
  createMetaAdSet,
  createMetaAdCreative,
  createMetaAd,
  searchMetaInterests,
} from "../lib/meta-ads";
import { PushToMetaParams } from "@workspace/api-zod";

const router: IRouter = Router();

// ─── Interest Search ──────────────────────────────────────────────────────────
router.get("/meta/interests/search", async (req, res): Promise<void> => {
  const q = String(req.query.q ?? "").trim();
  if (!q) { res.status(400).json({ error: "q is required" }); return; }
  try {
    const results = await searchMetaInterests(q, 10);
    res.json({ data: results });
  } catch (err: unknown) {
    req.log.error({ err }, "Meta interest search failed");
    res.status(500).json({ error: err instanceof Error ? err.message : "Search failed" });
  }
});

// ─── Validate Meta credentials ────────────────────────────────────────────────
router.get("/meta/validate", async (_req, res): Promise<void> => {
  const result = await validateMetaCredentials();
  res.json(result);
});

// ─── Push campaign + ad sets + creatives to Meta Ads Manager ─────────────────
router.post("/meta/push/:campaignId", async (req, res): Promise<void> => {
  const params = PushToMetaParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  // Load campaign
  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, params.data.campaignId));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (campaign.approvalStatus !== "approved") {
    res.status(400).json({ error: "Campaign must be approved by Human Gate before pushing to Meta" });
    return;
  }

  const results: {
    metaCampaignId: string;
    adSets: { localId: number; metaAdsetId: string; ads: { localId: number; metaAdId: string }[] }[];
  } = { metaCampaignId: "", adSets: [] };

  try {
    // 1. Create Meta Campaign
    const metaCampaignId = await createMetaCampaign({
      name: campaign.campaignName,
      objective: campaign.objective,
      dailyBudget: campaign.dailyBudget ? Number(campaign.dailyBudget) : null,
      specialAdCategory: campaign.specialAdCategory,
      cbo: campaign.campaignBudgetOptimization,
    });

    results.metaCampaignId = metaCampaignId;

    // Update local campaign with Meta ID
    await db.update(campaignsTable).set({
      metaCampaignId,
      status: "active",
    }).where(eq(campaignsTable.id, campaign.id));

    // 2. Create Ad Sets
    const adsets = await db.select().from(adsetsTable).where(eq(adsetsTable.campaignId, campaign.id));

    for (const adset of adsets) {
      let interests: string[] = [];
      if (adset.interests) {
        try { interests = JSON.parse(adset.interests); } catch { interests = []; }
      }

      const metaAdsetId = await createMetaAdSet({
        campaignId: metaCampaignId,
        name: adset.adsetName,
        dailyBudget: adset.budget ? Number(adset.budget) : (campaign.dailyBudget ? Number(campaign.dailyBudget) / Math.max(adsets.length, 1) : 50000),
        optimizationGoal: adset.optimizationEvent || "LEAD",
        billingEvent: "IMPRESSIONS",
        targetingLocation: adset.location || undefined,
        targetingAgeMin: adset.ageMin || undefined,
        targetingAgeMax: adset.ageMax || undefined,
        targetingGender: adset.gender || undefined,
        targetingInterests: interests,
      });

      // Update local adset with Meta ID
      await db.update(adsetsTable).set({ metaAdsetId }).where(eq(adsetsTable.id, adset.id));

      // 3. Create Creatives + Ads for each ad set
      const creatives = await db.select().from(creativesTable).where(eq(creativesTable.adsetId, adset.id));
      const adResults: { localId: number; metaAdId: string }[] = [];

      for (const creative of creatives) {
        const metaCreativeId = await createMetaAdCreative({
          name: `${creative.adName} - Creative`,
          primaryText: creative.primaryText || "",
          headline: creative.headline || "",
          description: creative.description || "",
          linkUrl: creative.destinationUrl || undefined,
          callToActionType: creative.cta || "Contact Us",
        });

        const metaAdId = await createMetaAd({
          adsetId: metaAdsetId,
          name: creative.adName,
          creativeId: metaCreativeId,
        });

        adResults.push({ localId: creative.id, metaAdId });
      }

      results.adSets.push({ localId: adset.id, metaAdsetId, ads: adResults });
    }

    res.json({
      success: true,
      message: `Campaign berhasil dipush ke Meta Ads Manager (status: PAUSED untuk review akhir)`,
      results,
    });
  } catch (err: unknown) {
    req.log.error({ err }, "Meta push failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Meta push failed",
      partialResults: results,
    });
  }
});

export default router;
