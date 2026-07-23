/**
 * Centralized AI provider clients.
 * All providers use the OpenAI-compatible SDK — only baseURL differs.
 *
 * Routing strategy (quality vs cost):
 *  - Chatbot          → DeepSeek V3       (cheapest, great conversational quality)
 *  - Blueprint        → DeepSeek V3       (excellent structured JSON, ~20× cheaper than Claude)
 *  - Copilot reports  → Gemini 2.0 Flash  (fast, great data analysis)
 *  - Perf report      → Qwen-Max          (best Bahasa Indonesia comprehension)
 *  - Copilot tool use → GPT-4o-mini       (most reliable function calling)
 *  - Fallback         → OpenRouter        (meta-provider if primary fails)
 */

import OpenAI from "openai";

// ── DeepSeek (OpenAI-compatible) ──────────────────────────────────────────────
export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});
export const DEEPSEEK_MODEL = "deepseek-chat"; // DeepSeek V3

// ── OpenAI ────────────────────────────────────────────────────────────────────
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export const OPENAI_TOOL_MODEL = "gpt-4o-mini"; // Best tool-calling quality/price

// ── Gemini (OpenAI-compatible endpoint) ───────────────────────────────────────
export const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});
export const GEMINI_MODEL = "gemini-2.0-flash";

// ── Qwen / DashScope (OpenAI-compatible) ──────────────────────────────────────
export const qwen = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
export const QWEN_MODEL = "qwen-max"; // Top Qwen model, excellent for Bahasa Indonesia

// ── OpenRouter (meta-provider / fallback) ─────────────────────────────────────
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://adclaw.ai",
    "X-Title": "AdClaw AI",
  },
});
// Use as needed: "deepseek/deepseek-chat", "google/gemini-2.0-flash-001", etc.
