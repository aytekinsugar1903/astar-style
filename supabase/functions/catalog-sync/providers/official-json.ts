import type { CatalogFeedItem, CatalogProvider } from "./types.ts";

export function createOfficialJsonProvider(input: { url: string; token?: string; sourceName: string }): CatalogProvider {
  const url = new URL(input.url);
  if (url.protocol !== "https:") throw new Error("CATALOG_FEED_MUST_USE_HTTPS");
  const sourceName = input.sourceName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 60);
  if (!sourceName) throw new Error("INVALID_CATALOG_SOURCE");

  return {
    name: sourceName,
    async fetchProducts() {
      const response = await fetch(url, {
        headers: { Accept: "application/json", ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}) },
      });
      if (!response.ok) throw new Error(`CATALOG_FEED_HTTP_${response.status}`);
      const size = Number(response.headers.get("content-length") ?? 0);
      if (size > 5_000_000) throw new Error("CATALOG_FEED_TOO_LARGE");
      const payload = await response.json();
      const rows = Array.isArray(payload) ? payload : payload?.products;
      if (!Array.isArray(rows)) throw new Error("INVALID_CATALOG_FEED");
      return rows as CatalogFeedItem[];
    },
  };
}

