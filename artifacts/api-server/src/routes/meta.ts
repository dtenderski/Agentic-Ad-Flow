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
  getAdAccountInsights,
  getMetaCampaignInsights,
  getMetaTokenInfo,
  refreshMetaToken,
  resolveInterests,
} from "../lib/meta-ads";
import { checkInterestGate, type AdSetResolutionResult } from "../lib/interest-gate";
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

// ─── Token Info ───────────────────────────────────────────────────────────────
router.get("/meta/token/info", async (_req, res): Promise<void> => {
  const result = await getMetaTokenInfo();
  res.json(result);
});

// ─── Token Refresh ────────────────────────────────────────────────────────────
router.post("/meta/token/refresh", async (_req, res): Promise<void> => {
  const result = await refreshMetaToken();
  if (!result.success) {
    res.status(500).json(result);
    return;
  }
  res.json(result);
});

// ─── Account-level Insights ───────────────────────────────────────────────────
router.get("/meta/insights/account", async (req, res): Promise<void> => {
  const datePreset = String(req.query.datePreset ?? "last_7d");
  const result = await getAdAccountInsights(datePreset);
  if (!result) {
    res.json(null);
    return;
  }
  res.json(result);
});

// ─── Campaign-level Insights (by local campaign ID) ───────────────────────────
router.get("/meta/insights/campaign", async (req, res): Promise<void> => {
  const campaignId = parseInt(String(req.query.campaignId ?? ""), 10);
  if (isNaN(campaignId)) { res.status(400).json({ error: "Invalid campaignId" }); return; }

  const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, campaignId));
  if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }
  if (!campaign.metaCampaignId) {
    res.status(400).json({ error: "Campaign has not been pushed to Meta yet" });
    return;
  }

  const datePreset = String(req.query.datePreset ?? "last_7d");
  const result = await getMetaCampaignInsights(campaign.metaCampaignId, datePreset);
  res.json(result);
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

  // Helper: parse interest arrays from a raw interests JSON string
  function parseAdsetInterests(interestsJson: string | null): {
    interestNames: string[];
    preResolvedInterests: { id: string; name: string }[];
  } {
    const interestNames: string[] = [];
    const preResolvedInterests: { id: string; name: string }[] = [];
    if (!interestsJson) return { interestNames, preResolvedInterests };
    try {
      const parsed = JSON.parse(interestsJson);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === "string") {
            interestNames.push(item);
          } else if (item && typeof item === "object") {
            if (item.resolved && item.id) {
              preResolvedInterests.push({ id: item.id, name: item.resolvedName || item.name });
            } else if (item.name) {
              interestNames.push(item.name);
            }
          }
        }
      }
    } catch { /* leave both arrays empty */ }
    return { interestNames, preResolvedInterests };
  }

  try {
    // Load ad sets early — needed for the interest pre-resolution pass below.
    const adsets = await db.select().from(adsetsTable).where(eq(adsetsTable.campaignId, campaign.id));

    // ── Interest pre-resolution pass (always runs) ─────────────────────────────
    // We must know actual resolution outcomes *before* creating anything in Meta,
    // because interest names can be present yet fail the Targeting Search API.
    //
    // Default behaviour: block the push when any ad set resolves to zero interests.
    // Set ALLOW_ZERO_INTEREST_PUSH=true to downgrade to warnings-only.
    const allowZeroInterest = process.env.ALLOW_ZERO_INTEREST_PUSH === "true";
    const resolutionResults: AdSetResolutionResult[] = [];
    const resolvedByAdsetId = new Map<number, { id: string; name: string }[]>();

    for (const adset of adsets) {
      const { interestNames, preResolvedInterests } = parseAdsetInterests(adset.interests);
      const hadInput = interestNames.length > 0 || preResolvedInterests.length > 0;
      const { resolved, errorCount } = await resolveInterests(interestNames, preResolvedInterests);
      resolvedByAdsetId.set(adset.id, resolved);
      resolutionResults.push({ id: adset.id, name: adset.adsetName, resolved, hadInput, errorCount });
    }

    const gate = checkInterestGate(resolutionResults, allowZeroInterest);
    if (gate.blocked) {
      res.status(400).json({ error: gate.blockError });
      return;
    }

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

    // 2. Create Ad Sets — pass pre-resolved interests so createMetaAdSet skips
    //    a redundant second round of Meta API calls.

    for (const adset of adsets) {
      const { id: metaAdsetId } = await createMetaAdSet({
        campaignId: metaCampaignId,
        name: adset.adsetName,
        dailyBudget: adset.budget ? Number(adset.budget) : (campaign.dailyBudget ? Number(campaign.dailyBudget) / Math.max(adsets.length, 1) : 50000),
        optimizationGoal: adset.optimizationEvent || "LEAD",
        billingEvent: "IMPRESSIONS",
        placement: campaign.placement || "facebook",
        targetingLocation: adset.location || undefined,
        targetingAgeMin: adset.ageMin || undefined,
        targetingAgeMax: adset.ageMax || undefined,
        targetingGender: adset.gender || undefined,
        fullyResolvedInterests: resolvedByAdsetId.get(adset.id),
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
          placement: campaign.placement || "facebook",
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
      ...(gate.warnings.length > 0 ? { warnings: gate.warnings } : {}),
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
