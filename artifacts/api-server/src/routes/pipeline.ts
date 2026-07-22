import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, pipelineRunsTable, blueprintsTable, businessesTable, productsTable } from "@workspace/db";
import {
  RunPipelineBody,
  GetPipelineRunParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializePipelineRun = (r: typeof pipelineRunsTable.$inferSelect) => ({
  ...r,
  budget: r.budget != null ? Number(r.budget) : null,
  createdAt: r.createdAt.toISOString(),
  completedAt: r.completedAt ? r.completedAt.toISOString() : null,
});

// Generate a blueprint using rule-based agent simulation
async function generateBlueprint(
  pipelineRunId: number,
  business: typeof businessesTable.$inferSelect,
  product: typeof productsTable.$inferSelect,
  goal: string,
  budget: number,
  targetLocation?: string | null,
) {
  const objective = goal.toUpperCase() === "LEADS" ? "Leads"
    : goal.toUpperCase() === "SALES" ? "Sales"
    : goal.toUpperCase() === "TRAFFIC" ? "Traffic"
    : goal.toUpperCase() === "AWARENESS" ? "Awareness"
    : goal.toUpperCase() === "ENGAGEMENT" ? "Engagement"
    : "Leads";

  const businessContext = JSON.stringify({
    businessName: business.businessName,
    industry: business.industry,
    targetMarket: business.targetMarket || "General market",
    valueProposition: business.valueProposition || "Quality products/services",
    painPoints: product.painPoint || "Not specified",
    uniqueSellingProposition: product.benefit || "Competitive advantage",
    brandVoice: business.brandVoice || "Professional and trustworthy",
  });

  const audiencePlan = JSON.stringify({
    coldAudience: {
      interests: business.industry,
      location: targetLocation || business.location || "Indonesia",
      ageRange: "25-55",
      description: `People interested in ${business.industry} and related topics`,
    },
    warmAudience: {
      description: "Website visitors and social media engagers",
      retargeting: true,
    },
    hotAudience: {
      description: "Previous customers and lead form submitters",
      lookalike: true,
    },
    exclusions: "Existing customers (optional)",
  });

  const offerStrategy = JSON.stringify({
    mainOffer: product.promo || "Free consultation",
    guarantee: product.guarantee || "Satisfaction guarantee",
    urgency: "Limited slots available",
    scarcity: "This month only",
    cta: product.cta || "Contact Us",
    riskReversal: "No obligation consultation",
  });

  const campaignStrategy = JSON.stringify({
    objective,
    buyingType: "Auction",
    funnelStage: budget < 100000 ? "Testing" : "Scaling",
    conversionLocation: goal.toLowerCase() === "leads" ? "Instant Form / WhatsApp" : "Website",
    recommendedStructure: `3 Ad Sets x 2 Creatives for A/B testing`,
    funnelDescription: `Cold audience awareness → Retargeting → Conversion`,
  });

  const creativeBlueprint = JSON.stringify({
    formats: ["Single Image", "Video"],
    angles: [
      {
        name: "Problem-Solution",
        hook: `Are you struggling with ${product.painPoint || "your current challenges"}?`,
        primaryText: `${business.businessName} helps you overcome this with ${product.benefit || "proven solutions"}.`,
        headline: product.productName,
        description: "Practical, effective, and results-oriented.",
        cta: product.cta || "Contact Us",
      },
      {
        name: "Benefit-Led",
        hook: `Imagine achieving ${product.benefit || "your goals"} effortlessly.`,
        primaryText: `${product.productName} delivers ${product.benefit || "outstanding results"} with ${product.proof || "proven methods"}.`,
        headline: `Get Results with ${business.businessName}`,
        description: product.guarantee || "Quality guaranteed",
        cta: product.cta || "Learn More",
      },
    ],
    videoScript: `Opening hook: ${product.painPoint || "Common challenge"}. Solution: ${product.productName}. Proof: ${product.proof || "Results"}. CTA: ${product.cta || "Contact us today"}.`,
  });

  const budgetPlan = JSON.stringify({
    dailyBudget: budget,
    testingPhase: {
      duration: "7 days",
      adSetCount: 3,
      creativesPerAdSet: 2,
      budgetPerAdSet: Math.round(budget / 3),
    },
    evaluationRules: {
      pauseRule: "Pause creative if CTR < 1% after 3 days",
      scaleRule: "Scale budget by 20% every 3 days if CPL is within target",
      refreshRule: "Replace creative after frequency exceeds 3",
    },
    learningPhase: "Allow 50 optimization events before major changes",
  });

  const policyReview = JSON.stringify({
    riskScore: 20,
    riskLevel: "Low",
    checkedItems: [
      { item: "No excessive health claims", status: "Pass" },
      { item: "No misleading financial claims", status: "Pass" },
      { item: "No before/after imagery", status: "Pass" },
      { item: "No sensitive personal attributes", status: "Pass" },
      { item: "CTA is clear and compliant", status: "Pass" },
    ],
    warnings: [],
    recommendations: ["Keep claims factual and verifiable", "Include privacy policy URL in lead forms"],
  });

  // Score the blueprint
  const conversionReadinessScore = Math.min(100, 60 + (product.painPoint ? 10 : 0) + (product.benefit ? 10 : 0) + (product.proof ? 10 : 0) + (business.targetMarket ? 10 : 0));
  const policyRiskScore = 20;
  const creativeStrengthScore = Math.min(100, 55 + (product.painPoint ? 15 : 0) + (product.proof ? 15 : 0) + (product.guarantee ? 15 : 0));
  const funnelFitScore = Math.min(100, 65 + (product.landingPageUrl ? 20 : 0) + (business.whatsapp ? 15 : 0));

  const title = `${business.businessName} — ${product.productName} Blueprint`;

  const [blueprint] = await db.insert(blueprintsTable).values({
    pipelineRunId,
    title,
    businessContext,
    campaignStrategy,
    audiencePlan,
    offerStrategy,
    creativeBlueprint,
    budgetPlan,
    policyReview,
    conversionReadinessScore,
    policyRiskScore,
    creativeStrengthScore,
    funnelFitScore,
    approvalStatus: "draft",
  }).returning();

  return blueprint;
}

router.post("/pipeline/run", async (req, res): Promise<void> => {
  const parsed = RunPipelineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { businessId, productId, campaignGoal, budget, targetLocation, additionalContext } = parsed.data;

  // Validate business and product exist
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.id, businessId));
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  // Create pipeline run in pending state
  const [run] = await db.insert(pipelineRunsTable).values({
    businessId,
    productId,
    campaignGoal,
    budget: String(budget),
    targetLocation,
    additionalContext,
    status: "running",
    agentLog: "MultiClaw pipeline started...\n[Business Claw] Analyzing business profile...\n[Audience Claw] Segmenting target audience...\n[Offer Claw] Engineering conversion offer...\n[Campaign Claw] Selecting campaign objective...\n[Creative Claw] Generating copy variations...\n[Budget Claw] Planning testing budget...\n[Policy Claw] Checking compliance...\n[Human Gate] Awaiting review...",
  }).returning();

  // Generate the blueprint synchronously (simulates agent work)
  const blueprint = await generateBlueprint(run.id, business, product, campaignGoal, budget, targetLocation);

  // Update run to completed
  const [completedRun] = await db
    .update(pipelineRunsTable)
    .set({
      status: "completed",
      blueprintId: blueprint.id,
      completedAt: new Date(),
    })
    .where(eq(pipelineRunsTable.id, run.id))
    .returning();

  res.status(201).json(serializePipelineRun(completedRun));
});

router.get("/pipeline", async (_req, res): Promise<void> => {
  const runs = await db.select().from(pipelineRunsTable).orderBy(pipelineRunsTable.createdAt);
  res.json(runs.map(serializePipelineRun));
});

router.get("/pipeline/:pipelineId", async (req, res): Promise<void> => {
  const params = GetPipelineRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [run] = await db.select().from(pipelineRunsTable).where(eq(pipelineRunsTable.id, params.data.pipelineId));
  if (!run) {
    res.status(404).json({ error: "Pipeline run not found" });
    return;
  }

  let blueprint = null;
  if (run.blueprintId) {
    const [bp] = await db.select().from(blueprintsTable).where(eq(blueprintsTable.id, run.blueprintId));
    if (bp) {
      blueprint = {
        ...bp,
        createdAt: bp.createdAt.toISOString(),
      };
    }
  }

  res.json({
    ...serializePipelineRun(run),
    blueprint,
  });
});

export default router;
