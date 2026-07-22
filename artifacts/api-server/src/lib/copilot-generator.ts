import Anthropic from "@anthropic-ai/sdk";
import { db, copilotReportsTable, campaignsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger";
import { getAdAccountInsights, getMetaCampaignInsights } from "./meta-ads";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-4-6";

// ─── Trend Brief (06:00 WIB) ──────────────────────────────────────────────────

export async function generateTrendBrief(): Promise<{ id: number; response: string }> {
  logger.info("Generating morning trend brief");

  // Pull yesterday's account insights for context
  let insightsSnapshot: string = "No Meta data available (credentials not configured).";
  let metaDataJson: string | null = null;
  try {
    const insights = await getAdAccountInsights("yesterday");
    if (insights) {
      metaDataJson = JSON.stringify(insights);
      insightsSnapshot = `
Yesterday's Meta Account Performance:
- Spend: IDR ${insights.spend.toLocaleString("id-ID")}
- Impressions: ${insights.impressions.toLocaleString("id-ID")}
- Clicks: ${insights.clicks.toLocaleString("id-ID")}
- CTR: ${insights.ctr.toFixed(2)}%
- CPC: IDR ${insights.cpc.toLocaleString("id-ID")}
- Leads: ${insights.leads}
- CPL: IDR ${insights.cpl > 0 ? insights.cpl.toLocaleString("id-ID") : "—"}
- Reach: ${insights.reach.toLocaleString("id-ID")}
- Frequency: ${insights.frequency.toFixed(2)}x
`.trim();
    }
  } catch (err) {
    logger.warn({ err }, "Could not fetch Meta insights for trend brief");
  }

  const systemPrompt = `You are AdClaw Copilot — an AI Marketing Analyst for Indonesian Meta Ads operators. You produce concise, actionable daily briefings in a mix of English and Bahasa Indonesia that marketers can act on immediately. Your tone is sharp, data-driven, and direct. Always use IDR formatting for currency. Format output as clean Markdown.`;

  const userPrompt = `Generate today's Morning Trend Brief. Today is ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

${insightsSnapshot}

Your brief must cover (use markdown headers):
1. **📊 Ringkasan Kemarin** — 2-3 sentences interpreting yesterday's numbers. Highlight what's good and what needs attention.
2. **🔥 Tren & Angle Hari Ini** — 3 specific creative angle recommendations for today, based on current Indonesian market trends (Ramadan if applicable, seasonal events, platform algorithm behavior). Each angle: name + 1-sentence hook.
3. **👥 Sinyal Audience** — Any audience fatigue signals or opportunities (frequency too high? CTR dropping? Time to refresh creatives?).
4. **✅ 3 Action Items Hari Ini** — Three specific, executable actions the operator should take before noon. Be specific (e.g., "Pause ad set X if CTR < 1% by 10am", not "Check performance").
5. **⚡ Quick Win** — One tactic that can be implemented in under 15 minutes for an immediate impact.

Be specific, not generic. Reference actual numbers when available.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const response = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  const [report] = await db.insert(copilotReportsTable).values({
    type: "trend_brief",
    prompt: userPrompt,
    response,
    metaData: metaDataJson,
  }).returning();

  logger.info({ reportId: report.id }, "Trend brief generated and stored");
  return { id: report.id, response };
}

// ─── Performance Report (16:00 WIB) ──────────────────────────────────────────

export async function generatePerformanceReport(): Promise<{ id: number; response: string }> {
  logger.info("Generating afternoon performance report");

  // Pull today's account insights + per-campaign breakdown
  let accountSnapshot = "No account data available.";
  let campaignSnapshots = "No campaign data available.";
  let metaDataJson: string | null = null;

  try {
    const [accountInsights, activeCampaigns] = await Promise.all([
      getAdAccountInsights("today"),
      db.select().from(campaignsTable)
        .where(eq(campaignsTable.status, "active"))
        .orderBy(desc(campaignsTable.updatedAt))
        .limit(10),
    ]);

    if (accountInsights) {
      accountSnapshot = `
Today's Account Totals (so far):
- Spend: IDR ${accountInsights.spend.toLocaleString("id-ID")}
- Impressions: ${accountInsights.impressions.toLocaleString("id-ID")}
- Clicks: ${accountInsights.clicks.toLocaleString("id-ID")}
- CTR: ${accountInsights.ctr.toFixed(2)}%
- Leads: ${accountInsights.leads}
- CPL: IDR ${accountInsights.cpl > 0 ? accountInsights.cpl.toLocaleString("id-ID") : "—"}
- Reach: ${accountInsights.reach.toLocaleString("id-ID")}
- Frequency: ${accountInsights.frequency.toFixed(2)}x`.trim();
    }

    if (activeCampaigns.length > 0) {
      const campaignDataParts: string[] = [];
      for (const campaign of activeCampaigns.slice(0, 5)) {
        if (!campaign.metaCampaignId) continue;
        try {
          const ci = await getMetaCampaignInsights(campaign.metaCampaignId, "today");
          if (ci) {
            const cpl = ci.leads > 0 ? ci.spend / ci.leads : 0;
            campaignDataParts.push(`- "${campaign.campaignName}" [${campaign.placement ?? "facebook"}]: Spend IDR ${ci.spend.toLocaleString("id-ID")}, CTR ${ci.ctr.toFixed(2)}%, Leads ${ci.leads}, CPL IDR ${cpl > 0 ? cpl.toLocaleString("id-ID") : "—"}`);
          }
        } catch (e) {
          campaignDataParts.push(`- "${campaign.campaignName}": no data`);
        }
      }
      if (campaignDataParts.length > 0) campaignSnapshots = campaignDataParts.join("\n");
    }

    metaDataJson = JSON.stringify({ account: accountInsights, campaignCount: activeCampaigns.length });
  } catch (err) {
    logger.warn({ err }, "Could not fetch Meta insights for performance report");
  }

  const systemPrompt = `You are AdClaw Copilot — an AI Performance Analyst for Indonesian Meta Ads operators. You give direct, decisive verdicts on campaign performance. Be blunt: if a campaign is underperforming, say so and say exactly what to do. Format output as clean Markdown. Use IDR for currency. Mix English and Bahasa Indonesia naturally.`;

  const userPrompt = `Generate today's 16:00 WIB Performance Report for ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

${accountSnapshot}

Per-Campaign Breakdown:
${campaignSnapshots}

Your report must cover:
1. **📈 Verdict Hari Ini** — 2-3 sentences on today's overall performance. Are we on track? Under/over spend?
2. **🎯 Campaign Scorecard** — For each campaign with data: one-line verdict (SCALE ✅ | HOLD ⏸ | PAUSE ❌ | REFRESH 🔄) with the key reason (e.g., "CPL IDR 45rb — below target, scale budget 20%").
3. **💰 Budget Pacing** — Is daily spend on track? Any campaign burning too fast or too slow?
4. **🔴 Alert** — Anything critical that needs action NOW (high CPL, zero leads, policy flag risk, etc.).
5. **📋 End-of-Day Actions** — 3 specific things to do before EOD to protect tomorrow's performance.

Be decisive. Use real numbers. Flag anything above IDR 150rb CPL as critical.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const response = message.content
    .filter(b => b.type === "text")
    .map(b => (b as { type: "text"; text: string }).text)
    .join("");

  const [report] = await db.insert(copilotReportsTable).values({
    type: "performance_report",
    prompt: userPrompt,
    response,
    metaData: metaDataJson,
  }).returning();

  logger.info({ reportId: report.id }, "Performance report generated and stored");
  return { id: report.id, response };
}

// ─── Command Interpreter ──────────────────────────────────────────────────────

export interface CommandToolResult {
  tool: string;
  result: unknown;
  error?: string;
}

type ToolInput =
  | { name: "get_account_summary"; input: Record<string, never> }
  | { name: "get_insights"; input: { campaign_id: string; date_preset?: string } }
  | { name: "pause_campaign"; input: { campaign_id: string } }
  | { name: "resume_campaign"; input: { campaign_id: string } }
  | { name: "update_budget"; input: { campaign_id: string; new_daily_budget: number } }
  | { name: "list_active_campaigns"; input: Record<string, never> };

async function executeTool(toolUse: ToolInput): Promise<unknown> {
  switch (toolUse.name) {
    case "get_account_summary": {
      const insights = await getAdAccountInsights("today");
      return insights ?? { message: "No data available for today" };
    }

    case "get_insights": {
      const { campaign_id, date_preset = "today" } = toolUse.input;
      // Find campaign by local ID or meta campaign ID
      const localId = parseInt(campaign_id, 10);
      let metaCampaignId = campaign_id;
      if (!isNaN(localId)) {
        const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, localId));
        if (c?.metaCampaignId) metaCampaignId = c.metaCampaignId;
      }
      const insights = await getMetaCampaignInsights(metaCampaignId, date_preset);
      return insights ?? { message: "No data available" };
    }

    case "list_active_campaigns": {
      const campaigns = await db.select({
        id: campaignsTable.id,
        campaignName: campaignsTable.campaignName,
        status: campaignsTable.status,
        metaCampaignId: campaignsTable.metaCampaignId,
        placement: campaignsTable.placement,
        dailyBudget: campaignsTable.dailyBudget,
      }).from(campaignsTable).orderBy(desc(campaignsTable.updatedAt)).limit(20);
      return campaigns;
    }

    case "pause_campaign": {
      const { campaign_id } = toolUse.input;
      const localId = parseInt(campaign_id, 10);
      if (isNaN(localId)) throw new Error("campaign_id must be a local integer ID");
      await db.update(campaignsTable).set({ status: "paused" }).where(eq(campaignsTable.id, localId));
      return { success: true, message: `Campaign ${campaign_id} paused in AdClaw (Meta status unchanged — push update separately)` };
    }

    case "resume_campaign": {
      const { campaign_id } = toolUse.input;
      const localId = parseInt(campaign_id, 10);
      if (isNaN(localId)) throw new Error("campaign_id must be a local integer ID");
      await db.update(campaignsTable).set({ status: "active" }).where(eq(campaignsTable.id, localId));
      return { success: true, message: `Campaign ${campaign_id} resumed in AdClaw` };
    }

    case "update_budget": {
      const { campaign_id, new_daily_budget } = toolUse.input;
      const localId = parseInt(campaign_id, 10);
      if (isNaN(localId)) throw new Error("campaign_id must be a local integer ID");
      await db.update(campaignsTable).set({ dailyBudget: String(new_daily_budget) }).where(eq(campaignsTable.id, localId));
      return { success: true, message: `Budget updated to IDR ${new_daily_budget.toLocaleString("id-ID")} for campaign ${campaign_id} in AdClaw (push to Meta separately)` };
    }

    default:
      throw new Error(`Unknown tool: ${(toolUse as { name: string }).name}`);
  }
}

const COPILOT_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "get_account_summary",
    description: "Get today's overall Meta Ads account performance summary (spend, leads, CTR, CPL).",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_insights",
    description: "Get performance insights for a specific campaign. Use local campaign ID (integer).",
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string", description: "Local campaign ID (integer) or Meta campaign ID" },
        date_preset: { type: "string", description: "Date range: today, yesterday, last_7d, last_30d", enum: ["today", "yesterday", "last_7d", "last_30d"] },
      },
      required: ["campaign_id"],
    },
  },
  {
    name: "list_active_campaigns",
    description: "List all campaigns in AdClaw with their IDs, names, status, placement, and budget.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "pause_campaign",
    description: "Pause a campaign in AdClaw (updates local status to paused).",
    input_schema: {
      type: "object" as const,
      properties: { campaign_id: { type: "string", description: "Local campaign ID (integer)" } },
      required: ["campaign_id"],
    },
  },
  {
    name: "resume_campaign",
    description: "Resume/activate a paused campaign in AdClaw.",
    input_schema: {
      type: "object" as const,
      properties: { campaign_id: { type: "string", description: "Local campaign ID (integer)" } },
      required: ["campaign_id"],
    },
  },
  {
    name: "update_budget",
    description: "Update the daily budget for a campaign in AdClaw (in IDR).",
    input_schema: {
      type: "object" as const,
      properties: {
        campaign_id: { type: "string", description: "Local campaign ID (integer)" },
        new_daily_budget: { type: "number", description: "New daily budget in IDR (e.g. 100000 for 100rb)" },
      },
      required: ["campaign_id", "new_daily_budget"],
    },
  },
];

export async function interpretCommand(message: string, businessId?: number): Promise<{ id: number; response: string; toolsUsed: string[] }> {
  logger.info({ message, businessId }, "Interpreting copilot command");

  const systemPrompt = `You are AdClaw Copilot — an AI Marketing Assistant for Indonesian Meta Ads operators. You understand commands in Bahasa Indonesia and English. When the user asks you to do something, use the available tools to fetch data or execute actions, then respond naturally in the same language they used. Always confirm what you did. Use IDR for currency formatting.

Important: You manage campaigns in AdClaw (local database). Status changes in AdClaw don't automatically sync to Meta Ads Manager — tell the user if they need to also update in Meta directly.`;

  const toolsUsed: string[] = [];

  // Agentic loop: run until Claude stops using tools
  let messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: message }];
  let finalResponse = "";

  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      tools: COPILOT_TOOLS,
      messages,
    });

    // Collect any text from this turn
    const textBlocks = response.content.filter(b => b.type === "text");
    if (textBlocks.length > 0) {
      finalResponse = textBlocks.map(b => (b as { type: "text"; text: string }).text).join("");
    }

    if (response.stop_reason === "end_turn") break;

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(b => b.type === "tool_use") as Anthropic.Messages.ToolUseBlock[];

      // Add assistant's response to messages
      messages.push({ role: "assistant", content: response.content });

      // Execute all tool calls
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        toolsUsed.push(toolUse.name);
        try {
          const result = await executeTool(toolUse as unknown as ToolInput);
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  const [report] = await db.insert(copilotReportsTable).values({
    type: "command_response",
    businessId: businessId ?? null,
    prompt: message,
    response: finalResponse,
    metaData: JSON.stringify({ toolsUsed }),
  }).returning();

  logger.info({ reportId: report.id, toolsUsed }, "Command interpreted and stored");
  return { id: report.id, response: finalResponse, toolsUsed };
}
