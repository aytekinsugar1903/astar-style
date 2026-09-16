import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { mockCatalogProvider } from "./providers/mock.ts";
import { createOfficialJsonProvider } from "./providers/official-json.ts";
import type { CatalogFeedItem, CatalogProvider } from "./providers/types.ts";

function provider(): CatalogProvider {
  const name = Deno.env.get("CATALOG_PROVIDER") ?? "mock";
  if (name === "mock") return mockCatalogProvider;
  if (name === "official-json") {
    if (Deno.env.get("OFFICIAL_CATALOG_ENABLED") !== "true") throw new Error("OFFICIAL_CATALOG_DISABLED");
    const url = Deno.env.get("CATALOG_FEED_URL");
    if (!url) throw new Error("CATALOG_PROVIDER_NOT_CONFIGURED");
    return createOfficialJsonProvider({ url, token: Deno.env.get("CATALOG_FEED_TOKEN"), sourceName: Deno.env.get("CATALOG_SOURCE_NAME") ?? "official-feed" });
  }
  throw new Error("CATALOG_PROVIDER_NOT_CONFIGURED");
}

function safeUrl(value: string | undefined) {
  if (!value) return undefined;
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("INVALID_PRODUCT_URL");
  return url.toString();
}

function validate(item: CatalogFeedItem): CatalogFeedItem {
  const currency = item.currency.trim().toUpperCase();
  if (!item.externalId.trim() || !item.name.trim() || !item.category.trim() || !item.merchant.trim()) throw new Error("INVALID_CATALOG_ITEM");
  if (!["women", "men", "unisex"].includes(item.audience)) throw new Error("INVALID_AUDIENCE");
  if (!Number.isFinite(item.price) || item.price < 0) throw new Error("INVALID_PRICE");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("INVALID_CURRENCY");
  const commissionRate = item.commissionRate;
  if (commissionRate !== undefined && (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1)) throw new Error("INVALID_COMMISSION");
  return { ...item, externalId: item.externalId.trim().slice(0, 160), name: item.name.trim().slice(0, 240), brand: item.brand?.trim().slice(0, 160), category: item.category.trim().slice(0, 80), merchant: item.merchant.trim().slice(0, 160), colors: item.colors.filter(Boolean).slice(0, 8), styleTags: item.styleTags.filter(Boolean).slice(0, 12), productUrl: safeUrl(item.productUrl)!, imageUrl: safeUrl(item.imageUrl), affiliateUrl: safeUrl(item.affiliateUrl), currency };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    if (auth.user.app_metadata?.role !== "admin") return json({ error: "FORBIDDEN" }, 403);

    const source = provider();
    const items = (await source.fetchProducts()).map(validate);
    if (items.length > 500) return json({ error: "FEED_TOO_LARGE" }, 413);

    let productsUpserted = 0;
    let offersUpserted = 0;
    for (const item of items) {
      const now = new Date().toISOString();
      const { data: product, error: productError } = await admin.from("products").upsert({
        source: source.name, external_id: item.externalId, name: item.name, brand: item.brand ?? null,
        category: item.category, colors: item.colors, image_url: item.imageUrl ?? null, product_url: item.productUrl,
        metadata: { style_tags: item.styleTags, audience: item.audience, synced_at: now }, active: true, updated_at: now,
      }, { onConflict: "source,external_id" }).select("id").single();
      if (productError) throw productError;
      productsUpserted += 1;

      const { data: existing, error: lookupError } = await admin.from("product_offers").select("id")
        .eq("product_id", product.id).eq("merchant", item.merchant).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      const offer = { product_id: product.id, merchant: item.merchant, price: item.price, currency: item.currency,
        in_stock: item.inStock ?? null, affiliate_url: item.affiliateUrl ?? null,
        commission_rate: item.commissionRate ?? null, updated_at: now };
      const offerResult = existing
        ? await admin.from("product_offers").update(offer).eq("id", existing.id)
        : await admin.from("product_offers").insert(offer);
      if (offerResult.error) throw offerResult.error;
      offersUpserted += 1;
    }
    return json({ provider: source.name, productsUpserted, offersUpserted, estimatedCostUsd: 0 });
  } catch (error) {
    console.error("catalog_sync_failed", error);
    return json({ error: error instanceof Error && ["CATALOG_PROVIDER_NOT_CONFIGURED","OFFICIAL_CATALOG_DISABLED"].includes(error.message) ? error.message : "INTERNAL_ERROR" }, 500);
  }
});
