import OpenAI from "openai";
import { db, copilotReportsTable, campaignsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "./logger.js";
import {
  getAdAccountInsights,
  getMetaCampaignInsights,
  updateMetaCampaignStatus,
  updateMetaCampaignBudget,
} from "./meta-ads.js";
import {
  deepseek, DEEPSEEK_MODEL,
  gemini, GEMINI_MODEL,
  qwen, QWEN_MODEL,
  openai, OPENAI_TOOL_MODEL,
} from "./ai-clients.js";

// ─── Trend Brief (06:00 WIB) — Gemini 2.0 Flash ──────────────────────────────

export async function generateTrendBrief(): Promise<{ id: number; response: string }> {
  logger.info("Generating morning trend brief (Gemini 2.0 Flash)");

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

  let response = "";
  try {
    const message = await gemini.chat.completions.create({
      model: GEMINI_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    response = message.choices[0]?.message?.content ?? "";
    logger.info("Trend brief generated via Gemini");
  } catch (geminiErr) {
    logger.warn({ err: geminiErr }, "Gemini failed for trend brief — falling back to DeepSeek");
    const fallback = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      max_tokens: 2000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    response = fallback.choices[0]?.message?.content ?? "";
    logger.info("Trend brief generated via DeepSeek (fallback)");
  }

  const [report] = await db.insert(copilotReportsTable).values({
    type: "trend_brief",
    prompt: userPrompt,
    response,
    metaData: metaDataJson,
  }).returning();

  logger.info({ reportId: report.id }, "Trend brief generated and stored");
  return { id: report.id, response };
}

// ─── Performance Report (16:00 WIB) — Qwen Max ───────────────────────────────

export async function generatePerformanceReport(): Promise<{ id: number; response: string }> {
  logger.info("Generating afternoon performance report (Qwen Max)");

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

  let response = "";
  try {
    const message = await qwen.chat.completions.create({
      model: QWEN_MODEL,
      max_tokens: 2500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    response = message.choices[0]?.message?.content ?? "";
    logger.info("Performance report generated via Qwen");
  } catch (qwenErr) {
    logger.warn({ err: qwenErr }, "Qwen failed for performance report — falling back to DeepSeek");
    const fallback = await deepseek.chat.completions.create({
      model: DEEPSEEK_MODEL,
      max_tokens: 2500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    response = fallback.choices[0]?.message?.content ?? "";
    logger.info("Performance report generated via DeepSeek (fallback)");
  }

  const [report] = await db.insert(copilotReportsTable).values({
    type: "performance_report",
    prompt: userPrompt,
    response,
    metaData: metaDataJson,
  }).returning();

  logger.info({ reportId: report.id }, "Performance report generated and stored");
  return { id: report.id, response };
}

// ─── Command Interpreter — GPT-4o-mini (most reliable tool calling) ──────────

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

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_account_summary": {
      const insights = await getAdAccountInsights("today");
      return insights ?? { message: "No data available for today" };
    }

    case "get_insights": {
      const campaign_id = args.campaign_id as string;
      const date_preset = (args.date_preset as string) ?? "today";
      const localId = parseInt(campaign_id, 10);
      if (!isNaN(localId)) {
        const [c] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, localId));
        if (c?.platform === "google" && c.googleCampaignId) {
          const { getGoogleCampaignInsights } = await import("./google-ads.js");
          const insights = await getGoogleCampaignInsights(c.googleCampaignId, date_preset);
          return insights ?? { message: "No Google Ads data available for this period" };
        }
        if (c?.platform === "tiktok" && c.tiktokCampaignId) {
          const { getTikTokCampaignInsights } = await import("./tiktok-ads.js");
          const insights = await getTikTokCampaignInsights(c.tiktokCampaignId, date_preset);
          return insights ?? { message: "No TikTok Ads data available for this period" };
        }
        if (c?.platform === "linkedin" && c.linkedinCampaignId) {
          const { getLinkedInCampaignInsights } = await import("./linkedin-ads.js");
          const insights = await getLinkedInCampaignInsights(c.linkedinCampaignId, date_preset, c.campaignName);
          return insights ?? { message: "No LinkedIn Ads data available for this period" };
        }
        if (c?.metaCampaignId) {
          const insights = await getMetaCampaignInsights(c.metaCampaignId, date_preset);
          return insights ?? { message: "No data available" };
        }
        return { message: "Campaign has not been pushed to an ad platform yet" };
      }
      const insights = await getMetaCampaignInsights(campaign_id, date_preset);
      return insights ?? { message: "No data available" };
    }

    case "list_active_campaigns": {
      const campaigns = await db.select({
        id: campaignsTable.id,
        campaignName: campaignsTable.campaignName,
        status: campaignsTable.status,
        platform: campaignsTable.platform,
        metaCampaignId: campaignsTable.metaCampaignId,
        placement: campaignsTable.placement,
        dailyBudget: campaignsTable.dailyBudget,
      }).from(campaignsTable).orderBy(desc(campaignsTable.updatedAt)).limit(20);
      return campaigns;
    }

    case "pause_campaign": {
      const campaign_id = args.campaign_id as string;
      const localId = parseInt(campaign_id, 10);
      if (isNaN(localId)) throw new Error("campaign_id must be a local integer ID");
      const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, localId));
      if (!campaign) throw new Error(`Campaign ${campaign_id} not found`);
      if (campaign.metaCampaignId) {
        await updateMetaCampaignStatus(campaign.metaCampaignId, "PAUSED");
        await db.update(campaignsTable).set({ status: "paused" }).where(eq(campaignsTable.id, localId));
        return { success: true, message: `Campaign "${campaign.campaignName}" paused in both AdClaw and Meta Ads Manager.` };
      }
      await db.update(campaignsTable).set({ status: "paused" }).where(eq(campaignsTable.id, localId));
      return { success: true, message: `Campaign "${campaign.campaignName}" paused in AdClaw. (Not yet pushed to Meta — no Meta update needed.)` };
    }

    case "resume_campaign": {
      const campaign_id = args.campaign_id as string;
      const localId = parseInt(campaign_id, 10);
      if (isNaN(localId)) throw new Error("campaign_id must be a local integer ID");
      const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, localId));
      if (!campaign) throw new Error(`Campaign ${campaign_id} not found`);
      if (campaign.metaCampaignId) {
        await updateMetaCampaignStatus(campaign.metaCampaignId, "ACTIVE");
        await db.update(campaignsTable).set({ status: "active" }).where(eq(campaignsTable.id, localId));
        return { success: true, message: `Campaign "${campaign.campaignName}" resumed in both AdClaw and Meta Ads Manager.` };
      }
      await db.update(campaignsTable).set({ status: "active" }).where(eq(campaignsTable.id, localId));
      return { success: true, message: `Campaign "${campaign.campaignName}" resumed in AdClaw. (Not yet pushed to Meta — no Meta update needed.)` };
    }

    case "update_budget": {
      const campaign_id = args.campaign_id as string;
      const new_daily_budget = args.new_daily_budget as number;
      const localId = parseInt(campaign_id, 10);
      if (isNaN(localId)) throw new Error("campaign_id must be a local integer ID");
      const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, localId));
      if (!campaign) throw new Error(`Campaign ${campaign_id} not found`);
      if (campaign.metaCampaignId) {
        await updateMetaCampaignBudget(campaign.metaCampaignId, new_daily_budget);
        await db.update(campaignsTable).set({ dailyBudget: String(new_daily_budget) }).where(eq(campaignsTable.id, localId));
        return { success: true, message: `Daily budget for "${campaign.campaignName}" updated to IDR ${new_daily_budget.toLocaleString("id-ID")} in both AdClaw and Meta Ads Manager.` };
      }
      await db.update(campaignsTable).set({ dailyBudget: String(new_daily_budget) }).where(eq(campaignsTable.id, localId));
      return { success: true, message: `Daily budget for "${campaign.campaignName}" updated to IDR ${new_daily_budget.toLocaleString("id-ID")} in AdClaw. (Not yet pushed to Meta — no Meta update needed.)` };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const COPILOT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_account_summary",
      description: "Get today's overall Meta Ads account performance summary (spend, leads, CTR, CPL).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_insights",
      description: "Get performance insights for a specific campaign. Use local campaign ID (integer).",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string", description: "Local campaign ID (integer) or Meta campaign ID" },
          date_preset: { type: "string", description: "Date range: today, yesterday, last_7d, last_30d", enum: ["today", "yesterday", "last_7d", "last_30d"] },
        },
        required: ["campaign_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_active_campaigns",
      description: "List all campaigns in AdClaw with their IDs, names, status, placement, and budget.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "pause_campaign",
      description: "Pause a campaign in AdClaw (updates local status to paused).",
      parameters: {
        type: "object",
        properties: { campaign_id: { type: "string", description: "Local campaign ID (integer)" } },
        required: ["campaign_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "resume_campaign",
      description: "Resume/activate a paused campaign in AdClaw.",
      parameters: {
        type: "object",
        properties: { campaign_id: { type: "string", description: "Local campaign ID (integer)" } },
        required: ["campaign_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_budget",
      description: "Update the daily budget for a campaign in AdClaw (in IDR).",
      parameters: {
        type: "object",
        properties: {
          campaign_id: { type: "string", description: "Local campaign ID (integer)" },
          new_daily_budget: { type: "number", description: "New daily budget in IDR (e.g. 100000 for 100rb)" },
        },
        required: ["campaign_id", "new_daily_budget"],
      },
    },
  },
];

export async function interpretCommand(message: string, businessId?: number): Promise<{ id: number; response: string; toolsUsed: string[] }> {
  logger.info({ message, businessId }, "Interpreting copilot command (GPT-4o-mini)");

  const systemPrompt = `You are AdClaw Copilot — an AI Marketing Assistant for Indonesian Meta Ads operators. You understand commands in Bahasa Indonesia and English. When the user asks you to do something, use the available tools to fetch data or execute actions, then respond naturally in the same language they used. Always confirm what you did. Use IDR for currency formatting.

Important: When a campaign has been pushed to Meta (it has a metaCampaignId), pause/resume/budget commands update both AdClaw and Meta Ads Manager simultaneously — do NOT tell the operator to update Meta separately. Only mention Meta separately if the tool result explicitly says the campaign has not been pushed yet.`;

  const toolsUsed: string[] = [];
  let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ];
  let finalResponse = "";

  // Agentic loop: run until model stops calling tools (max 5 iterations)
  for (let iteration = 0; iteration < 5; iteration++) {
    const response = await openai.chat.completions.create({
      model: OPENAI_TOOL_MODEL,
      max_tokens: 2000,
      tools: COPILOT_TOOLS,
      messages,
    });

    const choice = response.choices[0];

    // Collect text from this turn
    if (choice.message.content) {
      finalResponse = choice.message.content;
    }

    if (choice.finish_reason === "stop" || choice.finish_reason === "end_turn") break;

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
      // Add assistant's response (with tool calls) to message history
      messages.push({ role: "assistant", content: choice.message.content ?? null, tool_calls: choice.message.tool_calls });

      // Execute all tool calls and collect results
      const toolResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];
      for (const toolCall of choice.message.tool_calls) {
        const toolName = toolCall.function.name;
        toolsUsed.push(toolName);
        let result: unknown;
        let isError = false;
        try {
          const args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          result = await executeTool(toolName, args);
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
          isError = true;
        }
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(isError ? result : result),
        });
      }

      // Add tool results to message history
      messages = [...messages, ...toolResults];
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
