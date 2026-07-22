import { logger } from "./logger";

const TIKTOK_API_VERSION = "v1.3";
const TIKTOK_BASE = `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}`;

// ─── Config & Auth ────────────────────────────────────────────────────────────

export interface TikTokConfig {
  accessToken: string;
  advertiserId: string;
}

export function getTikTokConfig(): TikTokConfig {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  const advertiserId = process.env.TIKTOK_ADVERTISER_ID;

  const missing: string[] = [];
  if (!accessToken) missing.push("TIKTOK_ACCESS_TOKEN");
  if (!advertiserId) missing.push("TIKTOK_ADVERTISER_ID");

  if (missing.length > 0) {
    throw new Error(`Missing TikTok Ads secrets: ${missing.join(", ")}. Configure them in Replit Secrets.`);
  }

  return { accessToken: accessToken!, advertiserId: advertiserId! };
}

export function checkTikTokSecrets(): { ok: boolean; missing: string[] } {
  const keys = [
    "TIKTOK_ACCESS_TOKEN",
    "TIKTOK_ADVERTISER_ID",
    "TIKTOK_APP_ID",
    "TIKTOK_APP_SECRET",
  ];
  const missing = keys.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

interface TikTokResponse<T> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

async function tiktokPost<T>(
  path: string,
  body: Record<string, unknown>,
  config: TikTokConfig
): Promise<T> {
  const url = `${TIKTOK_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": config.accessToken,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TikTokResponse<T>;

  if (!res.ok || data.code !== 0) {
    logger.error({ url, status: res.status, tiktokCode: data.code, tiktokMsg: data.message }, "TikTok API POST error");
    throw new Error(`TikTok API error (${data.code}): ${data.message}`);
  }
  return data.data;
}

async function tiktokGet<T>(
  path: string,
  params: Record<string, string>,
  config: TikTokConfig
): Promise<T> {
  const qs = new URLSearchParams({ ...params, advertiser_id: config.advertiserId });
  const url = `${TIKTOK_BASE}${path}?${qs}`;
  const res = await fetch(url, {
    headers: { "Access-Token": config.accessToken },
  });

  const data = (await res.json()) as TikTokResponse<T>;

  if (!res.ok || data.code !== 0) {
    logger.error({ url, status: res.status, tiktokCode: data.code, tiktokMsg: data.message }, "TikTok API GET error");
    throw new Error(`TikTok API error (${data.code}): ${data.message}`);
  }
  return data.data;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validateTikTokCredentials(): Promise<{
  valid: boolean;
  advertiserId?: string;
  advertiserName?: string;
  currency?: string;
  error?: string;
}> {
  const check = checkTikTokSecrets();
  if (!check.ok) {
    return { valid: false, error: `Missing secrets: ${check.missing.join(", ")}` };
  }

  try {
    const config = getTikTokConfig();
    const data = await tiktokGet<{
      list?: {
        advertiser_id: string;
        advertiser_name: string;
        currency: string;
        status: string;
      }[];
    }>(
      "/advertiser/info/",
      { fields: '["advertiser_id","advertiser_name","currency","status"]' },
      config
    );

    const advertiser = data.list?.[0];
    if (!advertiser) {
      return { valid: false, error: "No advertiser data returned — check TIKTOK_ADVERTISER_ID" };
    }

    return {
      valid: true,
      advertiserId: advertiser.advertiser_id,
      advertiserName: advertiser.advertiser_name,
      currency: advertiser.currency,
    };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Objective mapping ────────────────────────────────────────────────────────

const OBJECTIVE_MAP: Record<string, string> = {
  REACH:           "REACH",
  VIDEO_VIEWS:     "VIDEO_VIEWS",
  TRAFFIC:         "TRAFFIC",
  CONVERSIONS:     "CONVERSIONS",
  LEAD_GENERATION: "LEAD_GENERATION",
  LEADS:           "LEAD_GENERATION",
  AWARENESS:       "REACH",
  ENGAGEMENT:      "VIDEO_VIEWS",
  SALES:           "CONVERSIONS",
  APP_PROMOTION:   "APP_INSTALL",
  YOUTUBE_VIDEO:   "VIDEO_VIEWS",
};

function mapObjective(objective: string): string {
  return OBJECTIVE_MAP[objective.toUpperCase()] ?? "REACH";
}

// Optimization goal depends on campaign objective
const OBJECTIVE_TO_OPTIMIZE_GOAL: Record<string, string> = {
  REACH:           "REACH",
  VIDEO_VIEWS:     "VIDEO_VIEW",
  TRAFFIC:         "CLICK",
  CONVERSIONS:     "CONVERT",
  LEAD_GENERATION: "LEAD_GENERATION",
  APP_INSTALL:     "INSTALL",
};

function mapOptimizeGoal(tiktokObjective: string): string {
  return OBJECTIVE_TO_OPTIMIZE_GOAL[tiktokObjective] ?? "REACH";
}

// ─── Create Campaign ──────────────────────────────────────────────────────────

export async function createTikTokCampaign(opts: {
  name: string;
  objective: string;
  dailyBudget?: number | null;
}): Promise<string> {
  const config = getTikTokConfig();
  const objectiveType = mapObjective(opts.objective);

  const body: Record<string, unknown> = {
    advertiser_id: config.advertiserId,
    campaign_name: opts.name,
    objective_type: objectiveType,
    operation_status: "DISABLE", // TikTok equivalent of PAUSED
  };

  // Budget on campaign level
  if (opts.dailyBudget && opts.dailyBudget > 0) {
    body.budget_mode = "BUDGET_MODE_DAY";
    body.budget = Math.round(opts.dailyBudget);
  } else {
    body.budget_mode = "BUDGET_MODE_INFINITE";
  }

  const data = await tiktokPost<{ campaign_id: string }>(
    "/campaign/create/",
    body,
    config
  );

  logger.info({ tiktokCampaignId: data.campaign_id, objectiveType }, "TikTok campaign created");
  return data.campaign_id;
}

// ─── Create Ad Group ──────────────────────────────────────────────────────────

export async function createTikTokAdGroup(opts: {
  tiktokCampaignId: string;
  name: string;
  objective: string;
  dailyBudget?: number | null;
}): Promise<string> {
  const config = getTikTokConfig();
  const tiktokObjective = mapObjective(opts.objective);
  const optimizeGoal = mapOptimizeGoal(tiktokObjective);

  // Billing event mapping
  const billingEventMap: Record<string, string> = {
    REACH: "CPM",
    VIDEO_VIEW: "CPV",
    CLICK: "CPC",
    CONVERT: "oCPM",
    LEAD_GENERATION: "oCPM",
    INSTALL: "oCPM",
  };
  const billingEvent = billingEventMap[optimizeGoal] ?? "CPM";

  const body: Record<string, unknown> = {
    advertiser_id: config.advertiserId,
    campaign_id: opts.tiktokCampaignId,
    adgroup_name: opts.name,
    placement_type: "PLACEMENT_TYPE_AUTOMATIC", // Automatic placement across TikTok inventory
    location_ids: ["6252001"], // Indonesia (TikTok location ID)
    age_groups: ["AGE_18_24", "AGE_25_34", "AGE_35_44", "AGE_45_54"],
    operation_status: "DISABLE",
    optimize_goal: optimizeGoal,
    billing_event: billingEvent,
    schedule_type: "SCHEDULE_FROM_NOW",
  };

  // Ad group budget
  if (opts.dailyBudget && opts.dailyBudget > 0) {
    body.budget_mode = "BUDGET_MODE_DAY";
    body.budget = Math.round(opts.dailyBudget);
  } else {
    body.budget_mode = "BUDGET_MODE_DAY";
    body.budget = 50000; // 50k IDR default
  }

  const data = await tiktokPost<{ adgroup_id: string }>(
    "/adgroup/create/",
    body,
    config
  );

  logger.info({ tiktokAdGroupId: data.adgroup_id }, "TikTok ad group created");
  return data.adgroup_id;
}

// ─── Create Ad ────────────────────────────────────────────────────────────────
// Note: TikTok in-feed video ads require a video_id from an uploaded video asset.
// AdClaw creates the campaign + ad group and passes a placeholder structure.
// Operators must upload their TikTok video and link it in TikTok Ads Manager.

export async function createTikTokAd(opts: {
  tiktokAdGroupId: string;
  name: string;
  adText: string;
  videoId?: string;    // TikTok video asset ID from the creative library
  landingUrl?: string;
}): Promise<string> {
  const config = getTikTokConfig();

  // If no video ID provided, we can't create a full in-feed video ad.
  // Create with a minimal structure; operator must attach the video asset in Ads Manager.
  const creativesArray: Record<string, unknown>[] = [
    {
      ad_name: opts.name,
      ad_text: opts.adText.substring(0, 100),
      ...(opts.videoId ? { video_id: opts.videoId } : {}),
      ...(opts.landingUrl ? { landing_page_url: opts.landingUrl } : {}),
      call_to_action: "LEARN_MORE",
    },
  ];

  const body: Record<string, unknown> = {
    advertiser_id: config.advertiserId,
    adgroup_id: opts.tiktokAdGroupId,
    creatives: creativesArray,
    operation_status: "DISABLE",
  };

  const data = await tiktokPost<{ ad_ids: string[] }>(
    "/ad/create/",
    body,
    config
  );

  const adId = data.ad_ids?.[0] ?? "unknown";
  logger.info({ tiktokAdId: adId }, "TikTok ad created");
  return adId;
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export interface TikTokCampaignInsight {
  tiktokCampaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  spend: number;
  videoViews: number;
  videoWatched2s: number;
  videoCompletionRate: number; // video_views_p100 / impressions
  dateStart: string;
  dateStop: string;
}

const DATE_PRESET_MAP: Record<string, { start: string; end: string }> = {};

function getDateRange(datePreset: string): { startDate: string; endDate: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (datePreset) {
    case "today":
      return { startDate: fmt(now), endDate: fmt(now) };
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      return { startDate: fmt(y), endDate: fmt(y) };
    }
    case "last_30d": {
      const s = new Date(now); s.setDate(s.getDate() - 30);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    case "last_7d":
    default: {
      const s = new Date(now); s.setDate(s.getDate() - 7);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
  }
}

export async function getTikTokCampaignInsights(
  tiktokCampaignId: string,
  datePreset: string = "last_7d"
): Promise<TikTokCampaignInsight | null> {
  try {
    const config = getTikTokConfig();
    const { startDate, endDate } = getDateRange(datePreset);

    const metrics = [
      "campaign_name",
      "impressions",
      "clicks",
      "ctr",
      "cpc",
      "conversion",
      "spend",
      "video_play_actions",
      "video_watched_2s",
      "video_views_p100",
    ];

    const filters = [
      {
        field_name: "campaign_id",
        filter_type: "IN",
        filter_value: JSON.stringify([tiktokCampaignId]),
      },
    ];

    const params: Record<string, string> = {
      advertiser_id: config.advertiserId,
      report_type: "BASIC",
      dimensions: JSON.stringify(["campaign_id"]),
      metrics: JSON.stringify(metrics),
      filters: JSON.stringify(filters),
      start_date: startDate,
      end_date: endDate,
      page_size: "1",
    };

    const qs = new URLSearchParams(params);
    const url = `${TIKTOK_BASE}/report/integrated/get/?${qs}`;
    const res = await fetch(url, {
      headers: { "Access-Token": config.accessToken },
    });

    const rawData = (await res.json()) as TikTokResponse<{
      list?: {
        dimensions: { campaign_id: string };
        metrics: {
          campaign_name: string;
          impressions: string;
          clicks: string;
          ctr: string;
          cpc: string;
          conversion: string;
          spend: string;
          video_play_actions: string;
          video_watched_2s: string;
          video_views_p100: string;
        };
      }[];
    }>;

    if (rawData.code !== 0) {
      logger.warn({ tiktokCampaignId, msg: rawData.message }, "TikTok insights API returned non-zero code");
      return null;
    }

    const rows = rawData.data?.list;
    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    const m = row.metrics;
    const impressions = parseInt(m.impressions ?? "0", 10) || 0;
    const videoViewsP100 = parseInt(m.video_views_p100 ?? "0", 10) || 0;
    const completionRate = impressions > 0 ? videoViewsP100 / impressions : 0;

    return {
      tiktokCampaignId,
      campaignName: m.campaign_name ?? "",
      impressions,
      clicks: parseInt(m.clicks ?? "0", 10) || 0,
      ctr: parseFloat(m.ctr ?? "0") || 0,
      cpc: parseFloat(m.cpc ?? "0") || 0,
      conversions: parseInt(m.conversion ?? "0", 10) || 0,
      spend: parseFloat(m.spend ?? "0") || 0,
      videoViews: parseInt(m.video_play_actions ?? "0", 10) || 0,
      videoWatched2s: parseInt(m.video_watched_2s ?? "0", 10) || 0,
      videoCompletionRate: completionRate,
      dateStart: startDate,
      dateStop: endDate,
    };
  } catch (err) {
    logger.error({ err, tiktokCampaignId }, "Failed to fetch TikTok campaign insights");
    return null;
  }
}
