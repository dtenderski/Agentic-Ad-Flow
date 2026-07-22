# Google Ads & YouTube Integration — Setup Checklist

AdClaw uses the **Google Ads REST API v17** with OAuth2 to push campaigns to Google Search, Display, and YouTube.

## Required Secrets (Replit Secrets tab)

| Secret | How to obtain |
|---|---|
| `GOOGLE_ADS_DEVELOPER_TOKEN` | [Google Ads API Center](https://developers.google.com/google-ads/api/docs/get-started/dev-token) — apply for Basic access (free for production use) |
| `GOOGLE_ADS_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | Same OAuth 2.0 Client as above |
| `GOOGLE_ADS_REFRESH_TOKEN` | [Google OAuth Playground](https://developers.google.com/oauthplayground/) — authorize `https://www.googleapis.com/auth/adwords`, exchange for refresh token |
| `GOOGLE_ADS_CUSTOMER_ID` | Your Google Ads customer ID (digits only, e.g. `1234567890` — strip dashes from `123-456-7890`) |

## Step-by-step: Obtaining the Refresh Token

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground/)
2. Click ⚙️ (Settings) → check "Use your own OAuth credentials" → enter your `GOOGLE_ADS_CLIENT_ID` + `GOOGLE_ADS_CLIENT_SECRET`
3. In Step 1, enter scope: `https://www.googleapis.com/auth/adwords` → Authorize APIs
4. In Step 2, click "Exchange authorization code for tokens" → copy the **Refresh Token**

## Notes

- All campaigns are created in **PAUSED** status — operators must activate them in Google Ads Manager after reviewing ad copy and final URLs.
- Ad copy (headlines, descriptions) and the final URL are placeholders at push time — update them in Google Ads Manager before activating.
- The developer token must have **Basic Access** (not Test Account) to push to live accounts.
- The `GOOGLE_ADS_CUSTOMER_ID` must be the **manager account** customer ID if you're managing multiple accounts.
