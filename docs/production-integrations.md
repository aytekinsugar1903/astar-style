# Production integrations

All production providers are implemented behind server-only switches and remain disabled by default.

## Virtual try-on

Recommended first provider: FASHN `tryon-v1.6` for the consumer MVP.

Required Edge Function secrets:

- `PAID_PROVIDERS_ENABLED=true`
- `TRY_ON_PROVIDER=fashn`
- `FASHN_API_KEY`
- `FASHN_ESTIMATED_COST_USD`

Privacy controls:

- Input images use 180-second signed Supabase URLs.
- Moderation defaults to conservative.
- One output is requested.
- The generated image is copied into the user's private `try-on-results` bucket.
- Provider URLs are never exposed as the permanent user record.
- The adapter cannot run unless the global paid-provider switch is explicitly enabled.

## Garment image analysis

A server-only OpenAI Responses API adapter is ready.

Required Edge Function secrets:

- `PAID_PROVIDERS_ENABLED=true`
- `GARMENT_ANALYSIS_PROVIDER=openai`
- `OPENAI_API_KEY`
- `OPENAI_VISION_MODEL`
- `OPENAI_VISION_ESTIMATED_COST_USD`

The response is normalized to a strict category allowlist and bounded arrays before database storage. The mobile client never receives the API key.

## Official product feeds

The `official-json` adapter accepts only HTTPS JSON feeds using the normalized catalog contract.

Required Edge Function secrets:

- `OFFICIAL_CATALOG_ENABLED=true`
- `CATALOG_PROVIDER=official-json`
- `CATALOG_FEED_URL`
- optional `CATALOG_FEED_TOKEN`
- `CATALOG_SOURCE_NAME`

The server rejects invalid prices, currencies, audiences, commission rates, unsafe URLs, feeds above 500 products per run, and responses advertised above 5 MB. Unauthorized scraping is not supported.

## Activation checklist

1. Owner approves the provider and expected monthly ceiling.
2. Complete the provider's commercial account, DPA/privacy and regional-transfer review.
3. Set server-side secrets only.
4. Start with a small daily cost limit and internal test account.
5. Verify deletion, result retention, failure handling and cost events.
6. Enable a limited rollout before general availability.
