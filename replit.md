# AdClaw AI

An agentic AI platform that generates and pushes ad campaigns to Meta Ads using Claude-powered pipelines.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/adclaw-ai/` — React+Vite frontend (shadcn/ui, Tailwind, Wouter routing)
- `artifacts/api-server/` — Express 5 API server (port 8080 in dev)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/` — Drizzle ORM schema + migrations
- `lib/api-client-react/` — Orval-generated React Query hooks
- `lib/api-zod/` — Orval-generated Zod schemas

## Architecture decisions

- Claude claude-sonnet-4-6 powers the pipeline generator; blueprints are JSON strings in TEXT columns to avoid Zod looseObject issues with Drizzle-Zod
- Meta Ads campaigns are always created PAUSED; interest IDs are placeholders pending Meta Interest Search API
- API codegen via Orval from OpenAPI spec; regenerate with `pnpm --filter @workspace/api-spec run codegen`
- esbuild bundles the API server to a single CJS file for fast startup

## Product

- AI-driven ad pipeline generator using Claude
- One-click push of generated campaigns to Meta Ads (Marketing API v21.0)
- Copilot scheduler: trend brief at 06:00 WIB, performance report at 16:00 WIB

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Artifacts are not registered with the Replit platform (imported from GitHub); workflows are configured manually as "API Server" and "AdClaw AI"
- `pnpm --filter @workspace/db run push` must be run after schema changes (dev only)
- Frontend requires both `PORT` and `BASE_PATH` env vars at startup (enforced in vite.config.ts)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
