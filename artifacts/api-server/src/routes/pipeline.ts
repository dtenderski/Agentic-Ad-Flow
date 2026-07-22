import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pipelineRunsTable, blueprintsTable, businessesTable, productsTable, agentMemoryTable } from "@workspace/db";
import { RunPipelineBody, GetPipelineRunParams } from "@workspace/api-zod";
import { generateLLMBlueprint } from "../lib/llm-blueprint";

const router: IRouter = Router();

const serializePipelineRun = (r: typeof pipelineRunsTable.$inferSelect) => ({
  ...r,
  budget: r.budget != null ? Number(r.budget) : null,
  createdAt: r.createdAt.toISOString(),
  completedAt: r.completedAt ? r.completedAt.toISOString() : null,
});

router.post("/pipeline/run", async (req, res): Promise<void> => {
  const parsed = RunPipelineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessId, productId, campaignGoal, budget, targetLocation, targetAgeMin, targetAgeMax, additionalContext } = parsed.data;

  // Validate business and product exist
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId));
  if (!business) { res.status(404).json({ error: "Business not found" }); return; }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  // Load agent memory if available
  const [memory] = await db.select().from(agentMemoryTable).where(eq(agentMemoryTable.businessId, businessId));

  // Create pipeline run in running state
  const [run] = await db.insert(pipelineRunsTable).values({
    businessId,
    productId,
    campaignGoal,
    budget: String(budget),
    targetLocation,
    targetAgeMin,
    targetAgeMax,
    additionalContext,
    status: "running",
    agentLog: "[OpenClaw] Pipeline dimulai...\n[Business Claw] Menganalisis profil bisnis...",
  }).returning();

  try {
    // Generate blueprint via Claude AI
    const generated = await generateLLMBlueprint({
      businessName: business.businessName,
      industry: business.industry,
      productCategory: business.productCategory,
      location: business.location,
      website: business.website,
      whatsapp: business.whatsapp,
      targetMarket: business.targetMarket,
      valueProposition: business.valueProposition,
      brandVoice: business.brandVoice,
      complianceNotes: business.complianceNotes,
      productName: product.productName,
      description: product.description,
      price: product.price,
      promo: product.promo,
      benefit: product.benefit,
      painPoint: product.painPoint,
      proof: product.proof,
      guarantee: product.guarantee,
      cta: product.cta,
      landingPageUrl: product.landingPageUrl,
      campaignGoal,
      budget,
      targetLocation,
      targetAgeMin,
      targetAgeMax,
      additionalContext,
      agentMemory: memory ?? null,
    });

    // Save blueprint
    const [blueprint] = await db.insert(blueprintsTable).values({
      pipelineRunId: run.id,
      title: generated.title,
      businessContext: generated.businessContext,
      campaignStrategy: generated.campaignStrategy,
      audiencePlan: generated.audiencePlan,
      offerStrategy: generated.offerStrategy,
      creativeBlueprint: generated.creativeBlueprint,
      budgetPlan: generated.budgetPlan,
      policyReview: generated.policyReview,
      conversionReadinessScore: generated.conversionReadinessScore,
      policyRiskScore: generated.policyRiskScore,
      creativeStrengthScore: generated.creativeStrengthScore,
      funnelFitScore: generated.funnelFitScore,
      approvalStatus: "draft",
    }).returning();

    // Update run to completed
    const [completedRun] = await db
      .update(pipelineRunsTable)
      .set({ status: "completed", blueprintId: blueprint.id, completedAt: new Date(), agentLog: generated.agentLog })
      .where(eq(pipelineRunsTable.id, run.id))
      .returning();

    res.status(201).json(serializePipelineRun(completedRun));
  } catch (err: unknown) {
    // Mark run as failed
    await db.update(pipelineRunsTable).set({
      status: "failed",
      agentLog: `[OpenClaw] Pipeline gagal: ${err instanceof Error ? err.message : String(err)}`,
      completedAt: new Date(),
    }).where(eq(pipelineRunsTable.id, run.id));

    res.status(500).json({ error: err instanceof Error ? err.message : "Pipeline failed" });
  }
});

router.get("/pipeline", async (_req, res): Promise<void> => {
  const runs = await db.select().from(pipelineRunsTable).orderBy(pipelineRunsTable.createdAt);
  res.json(runs.map(serializePipelineRun));
});

router.get("/pipeline/:pipelineId", async (req, res): Promise<void> => {
  const params = GetPipelineRunParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [run] = await db.select().from(pipelineRunsTable).where(eq(pipelineRunsTable.id, params.data.pipelineId));
  if (!run) { res.status(404).json({ error: "Pipeline run not found" }); return; }

  let blueprint = null;
  if (run.blueprintId) {
    const [bp] = await db.select().from(blueprintsTable).where(eq(blueprintsTable.id, run.blueprintId));
    if (bp) blueprint = { ...bp, createdAt: bp.createdAt.toISOString() };
  }

  res.json({ ...serializePipelineRun(run), blueprint });
});

export default router;
