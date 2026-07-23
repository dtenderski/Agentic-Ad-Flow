---
name: Interest Preview Gate
description: How interest matching preview and approval blocking work in the Human Gate flow
---

# Interest Preview Gate (Tasks #6 & #7)

## The rule
Before a reviewer can approve a campaign, the UI fetches `GET /api/campaigns/:id/interest-preview` which resolves each adset's interest strings against Meta's Targeting Search API in real time.

**Why:** Placeholder interest strings that fail to resolve cause campaigns to push with empty targeting — wasted spend with no audience.

## canApprove logic
- `canApprove = false` only when at least one adset *has* interests listed AND *none* of them resolve across any adset
- If no adsets have interests, `canApprove = true` (no interests = no problem)
- Partial matches (some resolved, some not) → `canApprove = true`, UI shows warning badges

## Backend enforcement (Task #7)
`POST /api/campaigns/:id/approve` with `decision: "approved"` will 400 with `code: "NO_INTERESTS_MATCHED"` if zero interests resolve. This is a server-side guard independent of the UI.

## How to apply
- The `CampaignInterestPreview` component in `approvals-list.tsx` calls the hook and renders green/red badges per interest
- `ApprovalCard` disables the "Approve & Deploy" button when `preview.canApprove === false`
- The approve mutation uses `useApproveCampaign` and invalidates `getListApprovalsQueryKey()` on success

## Key files
- Backend route: `artifacts/api-server/src/routes/campaigns.ts` (`GET /campaigns/:campaignId/interest-preview`, updated `POST approve`)
- Frontend: `artifacts/adclaw-ai/src/pages/approvals-list.tsx`
- Spec: `lib/api-spec/openapi.yaml` — schemas `CampaignInterestPreview`, `AdSetInterestPreview`, `InterestMatchResult`
