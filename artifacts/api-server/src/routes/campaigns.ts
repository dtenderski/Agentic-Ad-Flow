import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, campaignsTable, approvalsTable, adsetsTable } from "@workspace/db";
import {
  ListCampaignsQueryParams,
  CreateCampaignBody,
  GetCampaignParams,
  UpdateCampaignParams,
  UpdateCampaignBody,
  DeleteCampaignParams,
  ApproveCampaignParams,
  ApproveCampaignBody,
} from "@workspace/api-zod";
import { searchMetaInterest } from "../lib/meta-ads";

const router: IRouter = Router();

const serializeCampaign = (c: typeof campaignsTable.$inferSelect) => ({
  ...c,
  dailyBudget: c.dailyBudget != null ? Number(c.dailyBudget) : null,
  lifetimeBudget: c.lifetimeBudget != null ? Number(c.lifetimeBudget) : null,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

router.get("/campaigns", async (req, res): Promise<void> => {
  const queryParams = ListCampaignsQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  let query = db.select().from(campaignsTable);
  if (queryParams.data.status) {
    const campaigns = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.status, queryParams.data.status))
      .orderBy(campaignsTable.createdAt);
    res.json(campaigns.map(serializeCampaign));
    return;
  }
  const campaigns = await query.orderBy(campaignsTable.createdAt);
  res.json(campaigns.map(serializeCampaign));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [campaign] = await db.insert(campaignsTable).values(parsed.data as typeof campaignsTable.$inferInsert).returning();

  // Create an approval record
  await db.insert(approvalsTable).values({
    entityType: "campaign",
    entityId: campaign.id,
    status: "pending",
  });

  res.status(201).json(serializeCampaign(campaign));
});

router.get("/campaigns/:campaignId", async (req, res): Promise<void> => {
  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.campaignId));
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(serializeCampaign(campaign));
});

router.patch("/campaigns/:campaignId", async (req, res): Promise<void> => {
  const params = UpdateCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [campaign] = await db
    .update(campaignsTable)
    .set(parsed.data as Partial<typeof campaignsTable.$inferInsert>)
    .where(eq(campaignsTable.id, params.data.campaignId))
    .returning();
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.json(serializeCampaign(campaign));
});

router.delete("/campaigns/:campaignId", async (req, res): Promise<void> => {
  const params = DeleteCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [campaign] = await db
    .delete(campaignsTable)
    .where(eq(campaignsTable.id, params.data.campaignId))
    .returning();
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  res.sendStatus(204);
});

// ─── Interest Preview (Task #6 & #7) ─────────────────────────────────────────
router.get("/campaigns/:campaignId/interest-preview", async (req, res): Promise<void> => {
  const params = GetCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, params.data.campaignId));
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const adsets = await db
    .select()
    .from(adsetsTable)
    .where(eq(adsetsTable.campaignId, params.data.campaignId));

  let totalInterests = 0;
  let matchedCount = 0;

  const adsetPreviews = await Promise.all(
    adsets.map(async (adset) => {
      let interests: string[] = [];
      if (adset.interests) {
        try { interests = JSON.parse(adset.interests); } catch { interests = []; }
      }

      const results = await Promise.all(
        interests.map(async (query) => {
          try {
            const matched = await searchMetaInterest(query);
            return { query, matched };
          } catch {
            return { query, matched: null };
          }
        })
      );

      totalInterests += results.length;
      matchedCount += results.filter((r) => r.matched !== null).length;

      return {
        adsetId: adset.id,
        adsetName: adset.adsetName,
        interests: results,
      };
    })
  );

  // canApprove is false only when there are interests listed but NONE resolved
  const adsetsWithInterests = adsetPreviews.filter((a) => a.interests.length > 0);
  const canApprove =
    adsetsWithInterests.length === 0 ||
    adsetsWithInterests.some((a) => a.interests.some((i) => i.matched !== null));

  res.json({
    adsets: adsetPreviews,
    totalInterests,
    matchedCount,
    hasUnmatchedInterests: matchedCount < totalInterests,
    canApprove,
  });
});

router.post("/campaigns/:campaignId/approve", async (req, res): Promise<void> => {
  const params = ApproveCampaignParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = ApproveCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Task #7: Block approval if interests are listed but zero match Meta
  if (parsed.data.decision === "approved") {
    const adsets = await db
      .select()
      .from(adsetsTable)
      .where(eq(adsetsTable.campaignId, params.data.campaignId));

    const adsetsWithInterests = adsets.filter((a) => {
      if (!a.interests) return false;
      try { return (JSON.parse(a.interests) as string[]).length > 0; } catch { return false; }
    });

    if (adsetsWithInterests.length > 0) {
      // Check if at least one interest resolves across all ad sets
      let anyMatch = false;
      for (const adset of adsetsWithInterests) {
        if (anyMatch) break;
        const interests: string[] = JSON.parse(adset.interests!);
        for (const query of interests) {
          try {
            const result = await searchMetaInterest(query);
            if (result) { anyMatch = true; break; }
          } catch { /* skip */ }
        }
      }
      if (!anyMatch) {
        res.status(400).json({
          error: "Cannot approve: no audience interests could be matched in Meta. Update interests or remove them before approving.",
          code: "NO_INTERESTS_MATCHED",
        });
        return;
      }
    }
  }

  const newApprovalStatus = parsed.data.decision === "approved" ? "approved" : "rejected";
  const newStatus = parsed.data.decision === "approved" ? "approved" : "draft";

  const [campaign] = await db
    .update(campaignsTable)
    .set({
      approvalStatus: newApprovalStatus,
      status: newStatus,
      approvedByUser: parsed.data.decision === "approved",
    })
    .where(eq(campaignsTable.id, params.data.campaignId))
    .returning();

  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  // Update the approval record
  await db
    .update(approvalsTable)
    .set({
      status: newApprovalStatus,
      reviewerNotes: parsed.data.notes,
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(approvalsTable.entityType, "campaign"),
        eq(approvalsTable.entityId, params.data.campaignId),
        eq(approvalsTable.status, "pending")
      )
    );

  res.json(serializeCampaign(campaign));
});

export default router;
