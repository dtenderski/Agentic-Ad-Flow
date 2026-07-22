---
name: Meta Ads Push Layer
description: Meta Marketing API v21.0 integration for pushing approved campaigns to Meta Ads Manager
---

## Location
`artifacts/api-server/src/lib/meta-ads.ts`
`artifacts/api-server/src/routes/meta.ts`

## Required Secrets
- `META_ACCESS_TOKEN` — Long-lived user access token with permissions: ads_management, ads_read
- `META_AD_ACCOUNT_ID` — Format: act_XXXXXXXXXX (with or without "act_" prefix, code normalizes it)
- `META_APP_ID`, `META_APP_SECRET` — App credentials (stored but not used in current API calls; available for token refresh)

## API Version
Graph API v21.0 — update `META_API_VERSION` constant if upgrading

## Objective Mapping
AWARENESS → OUTCOME_AWARENESS, TRAFFIC → OUTCOME_TRAFFIC, ENGAGEMENT → OUTCOME_ENGAGEMENT, LEADS → OUTCOME_LEADS, APP_PROMOTION → OUTCOME_APP_PROMOTION, SALES → OUTCOME_SALES

## All Campaigns/Ads Created as PAUSED
By design — human must activate in Meta Ads Manager after final review.

## Known Limitation — Interest IDs
`createMetaAdSet()` uses placeholder interest IDs (hardcoded `6003200000000 + i`). Production use requires calling Meta's Interest Search API (`/{ad-account}/targetingbrowse` or `/{ad-account}/targetsearch`) to resolve interest names to real IDs.

**Why:** Meta's Targeting API requires numeric interest IDs, not string names. The placeholder keeps the structure working for testing without requiring a live interest lookup.
**How to apply:** Before launch, build an interest search endpoint that hits Meta's API and caches results.

## Validation Endpoint
`GET /api/meta/validate` — returns `{ valid, adAccountName, accountId, currency, error }`. Frontend shows this as a status badge in the sidebar.
