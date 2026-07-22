import { Router, type IRouter } from "express";
import { db, approvalsTable } from "@workspace/db";

const router: IRouter = Router();

const serializeApproval = (a: typeof approvalsTable.$inferSelect) => ({
  ...a,
  createdAt: a.createdAt.toISOString(),
  reviewedAt: a.reviewedAt ? a.reviewedAt.toISOString() : null,
});

router.get("/approvals", async (_req, res): Promise<void> => {
  const approvals = await db
    .select()
    .from(approvalsTable)
    .orderBy(approvalsTable.createdAt);
  res.json(approvals.map(serializeApproval));
});

export default router;
