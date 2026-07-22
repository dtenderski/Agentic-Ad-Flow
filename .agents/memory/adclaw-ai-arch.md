---
name: AdClaw AI Architecture
description: Stack, file layout, and key design decisions for the AdClaw AI platform
---

## Stack
- Frontend: React + Vite (`artifacts/adclaw-ai/`)
- API: Express 5 (`artifacts/api-server/`)
- DB: PostgreSQL + Drizzle ORM (`lib/db/src/schema/`)
- API contract: OpenAPI spec at `lib/api-spec/openapi.yaml`
- API client hooks: Orval-generated at `lib/api-client-react/src/generated/api.ts`
- Zod validators: Orval-generated at `lib/api-zod/src/generated/api.ts`

## Domain Tables
businesses → products (FK) → pipeline_runs (FK) → blueprints (FK)
businesses → campaigns → adsets → creatives
campaigns → approvals (entity_type="campaign", entity_id=campaign.id)
businesses → agent_memory (1:1)

## Agent Architecture (simulated, rule-based)
Pipeline runs trigger `generateBlueprint()` in `artifacts/api-server/src/routes/pipeline.ts`.
The function builds 7 JSON sections (businessContext, campaignStrategy, audiencePlan, offerStrategy, creativeBlueprint, budgetPlan, policyReview) and scores them (0-100 each).
Blueprint JSON sections are stored as TEXT (JSON strings) in PostgreSQL.

## Codegen
Run: `pnpm --filter @workspace/api-spec run codegen`
This runs orval + typecheck:libs. After changing openapi.yaml, always re-run codegen before building.

**Why:** Orval generates both react-query hooks and zod validators from one source of truth.
**How to apply:** Any new endpoint needs an entry in openapi.yaml first, then codegen, then route implementation.
