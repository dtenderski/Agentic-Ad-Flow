# TikTok Ads Integration — Setup Checklist

AdClaw uses the **TikTok Marketing API v1.3** to push campaigns to TikTok Ads Manager.

## Required Secrets (Replit Secrets tab)

| Secret | How to obtain |
|---|---|
| `TIKTOK_ACCESS_TOKEN` | [TikTok for Business](https://business.tiktok.com/) → Apps → your app → Long-term Access Token |
| `TIKTOK_ADVERTISER_ID` | TikTok Ads Manager → top-right dropdown → Account ID (numeric) |
| `TIKTOK_APP_ID` | TikTok for Business → Apps → your app → App ID |
| `TIKTOK_APP_SECRET` | TikTok for Business → Apps → your app → App Secret |

## Step-by-step: Obtaining the Access Token

1. Log in to [TikTok for Business](https://business.tiktok.com/)
2. Navigate to **Apps** → create an app or select an existing one
3. Under **Access Token**, generate a **Long-term Access Token** (valid 1 year)
4. Copy the token and save it as `TIKTOK_ACCESS_TOKEN` in Replit Secrets
5. Copy your **Advertiser ID** from TikTok Ads Manager and save as `TIKTOK_ADVERTISER_ID`

## Supported Campaign Objectives

| AdClaw Objective | TikTok Objective |
|---|---|
| REACH | REACH |
| AWARENESS | REACH |
| VIDEO_VIEWS | VIDEO_VIEWS |
| ENGAGEMENT | VIDEO_VIEWS |
| TRAFFIC | TRAFFIC |
| LEADS / LEAD_GENERATION | LEAD_GENERATION |
| SALES / CONVERSIONS | CONVERSIONS |
| APP_PROMOTION | APP_INSTALL |

## Notes

- All campaigns, ad groups, and ads are created in **DISABLE** status (TikTok's equivalent of PAUSED). Operators must activate them after review.
- **Video ads require a video asset** — upload your video in TikTok Creative Hub and attach it to the auto-created ad in TikTok Ads Manager before activating.
- The ad group targets **Indonesia** (location ID `6252001`) with automatic placement by default — adjust in TikTok Ads Manager if needed.
- Landing page URLs must be set in TikTok Ads Manager after push.
