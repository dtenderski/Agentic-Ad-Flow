import { Router, type IRouter } from "express";
import { db, copilotReportsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { generateTrendBrief, generatePerformanceReport, interpretCommand } from "../lib/copilot-generator";

const router: IRouter = Router();

// ─── List reports (last 20) ───────────────────────────────────────────────────
router.get("/copilot/reports", async (_req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(copilotReportsTable)
    .orderBy(desc(copilotReportsTable.createdAt))
    .limit(20);

  res.json(
    reports.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

// ─── Manual trigger: trend brief ─────────────────────────────────────────────
router.post("/copilot/generate-brief", async (_req, res): Promise<void> => {
  try {
    const result = await generateTrendBrief();
    res.json({ success: true, reportId: result.id, response: result.response });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Brief generation failed",
    });
  }
});

// ─── Manual trigger: performance report ──────────────────────────────────────
router.post("/copilot/generate-report", async (_req, res): Promise<void> => {
  try {
    const result = await generatePerformanceReport();
    res.json({ success: true, reportId: result.id, response: result.response });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Report generation failed",
    });
  }
});

// ─── Command interpreter ──────────────────────────────────────────────────────
router.post("/copilot/command", async (req, res): Promise<void> => {
  const { message, businessId } = req.body as { message?: string; businessId?: number };
  if (!message || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    const result = await interpretCommand(message.trim(), businessId);
    res.json({
      success: true,
      reportId: result.id,
      response: result.response,
      toolsUsed: result.toolsUsed,
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Command failed",
    });
  }
});

export default router;
