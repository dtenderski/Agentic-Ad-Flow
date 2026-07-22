import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, campaignsTable, approvalsTable } from "@workspace/db";
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
  const [campaign] = await db.insert(campaignsTable).values(parsed.data).returning();

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
    .set(parsed.data)
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
