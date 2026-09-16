# MVP status

## Implemented

- [x] Expo mobile/web foundation with Turkish and English support
- [x] Supabase authentication, persistent sessions, profile and double-confirmed account deletion
- [x] Consent-based style onboarding with women, men, and combined collection preferences
- [x] Private full-body and wardrobe photo storage, preview and permanent deletion
- [x] Automatic garment classification through a replaceable provider interface (free mock provider active)
- [x] Digital wardrobe with ownership-based RLS and private storage policies
- [x] 768-template outfit engine: 3 audiences × 8 occasions × 4 seasons × 8 styles
- [x] Six distinct outfit suggestions per request, saved outfit history and missing-piece routing
- [x] Women, men, and unisex outfit structures; men’s combinations do not depend on dress categories
- [x] 80-item synthetic demo catalog: 34 women, 24 men, 22 unisex; 11 categories
- [x] Product search with collection, category, color, style, stock and budget filters
- [x] Style-profile ranking, product detail, saved products and affiliate-click event hook
- [x] Official API/feed catalog adapter boundary and admin-only catalog synchronization
- [x] Virtual try-on job queue behind a replaceable provider interface (free mock provider active)
- [x] Per-user AI quotas, daily estimated-cost guards and localized function errors
- [x] Privacy-minimized analytics for DAU, MAU, retention, sessions, try-on and product engagement
- [x] Admin dashboard for users, products, AI usage/cost, conversions and errors
- [x] EAS preview/production build profiles; signing credentials intentionally not connected
- [x] CI checks for type safety, translations, Expo health, web export and mobile browser journeys

## Live backend

- Supabase project: `ASTRA STYLE` (`dxnfjwtlysfbasverfiw`)
- Region: Frankfurt / `eu-central-1`
- Current plan and added usage cost: Free / 0 USD
- Active catalog: 80 synthetic products; no scraping and no copied third-party imagery
- Outfit engine: 768 base templates; six variants returned per request
- Edge Functions: classify-garment v3, outfit v7, try-on v3, admin-dashboard v3, delete-account v2, catalog-sync v3
- Providers: free mock providers active; FASHN, OpenAI vision and official JSON feed adapters installed but disabled
- Security: JWT-protected functions, RLS on public data and private photo buckets

## Provider-dependent production work

These are intentionally not activated because they require an external account, commercial terms, payment, or store-owner approval:

- [x] FASHN try-on adapter with explicit paid-provider switch (activation and credits pending)
- [x] OpenAI image-analysis adapter with strict normalization (activation and credentials pending)
- [x] HTTPS official JSON affiliate-feed adapter (network credentials and commercial links pending)
- [ ] Payment provider merchant account
- [ ] Apple Developer / Google Play accounts and signed store builds
- [ ] Production domain and hosting decision

## Cost and compliance guardrails

- Paid providers remain disabled until explicit owner approval.
- Product ingestion accepts official APIs or affiliate feeds; unauthorized scraping is excluded.
- Demo catalog content is synthetic and links only to example.com.
- User photos are private and are not sent to third parties while mock providers are active.
- Every AI/try-on call has a cost-log and quota boundary ready for a future provider.
