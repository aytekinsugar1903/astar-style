# MVP status

## Implemented

- [x] Expo mobile/web foundation with Turkish and English support
- [x] Supabase authentication, persistent sessions, profile and double-confirmed account deletion
- [x] Consent-based style onboarding with women, men, and combined collection preferences
- [x] Height, weight, body-shape and skin-tone avatar setup with generated 2D anchor points
- [x] Camera/gallery garment capture, minimum-resolution check and one-tap wardrobe confirmation card
- [x] Private full-body and wardrobe photo storage, preview and permanent deletion
- [x] Automatic garment classification through a replaceable provider interface (free mock provider active)
- [x] Digital wardrobe with ownership-based RLS and private storage policies
- [x] 2D dressing room with category-based layering and persisted canvas state (transparent garment cutouts require a configured provider)
- [x] 768 contextual outfit templates: 3 audiences × 8 occasions × 4 seasons × 8 styles; 256 distinct tested looks with a four-category, 16-piece test wardrobe
- [x] Six style-labeled outfit suggestions per request, saved outfit history and missing-piece routing; unique garment sets depend on wardrobe variety
- [x] Event, temperature, time and surface rules; wedding-white and terrain/heel exclusions
- [x] “Wore today” calendar log, wear count and cost-per-wear tracking
- [x] Women, men, and unisex outfit structures; men’s combinations do not depend on dress categories
- [x] 80-item synthetic demo catalog: 34 women, 24 men, 22 unisex; 11 categories
- [x] Product search with collection, category, color, style, stock and budget filters
- [x] Style-profile ranking, product detail, saved products and affiliate-click event hook
- [x] Official API/feed catalog adapter boundary and admin-only catalog synchronization
- [x] Virtual try-on job queue behind a replaceable provider interface (free mock provider active)
- [x] Per-user AI quotas, daily estimated-cost guards and localized function errors
- [x] Privacy-minimized analytics for DAU, MAU, retention, sessions, try-on and product engagement
- [x] Admin dashboard for users, products, AI usage/cost, conversions and errors
- [x] Premium subscription/entitlement schema with owner-read-only RLS
- [x] Admin-only daily and weekly operations runner with persistent run history
- [x] EAS preview/production build profiles; signing credentials intentionally not connected
- [x] CI checks for type safety, translations, Expo health, web export and mobile browser journeys
- [x] Multi-photo intake queue, manual metadata correction, isolated-foreground splitter and similar-garment review hints; service deployment is pending a host
- [x] Self-hostable rembg cutout service and private JWT Edge boundaries for single and grouped garment photos
- [x] Draggable collage board with saved outfit positions
- [x] Grounded Turkish/English stylist chat, owner-only human stylist requests and admin-only response flow

## Live backend

- Supabase project: `ASTRA STYLE` / WEYRA app (`dxnfjwtlysfbasverfiw`); dashboard display-name rename is optional
- Region: Frankfurt / `eu-central-1`
- Current plan and added usage cost: Free / 0 USD
- Active catalog: 80 synthetic products; no scraping and no copied third-party imagery
- Outfit engine: 768 base templates; six variants returned per request
- Edge Functions: classify-garment v3, outfit v10, background-remove v3, enrich-garment v3, split-garments v1, stylist-reply v1, try-on v3, admin-dashboard v4, delete-account v3, catalog-sync v3, operations-runner v1
- Providers: free mock providers active; FASHN, OpenAI vision and official JSON feed adapters installed but disabled
- Security: JWT-protected functions, RLS on public data and private photo buckets

## Provider-dependent production work

These are intentionally not activated because they require an external account, commercial terms, payment, or store-owner approval:

- [x] FASHN try-on adapter with explicit paid-provider switch (activation and credits pending)
- [x] OpenAI image-analysis adapter with strict normalization (activation and credentials pending)
- [x] HTTPS official JSON affiliate-feed adapter (network credentials and commercial links pending)
- [x] Provider-neutral premium entitlement foundation (payment merchant account and webhook activation pending)
- [x] Self-hosted rembg image processing code and connected Edge interface (actual host, credentials and production throughput testing pending; mock leaves cutout empty)
- [x] Internal text-only catalog suggestions require user verification; reverse visual search is not active
- [ ] Apple Developer / Google Play accounts and signed store builds
- [ ] Production domain and hosting decision

## Verification limits

- TypeScript, translation parity, provider guards, deterministic outfit cases and static web export pass locally.
- Playwright browser journeys are configured, but the local Chromium download timed out; these journeys have not passed locally.
- Real registration, camera use, signed mobile builds, third-party try-on, cutout, real marketplace checkout and purchase attribution still need on-device/provider tests.
- Human stylist replies need a real assigned stylist; the queue and admin response interface alone do not supply a human service. The conversational free stylist is a rules-based assistant, not a connected generative model.

## Cost and compliance guardrails

- Paid providers remain disabled until explicit owner approval.
- Product ingestion accepts official APIs or affiliate feeds; unauthorized scraping is excluded.
- Demo catalog content is synthetic and links only to example.com.
- User photos are private and are not sent to third parties while mock providers are active.
- Every AI/try-on call has a cost-log and quota boundary ready for a future provider.

