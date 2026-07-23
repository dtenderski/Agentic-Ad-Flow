import { Router } from "express";
import { deepseek, DEEPSEEK_MODEL } from "../lib/ai-clients.js";

const router = Router();

const SYSTEM_PROMPT = `You are AdFlow AI, the intelligent assistant for Agentic AdFlow — the world's first fully agentic ad campaign engine powered by AI.

Agentic AdFlow uses a multi-agent pipeline (MultiClaw + OpenClaw) to:
- Analyze a business brief and product details
- Generate a complete ad campaign blueprint: strategy, audience, creatives, budget plan, and compliance review
- Resolve real Meta audience interests and targeting
- Push campaigns live to Meta, Google, TikTok, and LinkedIn — all paused for human review first
- Score campaigns on Conversion Readiness, Policy Risk, Creative Strength, and Funnel Fit (0–100)
- Run a daily Copilot: morning trend brief at 06:00 and afternoon performance report at 16:00

You help marketers, founders, and agencies understand how Agentic AdFlow works, answer questions about ad strategy, and explain how AI-powered campaigns outperform manual ones.

Be concise, confident, and helpful. Speak like a knowledgeable marketing strategist. When asked about pricing or access, say "Join the early access waitlist on this page" and keep it brief. Don't make up specific numbers you don't know.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

router.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history: ChatMessage[];
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const response = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL,
    max_tokens: 512,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  });

  const reply = response.choices[0]?.message?.content ?? "";
  res.json({ reply });
});

export default router;
