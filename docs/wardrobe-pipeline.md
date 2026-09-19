# WEYRA wardrobe pipeline

| Stage | Live/free behavior | Production dependency |
| --- | --- | --- |
| Capture | Camera or gallery, 720×720 minimum check, preview and one-tap confirmation | Optional future blur/lighting model |
| Segmentation | JWT-protected Edge functions; a self-hostable rembg service returns transparent PNG crops and disconnected garment regions | HTTPS host, compute and a private token to activate real cutouts; mock mode preserves the original and marks review required |
| Metadata match | Zero-cost match against the licensed/internal product catalog; normalized metadata JSON | A contractually approved reverse-image API for public-web matching |
| Wardrobe | Supabase private Storage + Postgres, category/color, price, wear count and cost per wear | None |
| Avatar | Height, weight, body type and skin tone generate deterministic 2D anchor points | None |
| Dressing room | Tap-to-layer wardrobe pieces using category z-index rules; state persists per user | Transparent cutouts improve visual quality |
| Event filter | Occasion, temperature, time and surface rules remove ineligible items before generation | Optional weather API/location consent |
| Stylist | 768 women/men/unisex templates, six variants, missing-piece suggestions and saved history | Optional LLM for richer language |
| Wear tracking | “Wore today” creates a calendar event and atomically updates every item’s wear count | None |
| Batch intake | Select up to 30 gallery photos for sequential review, or separate up to 12 non-touching garments in one photo; visually similar crops are flagged, never silently removed | Self-hosted vision service for splitting and duplicate detection |
| Outfit board | Add closet pieces, drag them on a canvas and save a look with piece positions | Signed URLs for private garment images |
| Conversational stylist | Deterministic Turkish/English replies grounded in the wardrobe and budget; human request queue and admin reply | Real human staff for human responses; optional paid language model for generative replies |

### Vision service activation

The standalone `services/wardrobe-vision` image runs rembg with `u2netp` on CPU. It needs a private HTTPS endpoint (path `/process`), an operational host with sufficient memory, `VISION_TOKEN` and `SUPABASE_STORAGE_HOST` set on that host, and matching `WARDROBE_VISION_ENDPOINT`, `WARDROBE_VISION_TOKEN`, `VISION_PROCESSING_ENABLED=true`, `BACKGROUND_REMOVAL_PROVIDER=vision` secrets in the WEYRA Supabase project. The user must authorize any charge for hosting or provider use before these switches are enabled. Never place tokens in `EXPO_PUBLIC_` variables. With the switch off, single photo import remains usable but transparent cutouts and one-photo multi-garment splitting are not real processing. For best results, spread pieces apart and avoid overlap. Similarity is a review hint based on a perceptual hash, not a verified identical-product match.

Google Lens has no supported public product-search API for this use case. WEYRA therefore does not automate Lens or unauthorized scraping. SerpApi or another commercial provider can only be enabled after terms, pricing and user approval are confirmed.
