import type { Json } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { mockProducts } from "./mock-products";
import type { CatalogProduct } from "./types";

export type StylePreferences = {
  preferredColors: string[];
  avoidedColors: string[];
  styleTags: string[];
  audience: "women" | "men" | "unisex";
};

const emptyPreferences: StylePreferences = { preferredColors: [], avoidedColors: [], styleTags: [], audience: "unisex" };

function canonical(value: string) {
  const normalized = value.trim().toLocaleLowerCase("tr-TR");
  const aliases: Record<string, string> = {
    siyah: "black", krem: "cream", bordo: "burgundy", lacivert: "navy",
    klasik: "classic", romantik: "romantic", zamansız: "timeless",
    rahat: "casual", sokak: "street", ofis: "office", cesur: "bold",
  };
  return aliases[normalized] ?? normalized;
}

function metadataTags(metadata: Json): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const tags = metadata.style_tags;
  return Array.isArray(tags) ? tags.filter((value): value is string => typeof value === "string") : [];
}

function metadataScore(metadata: Json, externalId: string) {
  const demoScore = mockProducts.find((product) => product.id === externalId)?.styleScore;
  if (demoScore) return demoScore;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return 72;
  return typeof metadata.style_score === "number" ? metadata.style_score : 72;
}

function score(base: number, colors: string[], tags: string[], preferences: StylePreferences) {
  const preferred = new Set(preferences.preferredColors.map(canonical));
  const avoided = new Set(preferences.avoidedColors.map(canonical));
  const styles = new Set(preferences.styleTags.map(canonical));
  const colorKeys = colors.map(canonical);
  const tagKeys = tags.map(canonical);
  const value = base
    + colorKeys.filter((color) => preferred.has(color)).length * 7
    + tagKeys.filter((tag) => styles.has(tag)).length * 5
    - colorKeys.filter((color) => avoided.has(color)).length * 12;
  return Math.max(45, Math.min(99, value));
}

export async function loadStylePreferences(userId?: string): Promise<StylePreferences> {
  if (!userId) return emptyPreferences;
  const [profile, favorites] = await Promise.all([
    supabase.from("style_profiles")
      .select("preferred_colors,avoided_colors,style_tags,body_preferences")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("favorites")
      .select("product_id")
      .eq("user_id", userId)
      .limit(100),
  ]);
  const firstError = profile.error ?? favorites.error;
  if (firstError) throw firstError;

  const productIds = (favorites.data ?? []).map((item) => item.product_id);
  let savedColors: string[] = [];
  let savedTags: string[] = [];
  if (productIds.length) {
    const savedProducts = await supabase.from("products")
      .select("colors,metadata")
      .in("id", productIds)
      .eq("active", true);
    if (savedProducts.error) throw savedProducts.error;
    savedColors = (savedProducts.data ?? []).flatMap((product) => product.colors);
    savedTags = (savedProducts.data ?? []).flatMap((product) => metadataTags(product.metadata));
  }

  const data = profile.data;
  return {
    preferredColors: [...new Set([...(data?.preferred_colors ?? []), ...savedColors])],
    avoidedColors: data?.avoided_colors ?? [],
    styleTags: [...new Set([...(data?.style_tags ?? []), ...savedTags])],
    audience: data?.body_preferences && typeof data.body_preferences === "object" && !Array.isArray(data.body_preferences) && (data.body_preferences.audience === "women" || data.body_preferences.audience === "men") ? data.body_preferences.audience : "unisex",
  };
}

export async function loadCatalog(preferences: StylePreferences = emptyPreferences): Promise<CatalogProduct[]> {
  const [catalog, offers] = await Promise.all([
    supabase.from("products")
      .select("id,external_id,name,brand,category,colors,image_url,product_url,source,metadata")
      .eq("active", true)
      .limit(200),
    supabase.from("product_offers")
      .select("product_id,price,currency,in_stock,affiliate_url,commission_rate,merchant")
      .order("price", { ascending: true }),
  ]);
  const error = catalog.error ?? offers.error;
  if (error) throw error;

  const firstOffer = new Map<string, NonNullable<typeof offers.data>[number]>();
  for (const offer of offers.data ?? []) {
    if (!firstOffer.has(offer.product_id)) firstOffer.set(offer.product_id, offer);
  }

  return (catalog.data ?? []).flatMap((product) => {
    const offer = firstOffer.get(product.id);
    if (!offer) return [];
    const tags = metadataTags(product.metadata);
    return [{
      id: product.external_id,
      dbId: product.id,
      source: product.source,
      audience: product.metadata && typeof product.metadata === "object" && !Array.isArray(product.metadata) && (product.metadata.audience === "women" || product.metadata.audience === "men") ? product.metadata.audience : "unisex",
      imageUrl: product.image_url ?? undefined,
      merchant: offer.merchant,
      name: product.name,
      brand: product.brand ?? offer.merchant,
      category: product.category,
      color: product.colors[0] ?? "",
      styleTags: tags,
      price: offer.price,
      currency: offer.currency,
      productUrl: product.product_url,
      affiliateUrl: offer.affiliate_url ?? undefined,
      commissionRate: offer.commission_rate ?? undefined,
      inStock: offer.in_stock ?? false,
      styleScore: score(metadataScore(product.metadata, product.external_id), product.colors, tags, preferences),
    }];
  });
}

