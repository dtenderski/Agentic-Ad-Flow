---
name: Expo API Client Setup
description: How to wire @workspace/api-client-react into an Expo mobile artifact, including a required export fix and queryKey typing pattern.
---

## setBaseUrl export

`setBaseUrl` and `setAuthTokenGetter` live in `lib/api-client-react/src/custom-fetch.ts` but were **not** re-exported from the package index. Added explicit exports to `lib/api-client-react/src/index.ts`:

```ts
export { setBaseUrl, setAuthTokenGetter } from './custom-fetch';
```

**Why:** Without this, Expo bundles throw `setBaseUrl is not a function` at startup.

**How to apply:** Call `setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`)` at module level (outside any component) in `app/_layout.tsx`. `EXPO_PUBLIC_DOMAIN` is injected by the dev script as `$REPLIT_DEV_DOMAIN`.

## Passing `enabled` to generated query hooks

Generated hooks type `query` as `UseQueryOptions<...>` which requires `queryKey` as a required field in React Query v5. When you need to conditionally enable a query, import the generated key function:

```ts
import { getGetCampaignInterestPreviewQueryKey, useGetCampaignInterestPreview } from '@workspace/api-client-react';

useGetCampaignInterestPreview(campaignId, {
  query: {
    queryKey: getGetCampaignInterestPreviewQueryKey(campaignId),
    enabled: someBoolean,
  },
});
```

**Why:** Omitting `queryKey` causes a TS2741 type error even though the hook would compute it internally at runtime.

**How to apply:** Pattern generalizes — every generated `useXxx` hook has a matching `getXxxQueryKey(...)` export. Always include it when passing any `UseQueryOptions`.
