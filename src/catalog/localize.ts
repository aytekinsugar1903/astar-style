import type { Locale } from "@/i18n/translations";
import type { CatalogProduct } from "./types";

const englishById: Record<string, Partial<CatalogProduct>> = {
  p1: { name: "Satin Midi Dress", category: "Dress", color: "Burgundy", styleTags: ["Classic", "Romantic"] },
  p2: { name: "Draped Black Dress", category: "Dress", color: "Black", styleTags: ["Minimal", "Timeless"] },
  p3: { name: "Tailored Cream Blazer", category: "Jacket", color: "Cream", styleTags: ["Office", "Classic"] },
  p4: { name: "Slim-Heel Shoes", category: "Shoes", color: "Black", styleTags: ["Classic"] },
};

export function localizeProduct(product: CatalogProduct, locale: Locale): CatalogProduct {
  if (locale !== "en") return product;
  return { ...product, ...englishById[product.id] };
}
