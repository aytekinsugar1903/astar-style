# WEYRA wardrobe pipeline

| Stage | Live/free behavior | Production dependency |
| --- | --- | --- |
| Capture | Camera or gallery, 720×720 minimum check, preview and one-tap confirmation | Optional future blur/lighting model |
| Segmentation | JWT-protected provider service; free mode preserves the private original and marks review required | A self-hosted BiRefNet endpoint and token for transparent PNG output |
| Metadata match | Zero-cost match against the licensed/internal product catalog; normalized metadata JSON | A contractually approved reverse-image API for public-web matching |
| Wardrobe | Supabase private Storage + Postgres, category/color, price, wear count and cost per wear | None |
| Avatar | Height, weight, body type and skin tone generate deterministic 2D anchor points | None |
| Dressing room | Tap-to-layer wardrobe pieces using category z-index rules; state persists per user | Transparent cutouts improve visual quality |
| Event filter | Occasion, temperature, time and surface rules remove ineligible items before generation | Optional weather API/location consent |
| Stylist | 768 women/men/unisex templates, six variants, missing-piece suggestions and saved history | Optional LLM for richer language |
| Wear tracking | “Wore today” creates a calendar event and atomically updates every item’s wear count | None |

Google Lens has no supported public product-search API for this use case. WEYRA therefore does not automate Lens or unauthorized scraping. SerpApi or another commercial provider can only be enabled after terms, pricing and user approval are confirmed.
