import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pipelineRunsTable, blueprintsTable, businessesTable, productsTable, agentMemoryTable } from "@workspace/db";
import { RunPipelineBody, GetPipelineRunParams } from "@workspace/api-zod";
import { generateLLMBlueprint } from "../lib/llm-blueprint";
import { searchMetaInterest } from "../lib/meta-ads";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ─── Interest Resolution ──────────────────────────────────────────────────────
// After the LLM generates the blueprint, resolve the suggested interest names
// against Meta's Targeting Search API so the Human Gate reviewer can see which
// interests actually matched (and which ones didn't) before approving a push.

interface ResolvedInterest {
  name: string;                // original name from Claude
  id?: string;                 // real Meta interest ID (present when resolved)
  resolvedName?: string;       // Meta's canonical name for the interest
  audienceSize?: number;       // lower-bound audience size from Meta
  resolved: boolean;           // true = found in Meta catalogue
}

async function resolveAudiencePlanInterests(audiencePlanJson: string): Promise<string> {
  let plan: Record<string, unknown>;
  try {
    plan = JSON.parse(audiencePlanJson);
  } catch {
    // If we can't parse the audience plan, return it unchanged
    return audiencePlanJson;
  }

  const cold = plan.coldAudience as Record<string, unknown> | undefined;
  const rawInterests = cold?.interests;
  if (!Array.isArray(rawInterests) || rawInterests.length === 0) {
    return audiencePlanJson;
  }

  const resolved: ResolvedInterest[] = [];
  for (const item of rawInterests.slice(0, 10)) {
    const name = typeof item === "string" ? item : String(item);
    try {
      const hit = await searchMetaInterest(name);
      if (hit) {
        resolved.push({ name, id: hit.id, resolvedName: hit.name, audienceSize: hit.audienceSize, resolved: true });
        logger.info({ interestName: name, metaId: hit.id, metaName: hit.name }, "Interest resolved at pipeline time");
      } else {
        resolved.push({ name, resolved: false });
        logger.warn({ interestName: name }, "Interest not found in Meta catalogue — will be skipped at push time");
      }
    } catch (err) {
      // Meta API unavailable or credentials not set — record as unresolved but don't fail the pipeline
      resolved.push({ name, resolved: false });
      logger.warn({ interestName: name, err }, "Could not reach Meta Interest Search API — interest marked unresolved");
    }
  }

  // Replace the plain interest-name array with the enriched resolved list
  const enrichedPlan = {
    ...plan,
    coldAudience: {
      ...cold,
      interests: resolved,
      interestResolutionSummary: `${resolved.filter(i => i.resolved).length}/${resolved.length} interests resolved via Meta Interest Search API`,
    },
  };

  return JSON.stringify(enrichedPlan);
}

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

    // Resolve interest names in the audience plan against Meta's Targeting Search API.
    // This enriches the stored blueprint with real IDs and resolution status so the
    // Human Gate reviewer can see exactly which interests will be targeted before approval.
    const enrichedAudiencePlan = await resolveAudiencePlanInterests(generated.audiencePlan);

    // Save blueprint
    const [blueprint] = await db.insert(blueprintsTable).values({
      pipelineRunId: run.id,
      title: generated.title,
      businessContext: generated.businessContext,
      campaignStrategy: generated.campaignStrategy,
      audiencePlan: enrichedAudiencePlan,
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
