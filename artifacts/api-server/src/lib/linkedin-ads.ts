import { logger } from "./logger";

const LINKEDIN_API_VERSION = "202404";
const LINKEDIN_BASE = "https://api.linkedin.com/v2";

// ─── Config & Auth ────────────────────────────────────────────────────────────

export interface LinkedInConfig {
  accessToken: string;
  accountId: string;         // numeric only
  accountUrn: string;        // urn:li:sponsoredAccount:{accountId}
}

export function getLinkedInConfig(): LinkedInConfig {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const accountId = process.env.LINKEDIN_ACCOUNT_ID;

  const missing: string[] = [];
  if (!accessToken) missing.push("LINKEDIN_ACCESS_TOKEN");
  if (!accountId) missing.push("LINKEDIN_ACCOUNT_ID");

  if (missing.length > 0) {
    throw new Error(`Missing LinkedIn Ads secrets: ${missing.join(", ")}. Configure them in Replit Secrets.`);
  }

  const id = accountId!.replace(/\D/g, ""); // strip non-digits
  return {
    accessToken: accessToken!,
    accountId: id,
    accountUrn: `urn:li:sponsoredAccount:${id}`,
  };
}

export function checkLinkedInSecrets(): { ok: boolean; missing: string[] } {
  const keys = [
    "LINKEDIN_ACCESS_TOKEN",
    "LINKEDIN_ACCOUNT_ID",
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_CLIENT_SECRET",
  ];
  const missing = keys.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function linkedInHeaders(accessToken: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "LinkedIn-Version": LINKEDIN_API_VERSION,
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

async function linkedInPost<T>(
  path: string,
  body: unknown,
  config: LinkedInConfig
): Promise<T> {
  const url = `${LINKEDIN_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: linkedInHeaders(config.accessToken),
    body: JSON.stringify(body),
  });

  if (res.status === 201 || res.status === 200) {
    // Some LinkedIn POST endpoints return the created entity; others return an ID header
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    // Created ID is in the X-RestLi-Id or Location header
    const locationHeader = res.headers.get("x-restli-id") ?? res.headers.get("location") ?? "";
    return { id: locationHeader } as unknown as T;
  }

  const errText = await res.text();
  logger.error({ url, status: res.status, errText }, "LinkedIn API POST error");
  let errMsg = `LinkedIn API error (${res.status})`;
  try {
    const errJson = JSON.parse(errText) as { message?: string };
    if (errJson.message) errMsg = `LinkedIn API error: ${errJson.message}`;
  } catch { /* ignore */ }
  throw new Error(errMsg);
}

async function linkedInGet<T>(
  path: string,
  params: Record<string, string> = {},
  config: LinkedInConfig
): Promise<T> {
  const qs = new URLSearchParams(params);
  const url = `${LINKEDIN_BASE}${path}${Object.keys(params).length ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: linkedInHeaders(config.accessToken),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error({ url, status: res.status, errText }, "LinkedIn API GET error");
    let errMsg = `LinkedIn API error (${res.status})`;
    try {
      const errJson = JSON.parse(errText) as { message?: string };
      if (errJson.message) errMsg = `LinkedIn API error: ${errJson.message}`;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }
  return (await res.json()) as T;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validateLinkedInCredentials(): Promise<{
  valid: boolean;
  accountId?: string;
  accountName?: string;
  currency?: string;
  error?: string;
}> {
  const check = checkLinkedInSecrets();
  if (!check.ok) {
    return { valid: false, error: `Missing secrets: ${check.missing.join(", ")}` };
  }

  try {
    const config = getLinkedInConfig();
    const data = await linkedInGet<{
      id: number;
      name: string;
      currency: string;
      status: string;
    }>(
      `/adAccountsV2/${config.accountId}`,
      {},
      config
    );

    return {
      valid: true,
      accountId: String(data.id),
      accountName: data.name,
      currency: data.currency,
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Objective mapping ────────────────────────────────────────────────────────

const OBJECTIVE_MAP: Record<string, string> = {
  BRAND_AWARENESS:      "BRAND_AWARENESS",
  AWARENESS:            "BRAND_AWARENESS",
  WEBSITE_VISITS:       "WEBSITE_VISITS",
  TRAFFIC:              "WEBSITE_VISITS",
  ENGAGEMENT:           "WEBSITE_VISITS",
  LEAD_GENERATION:      "LEAD_GENERATION",
  LEADS:                "LEAD_GENERATION",
  JOB_APPLICANTS:       "JOB_APPLICANTS",
  APP_PROMOTION:        "WEBSITE_VISITS",
  WEBSITE_CONVERSIONS:  "WEBSITE_CONVERSIONS",
  SALES:                "WEBSITE_CONVERSIONS",
  CONVERSIONS:          "WEBSITE_CONVERSIONS",
  YOUTUBE_VIDEO:        "BRAND_AWARENESS",
};

function mapObjective(objective: string): string {
  return OBJECTIVE_MAP[objective.toUpperCase()] ?? "WEBSITE_VISITS";
}

// ─── Create Campaign Group ────────────────────────────────────────────────────

export async function createLinkedInCampaignGroup(opts: {
  name: string;
}): Promise<string> {
  const config = getLinkedInConfig();

  const body = {
    account: config.accountUrn,
    name: opts.name,
    status: "PAUSED",
    runSchedule: { start: Date.now() },
  };

  const data = await linkedInPost<{ id?: string | number }>(
    "/adCampaignGroups",
    body,
    config
  );

  // LinkedIn returns the new entity ID in X-RestLi-Id header or in the body
  const groupId = String(data.id ?? "").replace(/\D/g, "");
  if (!groupId) throw new Error("LinkedIn Ads: failed to create campaign group — no ID returned");
  logger.info({ linkedinCampaignGroupId: groupId }, "LinkedIn campaign group created");
  return groupId;
}

// ─── Create Campaign ──────────────────────────────────────────────────────────

export async function createLinkedInCampaign(opts: {
  campaignGroupId: string;
  name: string;
  objective: string;
  dailyBudget?: number | null; // in IDR — LinkedIn uses USD/local currency
}): Promise<string> {
  const config = getLinkedInConfig();
  const linkedinObjective = mapObjective(opts.objective);

  // LinkedIn Text Ad campaigns — simplest type that doesn't require pre-existing post URN
  // Operators can upgrade to Sponsored Content in Campaign Manager
  const dailyBudgetAmount = opts.dailyBudget
    ? (opts.dailyBudget / 15500).toFixed(2)   // rough IDR→USD conversion for placeholder
    : "10.00";

  const body: Record<string, unknown> = {
    account: config.accountUrn,
    campaignGroup: `urn:li:sponsoredCampaignGroup:${opts.campaignGroupId}`,
    name: opts.name,
    type: "TEXT_AD",
    costType: "CPC",
    status: "PAUSED",
    objectiveType: linkedinObjective,
    locale: { country: "ID", language: "en" },
    dailyBudget: { amount: dailyBudgetAmount, currencyCode: "USD" },
    unitCost: { amount: "0.50", currencyCode: "USD" },
    targetingCriteria: {
      include: {
        and: [
          // Default: target professionals in Indonesia
          { or: { "urn:li:adTargetingFacet:locations": ["urn:li:geo:102478259"] } },
        ],
      },
    },
    runSchedule: { start: Date.now() },
    offsiteDeliveryEnabled: false,
  };

  const data = await linkedInPost<{ id?: string | number }>(
    "/adCampaigns",
    body,
    config
  );

  const campaignId = String(data.id ?? "").replace(/\D/g, "");
  if (!campaignId) throw new Error("LinkedIn Ads: failed to create campaign — no ID returned");
  logger.info({ linkedinCampaignId: campaignId, linkedinObjective }, "LinkedIn campaign created");
  return campaignId;
}

// ─── Create Creative (Text Ad) ────────────────────────────────────────────────

export async function createLinkedInCreative(opts: {
  linkedinCampaignId: string;
  headline: string;
  description: string;
  destinationUrl?: string;
}): Promise<string> {
  const config = getLinkedInConfig();

  const body = {
    account: config.accountUrn,
    campaign: `urn:li:sponsoredCampaign:${opts.linkedinCampaignId}`,
    status: "PAUSED",
    type: "TEXT_AD",
    variables: {
      data: {
        "com.linkedin.ads.TextAdVariables": {
          headline: opts.headline.substring(0, 25),      // LinkedIn: max 25 chars
          description: opts.description.substring(0, 75), // LinkedIn: max 75 chars
          destinationUrl: opts.destinationUrl ?? "https://example.com",
          callToAction: "LEARN_MORE",
        },
      },
    },
  };

  const data = await linkedInPost<{ id?: string | number }>(
    "/adCreativesV2",
    body,
    config
  );

  const creativeId = String(data.id ?? "").replace(/\D/g, "");
  if (!creativeId) throw new Error("LinkedIn Ads: failed to create creative — no ID returned");
  logger.info({ creativeId }, "LinkedIn creative created");
  return creativeId;
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export interface LinkedInCampaignInsight {
  linkedinCampaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  leads: number;
  conversions: number;
  spend: number;
  dateStart: string;
  dateStop: string;
}

function getDateRangeParams(datePreset: string): Record<string, string> {
  const now = new Date();
  const endDate = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };

  let daysBack = 7;
  if (datePreset === "today") daysBack = 0;
  else if (datePreset === "yesterday") daysBack = 1;
  else if (datePreset === "last_30d") daysBack = 30;

  const startDt = new Date(now);
  startDt.setDate(startDt.getDate() - daysBack);
  const startDate = { year: startDt.getFullYear(), month: startDt.getMonth() + 1, day: startDt.getDate() };

  return {
    "dateRange.start.year": String(startDate.year),
    "dateRange.start.month": String(startDate.month),
    "dateRange.start.day": String(startDate.day),
    "dateRange.end.year": String(endDate.year),
    "dateRange.end.month": String(endDate.month),
    "dateRange.end.day": String(endDate.day),
    startDateStr: `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}`,
    endDateStr: `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}`,
  };
}

export async function getLinkedInCampaignInsights(
  linkedinCampaignId: string,
  datePreset: string = "last_7d",
  campaignName?: string
): Promise<LinkedInCampaignInsight | null> {
  try {
    const config = getLinkedInConfig();
    const dateParams = getDateRangeParams(datePreset);

    const params: Record<string, string> = {
      q: "analytics",
      pivot: "CAMPAIGN",
      timeGranularity: "ALL",
      "campaigns[0]": `urn:li:sponsoredCampaign:${linkedinCampaignId}`,
      "dateRange.start.year": dateParams["dateRange.start.year"],
      "dateRange.start.month": dateParams["dateRange.start.month"],
      "dateRange.start.day": dateParams["dateRange.start.day"],
      "dateRange.end.year": dateParams["dateRange.end.year"],
      "dateRange.end.month": dateParams["dateRange.end.month"],
      "dateRange.end.day": dateParams["dateRange.end.day"],
      fields: "impressions,clicks,costInLocalCurrency,leadGenerationMailContactInfoShares,externalWebsiteConversions,dateRange",
    };

    const data = await linkedInGet<{
      elements?: {
        impressions?: number;
        clicks?: number;
        costInLocalCurrency?: string;
        leadGenerationMailContactInfoShares?: number;
        externalWebsiteConversions?: number;
      }[];
    }>("/adAnalyticsV2", params, config);

    const elements = data.elements ?? [];
    if (elements.length === 0) return null;

    // Aggregate across all rows (LinkedIn returns one per day/period)
    let impressions = 0, clicks = 0, spend = 0, leads = 0, conversions = 0;
    for (const el of elements) {
      impressions += el.impressions ?? 0;
      clicks += el.clicks ?? 0;
      spend += parseFloat(el.costInLocalCurrency ?? "0") || 0;
      leads += el.leadGenerationMailContactInfoShares ?? 0;
      conversions += el.externalWebsiteConversions ?? 0;
    }

    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    return {
      linkedinCampaignId,
      campaignName: campaignName ?? linkedinCampaignId,
      impressions,
      clicks,
      ctr,
      cpc,
      leads,
      conversions,
      spend,
      dateStart: dateParams["startDateStr"],
      dateStop: dateParams["endDateStr"],
    };
  } catch (err) {
    logger.error({ err, linkedinCampaignId }, "Failed to fetch LinkedIn campaign insights");
    return null;
  }
}
