import { logger } from "./logger";

const GOOGLE_ADS_API_VERSION = "v17";
const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const OAUTH2_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ─── Config & Auth ────────────────────────────────────────────────────────────

export interface GoogleAdsConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string; // numeric, dashes stripped
}

export function getGoogleAdsConfig(): GoogleAdsConfig {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  const missing: string[] = [];
  if (!developerToken) missing.push("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!clientId) missing.push("GOOGLE_ADS_CLIENT_ID");
  if (!clientSecret) missing.push("GOOGLE_ADS_CLIENT_SECRET");
  if (!refreshToken) missing.push("GOOGLE_ADS_REFRESH_TOKEN");
  if (!customerId) missing.push("GOOGLE_ADS_CUSTOMER_ID");

  if (missing.length > 0) {
    throw new Error(`Missing Google Ads secrets: ${missing.join(", ")}. Configure them in Replit Secrets.`);
  }

  return {
    developerToken: developerToken!,
    clientId: clientId!,
    clientSecret: clientSecret!,
    refreshToken: refreshToken!,
    customerId: customerId!.replace(/-/g, ""), // strip dashes
  };
}

export function checkGoogleAdsSecrets(): { ok: boolean; missing: string[] } {
  const keys = [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
  ];
  const missing = keys.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

// Access token cache (in-process, resets on restart)
let _cachedAccessToken: string | null = null;
let _tokenExpiresAt = 0;

async function getGoogleAccessToken(config: GoogleAdsConfig): Promise<string> {
  if (_cachedAccessToken && Date.now() < _tokenExpiresAt - 60_000) {
    return _cachedAccessToken;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
  });

  const res = await fetch(OAUTH2_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !data.access_token) {
    throw new Error(
      `Google OAuth2 token refresh failed: ${data.error_description ?? data.error ?? res.statusText}`
    );
  }

  _cachedAccessToken = data.access_token;
  _tokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  logger.info("Google Ads access token refreshed");
  return _cachedAccessToken;
}

async function googlePost<T>(
  path: string,
  body: unknown,
  config: GoogleAdsConfig,
  accessToken: string
): Promise<T> {
  const url = `${GOOGLE_ADS_BASE}/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "developer-token": config.developerToken,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as T & { error?: { message: string; status: string } };
  if (!res.ok) {
    const errData = data as Record<string, unknown>;
    const errObj = errData.error as { message?: string; status?: string } | undefined;
    logger.error({ url, status: res.status, googleError: errObj }, "Google Ads API error");
    throw new Error(
      `Google Ads API error (${res.status}): ${errObj?.message ?? res.statusText}`
    );
  }
  return data;
}

async function googleSearch<T>(
  customerId: string,
  query: string,
  config: GoogleAdsConfig,
  accessToken: string
): Promise<T> {
  const url = `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "developer-token": config.developerToken,
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json() as T & { error?: { message: string } };
  if (!res.ok) {
    const errData = data as Record<string, unknown>;
    const errObj = errData.error as { message?: string } | undefined;
    throw new Error(`Google Ads GAQL error: ${errObj?.message ?? res.statusText}`);
  }
  return data;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validateGoogleCredentials(): Promise<{
  valid: boolean;
  customerId?: string;
  currencyCode?: string;
  error?: string;
}> {
  const check = checkGoogleAdsSecrets();
  if (!check.ok) {
    return { valid: false, error: `Missing secrets: ${check.missing.join(", ")}` };
  }

  try {
    const config = getGoogleAdsConfig();
    const accessToken = await getGoogleAccessToken(config);

    const data = await googleSearch<{
      results?: { customer: { id: string; currencyCode: string; descriptiveName: string } }[];
    }>(
      config.customerId,
      `SELECT customer.id, customer.currency_code, customer.descriptive_name FROM customer LIMIT 1`,
      config,
      accessToken
    );

    const customer = data.results?.[0]?.customer;
    if (!customer) {
      return { valid: false, error: "No customer data returned — check GOOGLE_ADS_CUSTOMER_ID" };
    }
    return { valid: true, customerId: customer.id, currencyCode: customer.currencyCode };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Channel type helper ──────────────────────────────────────────────────────

/**
 * Maps an AdClaw campaign objective to one of four Google Ads channel families.
 *
 * - "search"  → SEARCH campaigns: full flow — campaign + SEARCH_STANDARD ad group
 *               + responsive search ad (placeholder copy, operator updates final URL).
 * - "display" → DISPLAY campaigns: campaign + DISPLAY_STANDARD ad group created;
 *               ad creation skipped — image assets must be added in Google Ads Manager.
 * - "video"   → VIDEO campaigns (YouTube TrueView): campaign + VIDEO_TRUE_VIEW_IN_STREAM
 *               ad group created; video ad skipped — operator uploads YouTube video and
 *               links it in Google Ads Manager.
 * - "app"     → APP_CAMPAIGN (MULTI_CHANNEL subtype): campaign only — App campaigns are
 *               fully automated by Google; no ad groups or ads needed. Uses a placeholder
 *               app ID that the operator updates in Google Ads Manager.
 */
export type GoogleChannelType = "search" | "display" | "video" | "app";

const OBJECTIVE_TO_CHANNEL: Record<string, GoogleChannelType> = {
  AWARENESS:     "display",
  TRAFFIC:       "search",
  ENGAGEMENT:    "display",
  LEADS:         "search",
  SALES:         "search",
  APP_PROMOTION: "app",
  YOUTUBE_VIDEO: "video",
};

const CHANNEL_TO_ADVERTISING_CHANNEL: Record<GoogleChannelType, string> = {
  search:  "SEARCH",
  display: "DISPLAY",
  video:   "VIDEO",
  app:     "MULTI_CHANNEL",
};

export function getChannelTypeForObjective(objective: string): GoogleChannelType {
  return OBJECTIVE_TO_CHANNEL[objective.toUpperCase()] ?? "search";
}

// ─── Create Campaign ──────────────────────────────────────────────────────────

export async function createGoogleCampaign(opts: {
  name: string;
  objective: string;
  dailyBudget?: number | null; // in IDR
}): Promise<{ googleCampaignId: string; googleBudgetId: string; channelType: GoogleChannelType }> {
  const config = getGoogleAdsConfig();
  const accessToken = await getGoogleAccessToken(config);
  const channelType = getChannelTypeForObjective(opts.objective);
  const advertisingChannel = CHANNEL_TO_ADVERTISING_CHANNEL[channelType];

  // 1. Create Campaign Budget
  const budgetMicros = Math.round(((opts.dailyBudget ?? 50000) / 1) * 1_000_000);
  const budgetRes = await googlePost<{
    results?: { resourceName: string }[];
  }>(
    `customers/${config.customerId}/campaignBudgets:mutate`,
    {
      operations: [
        {
          create: {
            name: `Budget for ${opts.name}`,
            amountMicros: budgetMicros,
            deliveryMethod: "STANDARD",
          },
        },
      ],
    },
    config,
    accessToken
  );

  const budgetResourceName = budgetRes.results?.[0]?.resourceName;
  if (!budgetResourceName) throw new Error("Google Ads: failed to create campaign budget");
  logger.info({ budgetResourceName }, "Google Ads budget created");

  // 2. Build channel-specific campaign payload
  const campaignCreate: Record<string, unknown> = {
    name: opts.name,
    status: "PAUSED",
    advertisingChannelType: advertisingChannel,
    campaignBudget: budgetResourceName,
  };

  if (channelType === "search") {
    campaignCreate.networkSettings = {
      targetGoogleSearch: true,
      targetSearchNetwork: true,
      targetContentNetwork: false,
    };
    campaignCreate.manualCpc = { enhancedCpcEnabled: false };
  } else if (channelType === "display") {
    campaignCreate.networkSettings = {
      targetContentNetwork: true,
      targetGoogleSearch: false,
      targetSearchNetwork: false,
    };
    campaignCreate.manualCpc = { enhancedCpcEnabled: false };
  } else if (channelType === "video") {
    // YouTube TrueView In-Stream
    campaignCreate.advertisingChannelSubType = "VIDEO_TRUE_VIEW_IN_STREAM";
    // Video campaigns use Target CPM bidding by default
    campaignCreate.targetCpm = {};
  } else if (channelType === "app") {
    // Universal App Campaign — fully automated by Google
    campaignCreate.advertisingChannelSubType = "APP_CAMPAIGN";
    // Placeholder app ID — operator must update in Google Ads Manager before activating
    campaignCreate.appCampaignSetting = {
      appId: "placeholder.app.id",
      appStore: "GOOGLE_APP_STORE",
      biddingStrategyGoalType: "OPTIMIZE_INSTALLS_TARGET_INSTALL_COST",
    };
  }

  const campaignRes = await googlePost<{
    results?: { resourceName: string }[];
  }>(
    `customers/${config.customerId}/campaigns:mutate`,
    { operations: [{ create: campaignCreate }] },
    config,
    accessToken
  );

  const campaignResourceName = campaignRes.results?.[0]?.resourceName;
  if (!campaignResourceName) throw new Error("Google Ads: failed to create campaign");

  // Extract numeric campaign ID from resource name: customers/xxx/campaigns/YYY
  const googleCampaignId = campaignResourceName.split("/").pop()!;
  const googleBudgetId = budgetResourceName.split("/").pop()!;
  logger.info({ googleCampaignId, channelType, advertisingChannel }, "Google Ads campaign created");
  return { googleCampaignId, googleBudgetId, channelType };
}

// ─── Create Ad Group ──────────────────────────────────────────────────────────

export async function createGoogleAdGroup(opts: {
  googleCampaignId: string;
  name: string;
  channelType: GoogleChannelType;
  cpcBidMicros?: number;
}): Promise<string> {
  const config = getGoogleAdsConfig();
  const accessToken = await getGoogleAccessToken(config);

  const campaignResourceName = `customers/${config.customerId}/campaigns/${opts.googleCampaignId}`;
  const cpcBidMicros = opts.cpcBidMicros ?? 1_000_000;

  // Ad group type must match the campaign's advertising channel type
  let adGroupType: string;
  const adGroupCreate: Record<string, unknown> = {
    name: opts.name,
    status: "PAUSED",
    campaign: campaignResourceName,
  };

  if (opts.channelType === "display") {
    adGroupType = "DISPLAY_STANDARD";
    adGroupCreate.type = adGroupType;
    adGroupCreate.cpcBidMicros = cpcBidMicros;
  } else if (opts.channelType === "video") {
    // YouTube TrueView In-Stream — uses CPM bidding
    adGroupType = "VIDEO_TRUE_VIEW_IN_STREAM";
    adGroupCreate.type = adGroupType;
    adGroupCreate.cpmBidMicros = 10_000_000; // $10 CPM placeholder
  } else {
    // search (default)
    adGroupType = "SEARCH_STANDARD";
    adGroupCreate.type = adGroupType;
    adGroupCreate.cpcBidMicros = cpcBidMicros;
  }

  const res = await googlePost<{ results?: { resourceName: string }[] }>(
    `customers/${config.customerId}/adGroups:mutate`,
    { operations: [{ create: adGroupCreate }] },
    config,
    accessToken
  );

  const resourceName = res.results?.[0]?.resourceName;
  if (!resourceName) throw new Error("Google Ads: failed to create ad group");
  const adGroupId = resourceName.split("/").pop()!;
  logger.info({ adGroupId, adGroupType }, "Google Ads ad group created");
  return adGroupId;
}

// ─── Create Responsive Search Ad ─────────────────────────────────────────────

export async function createGoogleAd(opts: {
  googleAdGroupId: string;
  headlines: string[];   // 3–15 headlines, max 30 chars each
  descriptions: string[]; // 2–4 descriptions, max 90 chars each
  finalUrl: string;
}): Promise<string> {
  const config = getGoogleAdsConfig();
  const accessToken = await getGoogleAccessToken(config);

  const adGroupResourceName = `customers/${config.customerId}/adGroups/${opts.googleAdGroupId}`;

  // Truncate headlines/descriptions to API limits
  const headlines = opts.headlines.slice(0, 15).map((h) => ({ text: h.substring(0, 30) }));
  const descriptions = opts.descriptions.slice(0, 4).map((d) => ({ text: d.substring(0, 90) }));

  const res = await googlePost<{ results?: { resourceName: string }[] }>(
    `customers/${config.customerId}/adGroupAds:mutate`,
    {
      operations: [
        {
          create: {
            adGroup: adGroupResourceName,
            status: "PAUSED",
            ad: {
              responsiveSearchAd: { headlines, descriptions },
              finalUrls: [opts.finalUrl],
            },
          },
        },
      ],
    },
    config,
    accessToken
  );

  const resourceName = res.results?.[0]?.resourceName;
  if (!resourceName) throw new Error("Google Ads: failed to create ad");
  const adId = resourceName.split("/").pop()!;
  logger.info({ adId }, "Google Ads responsive search ad created");
  return adId;
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export interface GoogleCampaignInsight {
  googleCampaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  averageCpc: number; // in base currency units (micros / 1_000_000)
  conversions: number;
  spend: number;       // in base currency units
  dateStart: string;
  dateStop: string;
}

function microsToCurrency(micros: string | number | undefined): number {
  if (!micros) return 0;
  return Number(micros) / 1_000_000;
}

export async function getGoogleCampaignInsights(
  googleCampaignId: string,
  datePreset: string = "LAST_7_DAYS"
): Promise<GoogleCampaignInsight | null> {
  try {
    const config = getGoogleAdsConfig();
    const accessToken = await getGoogleAccessToken(config);

    // Map AdClaw date presets → Google GAQL date range enum
    const dateRangeMap: Record<string, string> = {
      today: "TODAY",
      yesterday: "YESTERDAY",
      last_7d: "LAST_7_DAYS",
      last_30d: "LAST_30_DAYS",
      LAST_7_DAYS: "LAST_7_DAYS",
    };
    const gaqlDateRange = dateRangeMap[datePreset] ?? "LAST_7_DAYS";

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_micros
      FROM campaign
      WHERE campaign.id = ${googleCampaignId}
        AND segments.date DURING ${gaqlDateRange}
      LIMIT 1
    `;

    const data = await googleSearch<{
      results?: {
        campaign: { id: string; name: string };
        metrics: {
          impressions: string;
          clicks: string;
          ctr: number;
          averageCpc: string;
          conversions: number;
          costMicros: string;
        };
      }[];
    }>(config.customerId, query, config, accessToken);

    if (!data.results || data.results.length === 0) return null;
    const row = data.results[0];

    return {
      googleCampaignId,
      campaignName: row.campaign.name,
      impressions: parseInt(row.metrics.impressions ?? "0", 10) || 0,
      clicks: parseInt(row.metrics.clicks ?? "0", 10) || 0,
      ctr: Number(row.metrics.ctr ?? 0),
      averageCpc: microsToCurrency(row.metrics.averageCpc),
      conversions: Number(row.metrics.conversions ?? 0),
      spend: microsToCurrency(row.metrics.costMicros),
      dateStart: gaqlDateRange,
      dateStop: gaqlDateRange,
    };
  } catch (err) {
    logger.error({ err, googleCampaignId }, "Failed to fetch Google campaign insights");
    return null;
  }
}

export async function getGoogleAccountInsights(
  datePreset: string = "LAST_7_DAYS"
): Promise<GoogleCampaignInsight | null> {
  try {
    const config = getGoogleAdsConfig();
    const accessToken = await getGoogleAccessToken(config);

    const dateRangeMap: Record<string, string> = {
      today: "TODAY",
      yesterday: "YESTERDAY",
      last_7d: "LAST_7_DAYS",
      last_30d: "LAST_30_DAYS",
    };
    const gaqlDateRange = dateRangeMap[datePreset] ?? "LAST_7_DAYS";

    const query = `
      SELECT
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_micros
      FROM customer
      WHERE segments.date DURING ${gaqlDateRange}
      LIMIT 1
    `;

    const data = await googleSearch<{
      results?: {
        metrics: {
          impressions: string;
          clicks: string;
          ctr: number;
          averageCpc: string;
          conversions: number;
          costMicros: string;
        };
      }[];
    }>(config.customerId, query, config, accessToken);

    if (!data.results || data.results.length === 0) return null;
    const row = data.results[0];

    return {
      googleCampaignId: config.customerId,
      campaignName: "Account Total",
      impressions: parseInt(row.metrics.impressions ?? "0", 10) || 0,
      clicks: parseInt(row.metrics.clicks ?? "0", 10) || 0,
      ctr: Number(row.metrics.ctr ?? 0),
      averageCpc: microsToCurrency(row.metrics.averageCpc),
      conversions: Number(row.metrics.conversions ?? 0),
      spend: microsToCurrency(row.metrics.costMicros),
      dateStart: gaqlDateRange,
      dateStop: gaqlDateRange,
    };
  } catch (err) {
    logger.error({ err }, "Failed to fetch Google account insights");
    return null;
  }
}
