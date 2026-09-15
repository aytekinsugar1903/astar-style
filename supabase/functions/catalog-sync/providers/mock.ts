import type { CatalogProvider } from "./types.ts";

export const mockCatalogProvider: CatalogProvider = {
  name: "mock",
  async fetchProducts() {
    return [
      { externalId: "p1", name: "Saten Midi Elbise", brand: "Demo Atelier", category: "Elbise", colors: ["Bordo"], productUrl: "https://example.com", styleTags: ["Klasik", "Romantik"], merchant: "Demo Mağaza", price: 2499, currency: "TRY", inStock: true },
      { externalId: "p2", name: "Dökümlü Siyah Elbise", brand: "Demo Studio", category: "Elbise", colors: ["Siyah"], productUrl: "https://example.com", styleTags: ["Minimal", "Zamansız"], merchant: "Demo Mağaza", price: 1890, currency: "TRY", inStock: true },
      { externalId: "p3", name: "Krem Kesim Blazer", brand: "Demo Form", category: "Ceket", colors: ["Krem"], productUrl: "https://example.com", styleTags: ["Ofis", "Klasik"], merchant: "Demo Mağaza", price: 2790, currency: "TRY", inStock: true },
      { externalId: "p4", name: "İnce Topuklu Ayakkabı", brand: "Demo Line", category: "Ayakkabı", colors: ["Siyah"], productUrl: "https://example.com", styleTags: ["Klasik"], merchant: "Demo Mağaza", price: 1299, currency: "TRY", inStock: false },
    ];
  },
};
