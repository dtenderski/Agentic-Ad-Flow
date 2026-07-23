# LinkedIn Ads Integration — Setup Checklist

AdClaw uses the **LinkedIn Marketing API v2** to push campaigns to LinkedIn Campaign Manager.

## Required Secrets (Replit Secrets tab)

| Secret | How to obtain |
|---|---|
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn Developer Portal → App → OAuth 2.0 → Generate access token with `rw_ads` + `r_ads_reporting` scopes |
| `LINKEDIN_ACCOUNT_ID` | LinkedIn Campaign Manager → top-right account selector → Account ID (numeric) |
| `LINKEDIN_CLIENT_ID` | LinkedIn Developer Portal → App → Auth → Client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Developer Portal → App → Auth → Client Secret |

## Step-by-step: Obtaining the Access Token

1. Log in to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Create or select an app and go to **Auth** tab
3. Under **OAuth 2.0 settings**, add `https://www.linkedin.com/developers/tools/oauth/redirect` as a redirect URL
4. Go to **Products** and request access to **Marketing Developer Platform** (may require LinkedIn approval)
5. Use the **OAuth 2.0 Token Generator** (Auth tab → OAuth 2.0 tools) with scopes:
   - `rw_ads` — create and manage ads
   - `r_ads_reporting` — read analytics
6. Authorize the app and copy the generated **Access Token**
7. Save as `LINKEDIN_ACCESS_TOKEN` in Replit Secrets
8. Find your **Account ID** in LinkedIn Campaign Manager (URL: `https://www.linkedin.com/campaignmanager/accounts/{ACCOUNT_ID}/`)

## Supported Campaign Objectives

| AdClaw Objective | LinkedIn Objective |
|---|---|
| AWARENESS / BRAND_AWARENESS | BRAND_AWARENESS |
| TRAFFIC / WEBSITE_VISITS | WEBSITE_VISITS |
| LEADS / LEAD_GENERATION | LEAD_GENERATION |
| SALES / CONVERSIONS | WEBSITE_CONVERSIONS |
| JOB_APPLICANTS | JOB_APPLICANTS |

## Notes

- All campaigns and creatives are created in **PAUSED** status. Activate in LinkedIn Campaign Manager after review.
- **Text Ad format** is used by default (headline max 25 chars, description max 75 chars) — update copy and destination URL in Campaign Manager before activating.
- To use Sponsored Content instead, create the content post in LinkedIn first, then upgrade the creative in Campaign Manager.
- **Budget** is passed in USD as a rough conversion from IDR (÷15500). Verify and correct the budget in Campaign Manager.
- Default targeting: **Indonesia** (geo URN `urn:li:geo:102478259`). Add job titles, industries, and seniority targeting in Campaign Manager for true B2B precision.
- Access tokens expire — LinkedIn tokens typically last 60 days. Regenerate and update `LINKEDIN_ACCESS_TOKEN` before expiry.
