import { Router, type IRouter } from "express";
import { count, eq, gte, sql } from "drizzle-orm";
import { db, businessesTable, campaignsTable, blueprintsTable, pipelineRunsTable, approvalsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totalBusinesses] = await db.select({ count: count() }).from(businessesTable);
  const [totalCampaigns] = await db.select({ count: count() }).from(campaignsTable);
  const [totalBlueprints] = await db.select({ count: count() }).from(blueprintsTable);

  const [pendingApprovals] = await db
    .select({ count: count() })
    .from(approvalsTable)
    .where(eq(approvalsTable.status, "pending"));

  const [activeCampaigns] = await db
    .select({ count: count() })
    .from(campaignsTable)
    .where(eq(campaignsTable.status, "active"));

  const [draftCampaigns] = await db
    .select({ count: count() })
    .from(campaignsTable)
    .where(eq(campaignsTable.status, "draft"));

  // Pipeline runs today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [pipelineRunsToday] = await db
    .select({ count: count() })
    .from(pipelineRunsTable)
    .where(gte(pipelineRunsTable.createdAt, todayStart));

  // Average conversion readiness score
  const [avgScore] = await db
    .select({ avg: sql<number>`AVG(conversion_readiness_score)` })
    .from(blueprintsTable);

  res.json({
    totalBusinesses: totalBusinesses.count,
    totalCampaigns: totalCampaigns.count,
    totalBlueprints: totalBlueprints.count,
    pendingApprovals: pendingApprovals.count,
    activeCampaigns: activeCampaigns.count,
    draftCampaigns: draftCampaigns.count,
    pipelineRunsToday: pipelineRunsToday.count,
    conversionReadinessAvg: avgScore.avg ? Number(avgScore.avg).toFixed(1) : 0,
  });
});

router.get("/dashboard/recent-campaigns", async (_req, res): Promise<void> => {
  const campaigns = await db
    .select()
    .from(campaignsTable)
    .orderBy(campaignsTable.createdAt)
    .limit(10);

  res.json(campaigns.map(c => ({
    ...c,
    dailyBudget: c.dailyBudget != null ? Number(c.dailyBudget) : null,
    lifetimeBudget: c.lifetimeBudget != null ? Number(c.lifetimeBudget) : null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  })));
});

router.get("/dashboard/pipeline-activity", async (_req, res): Promise<void> => {
  const runs = await db
    .select()
    .from(pipelineRunsTable)
    .orderBy(pipelineRunsTable.createdAt)
    .limit(20);

  res.json(runs.map(r => ({
    ...r,
    budget: r.budget != null ? Number(r.budget) : null,
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
  })));
});

export default router;
