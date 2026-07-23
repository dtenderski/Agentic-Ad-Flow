import { deepseek, DEEPSEEK_MODEL } from "./ai-clients.js";
import { logger } from "./logger.js";

interface BlueprintInput {
  businessName: string;
  industry: string;
  productCategory?: string | null;
  location?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  targetMarket?: string | null;
  valueProposition?: string | null;
  brandVoice?: string | null;
  complianceNotes?: string | null;
  productName: string;
  description?: string | null;
  price?: string | null;
  promo?: string | null;
  benefit?: string | null;
  painPoint?: string | null;
  proof?: string | null;
  guarantee?: string | null;
  cta?: string | null;
  landingPageUrl?: string | null;
  campaignGoal: string;
  budget: number;
  targetLocation?: string | null;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
  additionalContext?: string | null;
  agentMemory?: {
    winningAudience?: string | null;
    winningCopy?: string | null;
    winningHeadline?: string | null;
    winningCta?: string | null;
    winningOffer?: string | null;
    failedPattern?: string | null;
    learningSummary?: string | null;
  } | null;
}

export interface GeneratedBlueprint {
  title: string;
  businessContext: string;
  campaignStrategy: string;
  audiencePlan: string;
  offerStrategy: string;
  creativeBlueprint: string;
  budgetPlan: string;
  policyReview: string;
  conversionReadinessScore: number;
  policyRiskScore: number;
  creativeStrengthScore: number;
  funnelFitScore: number;
  agentLog: string;
}

function buildSystemPrompt(): string {
  return `You are OpenClaw — a Meta Ads intelligence system running 7 specialist AI agents (MultiClaw) that work in sequence to produce a complete, research-grade advertising blueprint.

Your output must be a SINGLE valid JSON object with these exact top-level keys:
- title (string)
- businessContext (object)
- campaignStrategy (object)
- audiencePlan (object)
- offerStrategy (object)
- creativeBlueprint (object)
- budgetPlan (object)
- policyReview (object)
- scores (object with: conversionReadiness, policyRisk, creativeStrength, funnelFit — all integers 0-100)
- agentLog (string — multi-line narrative of each agent's reasoning)

CRITICAL RULES:
1. Output ONLY valid JSON. No markdown, no prose outside JSON.
2. Be specific and actionable — generic advice is worthless.
3. Use real Meta Ads terminology (campaign objectives, optimization events, placement types, etc.)
4. All copy must be in the same language as the target market's language.
5. Policy risk score = 100 means maximum risk (bad). 0 means clean.
6. Base all decisions on what actually converts on Meta/Facebook based on the industry and goal.`;
}

function buildUserPrompt(input: BlueprintInput): string {
  const memory = input.agentMemory;
  const memorySection = memory ? `
## Agent Memory (previous learnings for this business)
- Winning audience: ${memory.winningAudience || "none recorded"}
- Winning copy pattern: ${memory.winningCopy || "none recorded"}
- Winning headline: ${memory.winningHeadline || "none recorded"}
- Winning CTA: ${memory.winningCta || "none recorded"}
- Winning offer: ${memory.winningOffer || "none recorded"}
- Failed pattern (avoid): ${memory.failedPattern || "none recorded"}
- Learning summary: ${memory.learningSummary || "none recorded"}` : "";

  return `Run the full MultiClaw pipeline for this Meta Ads campaign. Produce a complete research-grade blueprint.

## Business Profile
- Business: ${input.businessName}
- Industry: ${input.industry}
- Product category: ${input.productCategory || "not specified"}
- Location: ${input.location || "not specified"}
- Website: ${input.website || "none"}
- WhatsApp: ${input.whatsapp || "none"}
- Target market: ${input.targetMarket || "not specified"}
- Value proposition: ${input.valueProposition || "not specified"}
- Brand voice: ${input.brandVoice || "professional"}
- Compliance notes: ${input.complianceNotes || "none"}

## Product / Offer
- Product: ${input.productName}
- Description: ${input.description || "not specified"}
- Price: ${input.price || "not specified"}
- Promo / special offer: ${input.promo || "none"}
- Key benefit: ${input.benefit || "not specified"}
- Pain point it solves: ${input.painPoint || "not specified"}
- Proof / social proof: ${input.proof || "none"}
- Guarantee: ${input.guarantee || "none"}
- CTA: ${input.cta || "Contact Us"}
- Landing page: ${input.landingPageUrl || "none"}

## Campaign Brief
- Goal: ${input.campaignGoal.toUpperCase()}
- Daily budget (IDR): ${input.budget.toLocaleString()}
- Target location: ${input.targetLocation || input.location || "Indonesia"}
- Target age range: ${input.targetAgeMin || 18}–${input.targetAgeMax || 65}
- Additional context: ${input.additionalContext || "none"}
${memorySection}

## Required JSON Output Structure

Produce exactly this structure (expand each section fully):

{
  "title": "...",
  "businessContext": {
    "diagnosis": "...",
    "marketPosition": "...",
    "competitiveAdvantage": "...",
    "buyerPersona": { "name": "...", "age": "...", "job": "...", "painPoints": [...], "desires": [...], "objections": [...] },
    "brandVoiceGuidelines": "...",
    "conversionBarriers": [...]
  },
  "campaignStrategy": {
    "recommendedObjective": "...",
    "buyingType": "AUCTION",
    "funnelApproach": "...",
    "campaignStructure": "...",
    "conversionLocation": "...",
    "optimizationEvent": "...",
    "specialAdCategory": false,
    "campaignBudgetOptimization": true,
    "strategicRationale": "..."
  },
  "audiencePlan": {
    "coldAudience": {
      "targetingType": "interest",
      "interests": [...],
      "demographics": { "location": "...", "ageMin": 0, "ageMax": 0, "gender": "all" },
      "estimatedReach": "...",
      "rationale": "..."
    },
    "warmAudience": {
      "targetingType": "retargeting",
      "source": "...",
      "retargetingWindow": "...",
      "rationale": "..."
    },
    "hotAudience": {
      "targetingType": "lookalike",
      "sourceAudience": "...",
      "similarity": "1-3%",
      "rationale": "..."
    },
    "exclusions": [...],
    "audienceInsights": "..."
  },
  "offerStrategy": {
    "coreOffer": "...",
    "leadMagnet": "...",
    "urgencyMechanism": "...",
    "scarcityElement": "...",
    "guarantee": "...",
    "riskReversal": "...",
    "offerStack": [...],
    "offerRationale": "..."
  },
  "creativeBlueprint": {
    "recommendedFormats": [...],
    "creativeAngles": [
      {
        "angle": "...",
        "hook": "...",
        "primaryText": "...",
        "headline": "...",
        "description": "...",
        "cta": "...",
        "visualDirection": "...",
        "whyItWorks": "..."
      }
    ],
    "videoScript": { "hook": "...", "problem": "...", "solution": "...", "proof": "...", "cta": "...", "duration": "..." },
    "copywritingPrinciples": [...],
    "abTestingPlan": "..."
  },
  "budgetPlan": {
    "recommendedDailyBudget": 0,
    "testingPhase": { "duration": "...", "adSetCount": 0, "creativesPerAdSet": 0, "budgetPerAdSet": 0, "totalTestBudget": 0 },
    "scalingPhase": { "triggerCondition": "...", "scaleMethod": "...", "scalingIncrement": "..." },
    "pauseRules": [...],
    "killRules": [...],
    "targetKPIs": { "cpc": "...", "ctr": "...", "cpl": "...", "roas": "..." },
    "budgetRationale": "..."
  },
  "policyReview": {
    "riskScore": 0,
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "sensitiveCategories": [...],
    "checklist": [{ "item": "...", "status": "PASS | WARN | FAIL", "note": "..." }],
    "prohibitedContent": [...],
    "recommendations": [...],
    "estimatedApprovalProbability": "..."
  },
  "scores": {
    "conversionReadiness": 0,
    "policyRisk": 0,
    "creativeStrength": 0,
    "funnelFit": 0
  },
  "agentLog": "..."
}`;
}

export async function generateLLMBlueprint(input: BlueprintInput): Promise<GeneratedBlueprint> {
  logger.info({ business: input.businessName, product: input.productName }, "Starting LLM blueprint generation (DeepSeek V3)");

  const response = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL,
    max_tokens: 8000,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(input) },
    ],
  });

  const rawText = response.choices[0]?.message?.content ?? "";

  // Strip any markdown code fences if the model added them
  const jsonText = rawText.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    logger.error({ err, rawText: rawText.slice(0, 500) }, "Failed to parse blueprint JSON response");
    throw new Error("Blueprint AI returned invalid JSON. Please retry.");
  }

  const scores = parsed.scores as Record<string, number> | undefined;

  const agentLog = [
    `[OpenClaw] Iniciando pipeline MultiClaw...`,
    `[Business Claw] Diagnosa bisnis: ${input.businessName} (${input.industry})`,
    `[Audience Claw] Riset segmen: ${input.targetMarket || "general market"}`,
    `[Offer Claw] Rekayasa penawaran: ${input.productName}`,
    `[Campaign Claw] Objective: ${input.campaignGoal.toUpperCase()}`,
    `[Creative Claw] Membuat ${Array.isArray((parsed.creativeBlueprint as Record<string, unknown>)?.creativeAngles) ? ((parsed.creativeBlueprint as Record<string, unknown>).creativeAngles as unknown[]).length : 3} copy angle`,
    `[Budget Claw] Budget harian: IDR ${input.budget.toLocaleString()}`,
    `[Policy Claw] Risk score: ${scores?.policyRisk ?? 0}/100`,
    `[Human Gate] Blueprint siap untuk review manusia.`,
    `[OpenClaw] Pipeline selesai. Skor konversi: ${scores?.conversionReadiness ?? 0}/100`,
    typeof parsed.agentLog === "string" ? parsed.agentLog : "",
  ].filter(Boolean).join("\n");

  return {
    title: `${input.businessName} — ${input.productName} Blueprint`,
    businessContext: JSON.stringify(parsed.businessContext ?? {}),
    campaignStrategy: JSON.stringify(parsed.campaignStrategy ?? {}),
    audiencePlan: JSON.stringify(parsed.audiencePlan ?? {}),
    offerStrategy: JSON.stringify(parsed.offerStrategy ?? {}),
    creativeBlueprint: JSON.stringify(parsed.creativeBlueprint ?? {}),
    budgetPlan: JSON.stringify(parsed.budgetPlan ?? {}),
    policyReview: JSON.stringify(parsed.policyReview ?? {}),
    conversionReadinessScore: scores?.conversionReadiness ?? 70,
    policyRiskScore: scores?.policyRisk ?? 20,
    creativeStrengthScore: scores?.creativeStrength ?? 70,
    funnelFitScore: scores?.funnelFit ?? 70,
    agentLog,
  };
}
