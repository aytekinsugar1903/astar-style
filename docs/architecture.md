# ASTRA STYLE — MVP Architecture

## Product flow

Sign up → consent → personal photo → style profile → garment upload → wardrobe → outfit → virtual try-on → product search → affiliate redirect.

## Modules

- **Client:** Expo Router screens and a shared design system.
- **Identity/data:** Supabase Auth + PostgreSQL with ownership-based RLS.
- **Media:** private Storage buckets; object paths start with the authenticated user id.
- **AI gateway:** server-only adapters for vision, stylist, embeddings and moderation.
- **Try-on:** asynchronous provider adapter with queued jobs, usage limit and result cache.
- **Commerce:** normalized products/offers plus official feed/API adapters; no unauthorized scraping.
- **Analytics:** first-party event table with pseudonymous identifiers and minimum necessary properties.
- **Admin:** app-metadata role checked server-side; never trust editable user metadata.

## Provider boundaries

Every provider implements a typed interface and returns normalized JSON. Provider name, latency, estimated cost and success state are stored in `ai_usage_events`. Secrets never enter the Expo bundle.

## Privacy

Explicit consent is versioned. Original and derived images can be deleted together. Signed URLs are short lived. EXIF is removed by a server-side media pipeline before external processing. Try-on is described as a visual preview, not a sizing guarantee.

## Cost controls

- Per-user daily try-on quota
- Idempotency key and result cache
- Image resize before paid inference
- Usage ledger by provider/model/user
- Mock providers in development
- Kill switch per provider
