---
name: LLM Blueprint Engine
description: Claude-powered pipeline blueprint generation replacing the old rule-based system
---

## Location
`artifacts/api-server/src/lib/llm-blueprint.ts`

## Model
`claude-sonnet-4-6` — balanced speed/quality for structured JSON output

## Key Design
- System prompt defines OpenClaw as the orchestrator running 7 MultiClaw agents
- User prompt injects business + product + campaign brief + agent memory in a structured block
- Claude outputs a SINGLE JSON object (no markdown fences)
- Response is stripped of potential code fences with regex before JSON.parse
- Blueprint sections serialized to JSON strings before saving to DB TEXT columns

## Error Handling
- JSON.parse failure → throws "Blueprint AI returned invalid JSON. Please retry."
- Pipeline route catches all errors → marks run as `failed`, logs the error message

**Why:** Claude sometimes wraps JSON in ```json fences despite instructions — the strip regex handles this gracefully.
**How to apply:** Any new agent section should be added to both the user prompt schema and the GeneratedBlueprint interface.

## Agent Memory Integration
If `agentMemory` is provided for the business, it's injected into the prompt so Claude can avoid previously failed patterns and reinforce winning patterns.
