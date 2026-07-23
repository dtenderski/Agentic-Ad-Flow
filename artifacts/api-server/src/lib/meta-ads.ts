import { logger } from "./logger";

const META_API_VERSION = "v21.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function getMetaConfig() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  if (!accessToken || !adAccountId) {
    throw new Error("META_ACCESS_TOKEN and META_AD_ACCOUNT_ID must be set");
  }
  // Ensure account ID starts with act_
  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  return { accessToken, accountId };
}

async function metaPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const { accessToken } = getMetaConfig();
  const url = `${META_BASE}/${path}`;

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v !== undefined && v !== null) {
      params.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
  }
  params.set("access_token", accessToken);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await res.json()) as T & { error?: { message: string; code: number } };
  if (!res.ok || (data as Record<string, unknown>).error) {
    const err = (data as Record<string, unknown>).error as { message: string } | undefined;
    logger.error({ url, status: res.status, metaError: err }, "Meta API error");
    throw new Error(`Meta API error: ${err?.message ?? res.statusText}`);
  }
  return data;
}

async function metaGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const { accessToken } = getMetaConfig();
  const qs = new URLSearchParams({ ...params, access_token: accessToken });
  const url = `${META_BASE}/${path}?${qs}`;

  const res = await fetch(url);
  const data = (await res.json()) as T & { error?: { message: string } };
  if (!res.ok || (data as Record<string, unknown>).error) {
    const err = (data as Record<string, unknown>).error as { message: string } | undefined;
    logger.error({ url, status: res.status, metaError: err }, "Meta API GET error");
    throw new Error(`Meta API error: ${err?.message ?? res.statusText}`);
  }
  return data;
}

// ─── Interest Search ──────────────────────────────────────────────────────────

export async function searchMetaInterest(
  query: string
): Promise<{ id: string; name: string; audienceSize?: number } | null> {
  const { accessToken } = getMetaConfig();
  const qs = new URLSearchParams({
    type: "adinterest",
    q: query,
    limit: "5",
    locale: "en_US",
    access_token: accessToken,
  });
  const url = `${META_BASE}/search?${qs}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    data?: { id: string; name: string; audience_size_lower_bound?: number }[];
    error?: { message: string };
  };
  if (!res.ok || data.error) {
    throw new Error(`Meta Interest Search error: ${data.error?.message ?? res.statusText}`);
  }
  const hit = data.data?.[0];
  if (!hit) return null;
  return { id: hit.id, name: hit.name, audienceSize: hit.audience_size_lower_bound };
}

export async function searchMetaInterests(
  query: string,
  limit = 10
): Promise<{ id: string; name: string; audienceSize?: number }[]> {
  const { accessToken } = getMetaConfig();
  const qs = new URLSearchParams({
    type: "adinterest",
    q: query,
    limit: String(Math.min(limit, 25)),
    locale: "en_US",
    access_token: accessToken,
  });
  const url = `${META_BASE}/search?${qs}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    data?: { id: string; name: string; audience_size_lower_bound?: number }[];
    error?: { message: string };
  };
  if (!res.ok || data.error) {
    throw new Error(`Meta Interest Search error: ${data.error?.message ?? res.statusText}`);
  }
  return (data.data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    audienceSize: h.audience_size_lower_bound,
  }));
}

// ─── Token Info & Refresh ─────────────────────────────────────────────────────

export async function getMetaTokenInfo(): Promise<{
  valid: boolean;
  expiresAt?: string;
  daysRemaining?: number;
  scopes?: string[];
  error?: string;
}> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!accessToken || !appId || !appSecret) {
    return { valid: false, error: "META_ACCESS_TOKEN, META_APP_ID and META_APP_SECRET must be set" };
  }
  try {
    const appToken = `${appId}|${appSecret}`;
    const qs = new URLSearchParams({ input_token: accessToken, access_token: appToken });
    const url = `${META_BASE}/debug_token?${qs}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      data?: {
        is_valid: boolean;
        expires_at?: number;
        scopes?: string[];
        error?: { message: string };
      };
      error?: { message: string };
    };
    if (!res.ok || data.error) {
      return { valid: false, error: data.error?.message ?? "Token debug failed" };
    }
    const d = data.data;
    if (!d) return { valid: false, error: "No token data returned" };
    if (!d.is_valid) return { valid: false, error: "Token is invalid or expired" };

    const expiresAt = d.expires_at ? new Date(d.expires_at * 1000).toISOString() : undefined;
    const daysRemaining = d.expires_at
      ? Math.max(0, Math.floor((d.expires_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined;

    return { valid: true, expiresAt, daysRemaining, scopes: d.scopes };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function refreshMetaToken(): Promise<{
  success: boolean;
  expiresAt?: string;
  note?: string;
  error?: string;
}> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!accessToken || !appId || !appSecret) {
    return { success: false, error: "META_ACCESS_TOKEN, META_APP_ID and META_APP_SECRET must be set" };
  }
  try {
    const qs = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: accessToken,
    });
    const url = `https://graph.facebook.com/oauth/access_token?${qs}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: { message: string };
    };
    if (!res.ok || data.error) {
      return { success: false, error: data.error?.message ?? "Token refresh failed" };
    }
    if (!data.access_token) {
      return { success: false, error: "No access token returned" };
    }
    // Update token in-process so the current server instance starts using it immediately.
    // The operator must also update META_ACCESS_TOKEN in Replit Secrets for persistence after restart.
    process.env.META_ACCESS_TOKEN = data.access_token;
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000).toISOString()
      : undefined;
    logger.info({ expiresAt }, "Meta access token refreshed in-process");
    return {
      success: true,
      expiresAt,
      note: "Token active for this server session. Update META_ACCESS_TOKEN in Replit Secrets to persist across restarts.",
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export interface MetaInsightMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  purchases: number;
  reach: number;
  frequency: number;
}

export interface MetaCampaignInsight extends MetaInsightMetrics {
  campaignId: string;
  campaignName: string;
  dateStart: string;
  dateStop: string;
}

export interface MetaAccountInsight extends MetaInsightMetrics {
  dateStart: string;
  dateStop: string;
  cpl: number;      // cost per lead
  roas: number;     // purchases / spend (approximate, needs revenue data for true ROAS)
}

function parseActions(actions: { action_type: string; value: string }[] | undefined, type: string): number {
  const hit = (actions ?? []).find(a => a.action_type === type);
  return hit ? parseFloat(hit.value) || 0 : 0;
}

function parseInsightRow(row: Record<string, unknown>): MetaInsightMetrics {
  const actions = row.actions as { action_type: string; value: string }[] | undefined;
  const spend = parseFloat(String(row.spend ?? "0")) || 0;
  const impressions = parseInt(String(row.impressions ?? "0"), 10) || 0;
  const clicks = parseInt(String(row.clicks ?? "0"), 10) || 0;
  const ctr = parseFloat(String(row.ctr ?? "0")) || 0;
  const cpc = parseFloat(String(row.cpc ?? "0")) || 0;
  const cpm = parseFloat(String(row.cpm ?? "0")) || 0;
  const reach = parseInt(String(row.reach ?? "0"), 10) || 0;
  const frequency = parseFloat(String(row.frequency ?? "0")) || 0;
  const leads = parseActions(actions, "lead") || parseActions(actions, "onsite_conversion.lead_grouped");
  const purchases = parseActions(actions, "purchase") || parseActions(actions, "offsite_conversion.fb_pixel_purchase");
  return { spend, impressions, clicks, ctr, cpc, cpm, reach, frequency, leads, purchases };
}

const INSIGHT_FIELDS = "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions";

export async function getAdAccountInsights(
  datePreset: string = "last_7d"
): Promise<MetaAccountInsight | null> {
  try {
    const { accountId } = getMetaConfig();
    const data = await metaGet<{ data: Record<string, unknown>[] }>(
      `${accountId}/insights`,
      { fields: INSIGHT_FIELDS, date_preset: datePreset, level: "account" }
    );
    if (!data.data || data.data.length === 0) return null;
    const row = data.data[0];
    const metrics = parseInsightRow(row);
    const cpl = metrics.leads > 0 ? metrics.spend / metrics.leads : 0;
    const roas = metrics.spend > 0 ? metrics.purchases / (metrics.spend / 1000) : 0; // rough ROAS proxy
    return {
      ...metrics,
      cpl,
      roas,
      dateStart: String(row.date_start ?? ""),
      dateStop: String(row.date_stop ?? ""),
    };
  } catch (err) {
    logger.error({ err }, "Failed to fetch account insights");
    return null;
  }
}

export async function getMetaCampaignInsights(
  metaCampaignId: string,
  datePreset: string = "last_7d"
): Promise<MetaCampaignInsight | null> {
  try {
    const data = await metaGet<{ data: Record<string, unknown>[] }>(
      `${metaCampaignId}/insights`,
      { fields: `campaign_id,campaign_name,${INSIGHT_FIELDS}`, date_preset: datePreset }
    );
    if (!data.data || data.data.length === 0) return null;
    const row = data.data[0];
    const metrics = parseInsightRow(row);
    return {
      ...metrics,
      campaignId: String(row.campaign_id ?? metaCampaignId),
      campaignName: String(row.campaign_name ?? ""),
      dateStart: String(row.date_start ?? ""),
      dateStop: String(row.date_stop ?? ""),
    };
  } catch (err) {
    logger.error({ err, metaCampaignId }, "Failed to fetch campaign insights");
    return null;
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export async function validateMetaCredentials(): Promise<{
  valid: boolean;
  adAccountName?: string;
  accountId?: string;
  currency?: string;
  error?: string;
}> {
  try {
    const { accountId } = getMetaConfig();
    const data = await metaGet<{
      id: string;
      name: string;
      currency: string;
      account_status: number;
    }>(accountId, { fields: "id,name,currency,account_status" });
    return {
      valid: data.account_status === 1,
      adAccountName: data.name,
      accountId: data.id,
      currency: data.currency,
    };
  } catch (err: unknown) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── Campaign Status & Budget Updates ────────────────────────────────────────

export async function updateMetaCampaignStatus(
  metaCampaignId: string,
  status: "PAUSED" | "ACTIVE"
): Promise<void> {
  await metaPost<{ success: boolean }>(`${metaCampaignId}`, { status });
  logger.info({ metaCampaignId, status }, "Meta campaign status updated");
}

export async function updateMetaCampaignBudget(
  metaCampaignId: string,
  dailyBudgetIdr: number
): Promise<void> {
  await metaPost<{ success: boolean }>(`${metaCampaignId}`, {
    daily_budget: Math.round(dailyBudgetIdr),
  });
  logger.info({ metaCampaignId, dailyBudgetIdr }, "Meta campaign budget updated");
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

const OBJECTIVE_MAP: Record<string, string> = {
  AWARENESS: "OUTCOME_AWARENESS",
  TRAFFIC: "OUTCOME_TRAFFIC",
  ENGAGEMENT: "OUTCOME_ENGAGEMENT",
  LEADS: "OUTCOME_LEADS",
  APP_PROMOTION: "OUTCOME_APP_PROMOTION",
  SALES: "OUTCOME_SALES",
};

export async function createMetaCampaign(opts: {
  name: string;
  objective: string;
  dailyBudget?: number | null;
  specialAdCategory?: boolean | null;
  cbo?: boolean | null;
}): Promise<string> {
  const { accountId } = getMetaConfig();
  const metaObjective = OBJECTIVE_MAP[opts.objective.toUpperCase()] ?? "OUTCOME_LEADS";

  const body: Record<string, unknown> = {
    name: opts.name,
    objective: metaObjective,
    status: "PAUSED", // Always start paused for human review
    special_ad_categories: opts.specialAdCategory ? ["CREDIT"] : [],
  };

  if (opts.cbo && opts.dailyBudget) {
    body.daily_budget = Math.round(opts.dailyBudget); // in lowest currency unit (IDR = Rupiah, no cents)
    body.bid_strategy = "LOWEST_COST_WITHOUT_CAP";
  }

  const result = await metaPost<{ id: string }>(`${accountId}/campaigns`, body);
  logger.info({ metaCampaignId: result.id }, "Meta campaign created");
  return result.id;
}

// ─── Ad Set ───────────────────────────────────────────────────────────────────

// ─── Placement helpers ────────────────────────────────────────────────────────

type CampaignPlacement = "facebook" | "instagram" | "whatsapp" | "all";

function buildPlacementTargeting(
  placement: CampaignPlacement,
  baseTargeting: Record<string, unknown>
): Record<string, unknown> {
  const t = { ...baseTargeting };
  switch (placement) {
    case "instagram":
      t.publisher_platforms = ["instagram"];
      t.instagram_positions = ["stream", "stories", "reels"];
      break;
    case "whatsapp":
      // CTWA runs on Facebook feed (the click opens WhatsApp)
      t.publisher_platforms = ["facebook"];
      t.facebook_positions = ["feed", "marketplace"];
      break;
    case "all":
      // Advantage+ automatic placements — omit publisher_platforms so Meta decides
      break;
    case "facebook":
    default:
      t.publisher_platforms = ["facebook"];
      t.facebook_positions = ["feed", "right_hand_column", "marketplace"];
      break;
  }
  return t;
}

export async function createMetaAdSet(opts: {
  campaignId: string;
  name: string;
  dailyBudget: number;
  optimizationGoal: string;
  billingEvent: string;
  placement?: string;
  targetingLocation?: string;
  targetingAgeMin?: number;
  targetingAgeMax?: number;
  targetingGender?: string;
  /** Interest names to resolve via Meta Targeting Search API at push time */
  targetingInterests?: string[];
  /** Pre-resolved interests (id + name) from the pipeline enrichment step — skips API lookup */
  preResolvedInterests?: { id: string; name: string }[];
  bidAmount?: number;
}): Promise<string> {
  const { accountId } = getMetaConfig();
  const placement = (opts.placement ?? "facebook") as CampaignPlacement;

  const baseTargeting: Record<string, unknown> = {
    age_min: opts.targetingAgeMin ?? 18,
    age_max: opts.targetingAgeMax ?? 65,
    geo_locations: { countries: ["ID"] },
  };

  if (opts.targetingGender === "male") baseTargeting.genders = [1];
  if (opts.targetingGender === "female") baseTargeting.genders = [2];

  // Build the resolved interest list for Meta targeting.
  // Pre-resolved interests (from pipeline enrichment) are used directly;
  // plain interest names are resolved via the Targeting Search API.
  const resolvedInterests: { id: string; name: string }[] = [];

  // 1. Add pre-resolved interests (no API call needed)
  if (opts.preResolvedInterests && opts.preResolvedInterests.length > 0) {
    for (const interest of opts.preResolvedInterests) {
      resolvedInterests.push({ id: interest.id, name: interest.name });
    }
    logger.info({ count: opts.preResolvedInterests.length }, "Using pre-resolved Meta interest IDs from pipeline enrichment");
  }

  // 2. Resolve any remaining plain interest names via Targeting Search API
  const remainingSlots = Math.max(0, 5 - resolvedInterests.length);
  if (opts.targetingInterests && opts.targetingInterests.length > 0 && remainingSlots > 0) {
    for (const interestName of opts.targetingInterests.slice(0, remainingSlots)) {
      try {
        const found = await searchMetaInterest(interestName);
        if (found) {
          resolvedInterests.push({ id: found.id, name: found.name });
          logger.info({ interestName, metaId: found.id, metaName: found.name }, "Meta interest resolved at push time");
        } else {
          logger.warn({ interestName }, "Interest not found in Meta catalogue — skipped");
        }
      } catch (e) {
        logger.warn({ interestName, err: e }, "Could not resolve Meta interest ID — skipping");
      }
    }
  }

  if (resolvedInterests.length > 0) {
    baseTargeting.flexible_spec = [{ interests: resolvedInterests }];
  }

  const targeting = buildPlacementTargeting(placement, baseTargeting);

  const OPTIMIZATION_MAP: Record<string, string> = {
    LEAD: "LEAD_GENERATION",
    PURCHASE: "OFFSITE_CONVERSIONS",
    ADD_TO_CART: "OFFSITE_CONVERSIONS",
    CONTACT: "CONVERSATIONS",
    REACH: "REACH",
  };

  const optimizationGoal =
    OPTIMIZATION_MAP[opts.optimizationGoal.toUpperCase()] ?? "LEAD_GENERATION";

  const body: Record<string, unknown> = {
    campaign_id: opts.campaignId,
    name: opts.name,
    daily_budget: Math.round(opts.dailyBudget),
    billing_event: opts.billingEvent || "IMPRESSIONS",
    optimization_goal: optimizationGoal,
    targeting,
    status: "PAUSED",
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
  };

  // CTWA: route clicks to WhatsApp
  if (placement === "whatsapp") {
    const whatsappNumber = process.env.META_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      throw new Error("META_WHATSAPP_NUMBER must be set in Secrets for WhatsApp (CTWA) campaigns");
    }
    const pageId = process.env.META_PAGE_ID;
    if (!pageId) {
      throw new Error("META_PAGE_ID must be set in Secrets for WhatsApp (CTWA) campaigns");
    }
    body.destination_type = "WHATSAPP";
    body.promoted_object = { page_id: pageId, whatsapp_phone_number: whatsappNumber };
  }

  if (opts.bidAmount) body.bid_amount = opts.bidAmount;

  const result = await metaPost<{ id: string }>(`${accountId}/adsets`, body);
  logger.info({ metaAdsetId: result.id, placement }, "Meta ad set created");
  return result.id;
}

// ─── Ad Creative ──────────────────────────────────────────────────────────────

export async function createMetaAdCreative(opts: {
  name: string;
  primaryText: string;
  headline: string;
  description?: string;
  linkUrl?: string;
  callToActionType?: string;
  pageId?: string;
  placement?: string;
}): Promise<string> {
  const { accountId } = getMetaConfig();
  const placement = (opts.placement ?? "facebook") as CampaignPlacement;
  const isCtwa = placement === "whatsapp";

  const CTA_MAP: Record<string, string> = {
    "Hubungi Kami": "CONTACT_US",
    "Contact Us": "CONTACT_US",
    "Beli Sekarang": "SHOP_NOW",
    "Buy Now": "SHOP_NOW",
    "Learn More": "LEARN_MORE",
    "Pelajari Selengkapnya": "LEARN_MORE",
    "Konsultasi Gratis": "CONTACT_US",
    "Daftar Sekarang": "SIGN_UP",
    "Sign Up": "SIGN_UP",
    "Download": "DOWNLOAD",
  };

  const ctaType = isCtwa
    ? "WHATSAPP_MESSAGE"
    : (opts.callToActionType ? CTA_MAP[opts.callToActionType] ?? "CONTACT_US" : "CONTACT_US");

  const pageId = opts.pageId || process.env.META_PAGE_ID;
  if (!pageId) {
    throw new Error("META_PAGE_ID is required to create ad creatives. Set it in Secrets.");
  }

  // Build CTA value — CTWA needs app_destination and WhatsApp number
  const ctaValue: Record<string, unknown> = {};
  if (isCtwa) {
    const whatsappNumber = process.env.META_WHATSAPP_NUMBER;
    if (!whatsappNumber) {
      throw new Error("META_WHATSAPP_NUMBER must be set in Secrets for WhatsApp (CTWA) creatives");
    }
    ctaValue.app_destination = "WHATSAPP";
    ctaValue.whatsapp_number = whatsappNumber;
  } else {
    ctaValue.link = opts.linkUrl || "https://www.facebook.com";
  }

  const body: Record<string, unknown> = {
    name: opts.name,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        message: opts.primaryText,
        link: isCtwa ? `https://wa.me/${(process.env.META_WHATSAPP_NUMBER ?? "").replace(/\D/g, "")}` : (opts.linkUrl || "https://www.facebook.com"),
        name: opts.headline,
        description: opts.description || "",
        call_to_action: {
          type: ctaType,
          value: ctaValue,
        },
      },
    },
  };

  const result = await metaPost<{ id: string }>(`${accountId}/adcreatives`, body);
  logger.info({ metaCreativeId: result.id }, "Meta ad creative created");
  return result.id;
}

// ─── Ad ───────────────────────────────────────────────────────────────────────

export async function createMetaAd(opts: {
  adsetId: string;
  name: string;
  creativeId: string;
}): Promise<string> {
  const { accountId } = getMetaConfig();

  const result = await metaPost<{ id: string }>(`${accountId}/ads`, {
    adset_id: opts.adsetId,
    name: opts.name,
    creative: { creative_id: opts.creativeId },
    status: "PAUSED",
  });

  logger.info({ metaAdId: result.id }, "Meta ad created");
  return result.id;
}
