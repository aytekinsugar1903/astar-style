# Catalog import and 3D garment contract

## Available in the phone web demo

Products now shows the existing openly licensed garment photographs with attribution, plus the authored WEYRA fitting collection (9 products / 18 original GLB and preview variants). These are reference templates, not current retailer offers. Existing synthetic shopping examples remain explicitly described as samples. Price, stock and matching score are not invented for photo/imported products.

The `catalog-import` screen accepts a store-provided JSON, CSV or XML file (8 MB / 30,000 variant limit), pasted data, a public feed URL, or a WooCommerce store URL. WooCommerce lists products and variations separately and pages through each collection. Browser CORS must permit access; file import is the fallback. No credentials, retailer-page scraping or external accounts are involved.

Imports are staged with product/variant/error counts, then saved only when every data row is valid. Importing the same source website replaces that source's snapshot; other sources remain. Source removal is supported. Imported catalogues are **device-local**, not a server-wide continuously synchronized retailer catalogue. Reimport is manual; no scheduler has been configured. Large feeds must be split into source-specific complete snapshots or the limits changed deliberately; importing a partial source snapshot replaces the previous source.

Original category labels are retained alongside the normalized avatar category. Product IDs are scoped to the source website, variants have stable IDs, original images and colour names are preserved. Selecting colour and size selects the corresponding image/price/stock. “Dress my avatar” carries the exact variant ID. Unsupported categories and missing required data block import and list affected rows.

## Canonical JSON

```json
{
  "products": [{
    "id": "retailer-product-id",
    "name": "Original product name",
    "brand": "Retailer",
    "category": "Women > T-shirts",
    "categoryKey": "tshirt",
    "productUrl": "https://store.example/products/shirt",
    "variants": [{
      "id": "retailer-variant-id",
      "color": "Blue",
      "colorHex": "#3978B0",
      "size": "M",
      "imageUrl": "https://store.example/images/blue.jpg",
      "price": 499.90,
      "currency": "TRY",
      "inStock": true
    }]
  }]
}
```

Every product/variant needs a stable identifier, name, recognizable category, HTTPS image and product URL. Price and stock can be omitted; the interface says unavailable. Variants missing explicit IDs must still have unique supplier IDs/SKUs. Do not group distinct colours under the same variant identifier.

CSV supports canonical fields, Google/Awin-style product and group IDs, Shopify option columns and variant images. XML supports RSS Google Shopping items, feed entries, `<products><product>…` and `<urunler><urun>…`; namespaced Google fields are recognized. Proprietary schemas may need adapters. DTD/entity declarations and secret-bearing URLs are rejected. Use test fixtures as examples, not live stock sources.

## Real 3D asset contract

A variant can include:

```json
"wearable": {
  "url": "https://store.example/garments/blue.glb",
  "profile": "weyra-v1",
  "kind": "female",
  "provenance": "supplier",
  "license": "Supplier permission"
}
```

`weyra-v1` means a garment-only static mesh, metres, Y-up, floor origin and front +Z, already fitted to the posed default WEYRA mannequin: height 172, chest 94, waist 78, hip 98, inseam 80, thigh 54; six region multipliers 100%. The template world silhouette is approximately 2.04 units tall. A generic product-view GLB does not automatically satisfy this contract. A supplier must align its pattern to the reference pose before claiming this profile. No arbitrary self-alignment or photo-to-mesh reconstruction is claimed.

Supported GLB: version 2, self-contained buffers and embedded image buffer views, standard static meshes/materials, at most 12 MB and 200,000 vertices. External resource URIs, skinned rigs, Draco/Meshopt/BasisU compressed dependencies are not supported. Materials and maps are preserved. Static geometry is approximately retargeted to current regional measurements, with vertex collision projection and leg/height adjustment. This is not sewing-pattern grading or physical cloth simulation.

The viewer switches to the correct mannequin type when selecting a profiled asset. Network or incompatible-asset failures show a labelled category approximation; outdated requests are cancelled. Native Expo currently remains on the existing 2D fallback. The sample template assets are CC0, authored from the procedural WEYRA fitting geometry, and correctly labelled as templates.

## Validation and remaining dependencies

TypeScript and bilingual keys checked. Import fixtures cover canonical JSON, quoted CSV, Google XML, WooCommerce minor-unit prices, Shopify inherited option names, original variant images, duplicates, unknown price/stock and invalid input. All 18 GLB assets parsed and retargeted to two measurement profiles. Procedural clearance tests cover three size profiles and 264 front/back samples. iOS/Android/web exports passed; these exports are not physical-device tests. Browser interaction and iPhone WebGL visual/performance checks remain unavailable in this execution environment.

No live merchant credential/feed has been supplied or connected. There is no verified permission or full catalogue access for Zara, LC Waikiki, DeFacto or Trendyol. Their original catalogues and product-specific wearable models remain external dependencies, not completed integrations. Store access and exact garment assets cannot be substituted with the sample templates.

## Shoe brand selection (2026-10-03)

Home shoe hanger opens `/shoe-brands`; the avatar shoe slot also links there. Nine manually verified brand destinations: Nike, adidas, PUMA, Skechers, Converse, Vans, ASICS, Lumberjack (FLO) and Kinetix (FLO). URLs are in `src/catalog/shoe-brands.ts`. Official web pages are browsing destinations, **not connected feeds**. No retailer product images, prices or stock were scraped or copied.

Each brand opens `/products?category=shoes&brand=...`. Filters use the mapped shoe category and normalized exact brand identity. Synthetic demo records are excluded. Imported unknown brands are added dynamically; openly licensed sample models with identified brands count as examples, not current retailer inventory. Wikimedia-only records are accessible through All shoes, never treated as a shoe company. Empty states and store links remain usable before merchant feeds are imported. Original variants flow through the existing detail selector to the avatar; without a compatible garment GLB, dressing is a labelled category approximation. Store-link errors are handled.

Research references: https://www.nike.com/tr/ ; https://www.adidas.com.tr/tr/ayakkabi ; https://tr.puma.com/ ; https://www.skechers.com.tr/blog/skechers-magazalari-seninle/ ; https://www.converse.com.tr/ ; https://www.vans.com.tr/ayakkabi ; https://www.asics.com.tr/ ; https://www.flo.com.tr/ayakkabi?marka=lumberjack ; https://www.flo.com.tr/marka/kinetix . Skechers domain independently cross-checked against the Turkish ministry ETBIS record. New Balance Türkiye could not be fetched (418), so it is not presented as a verified new directory entry in this release.

WEYRA reference collection now includes two shoe products (female/male) with two real GLB color variants each. These are generic authored shoe shapes, not manufacturer reconstructions. Each is selectable through WEYRA in the shoe-brand flow. Full manufacturer catalogs and exact shoe meshes remain unconnected.

## Integrated fitting workspace — version 17

Home category hangers now open the fitting workspace as an in-page modal; the URL does not change. The mannequin remains visible while the product pane scrolls independently, with a desktop side-by-side layout. Shoes and clothing share category → brand → model → original variant/image selection. Choosing an item or changing its imported color/size updates the existing mannequin immediately. `/avatar`, `/dressing-room` and the legacy `/shoe-brands` entry all reuse the same component. Closing the modal returns to the selected closet category, preserving existing photo editing/favorites operations.

`CatalogInRoom` groups imported products by original product rather than treating each size as a separate model; imported variants keep their own primary and additional images and exact colour/size labels. Photograph samples show only documented visible colour, unknown stock/size notices and attribution. The original image is available in the same pane beside the mannequin; a generic fit is still explicitly labelled an approximation. File-based JSON/XML/CSV import is available inside the pane, including native paste fallback, and never requires another route. No external storefront opens during product selection or dressing. Optional size data is an SKU selection, not a physical garment-size simulation.

Four new openly licensed photograph examples: UNIQLO white boxy tee (CC BY 4.0), UNIQLO Minions white tee with front/rear model views (CC BY-SA 4.0), H&M coral aloha shirt (CC BY-SA 4.0), H&M white long sleeve tee (CC0). Brand/photo descriptions, visible garments and license metadata were checked against original Commons pages. The collection now contains 124 distinct primary photos; the additional rear view has its own attribution. These are photo examples, not live retailer offers; exact SKU/size or additional colour inventories were not inferred. See `assets/garments/licensed-clothing-attribution.json`.

Research found publicly readable Shopify JSON for Colorful Standard and Organic Basics, including real option/image/availability fields. Neither was accepted as an open-license catalogue: Colorful Standard terms prohibit scraping/exploiting service portions, and Organic Basics terms reserve intellectual-property and redistribution rights. Their product data and images were **not** incorporated into the Site or labelled open source. References: https://colorfulstandard.com/policies/terms-of-service and https://organicbasics.com/pages/terms-conditions . Public access is not evidence of an open reuse license.

Complete live merchant catalogs and exact manufacturer 3D garments still require appropriately reusable supplier feeds and compatible product meshes. The current original photos are exact photo views; the generated fitting shapes do not reconstruct cuts, drape, logos or prints from those photos. No paid service or key was added.

Validation: type checks, Turkish/English translation checks, 124-photo attribution/uniqueness checks, import regression tests and iOS/Android/web exports. Interactive browser and physical-device UI/performance were not verified this turn.
