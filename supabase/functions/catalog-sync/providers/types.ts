export type CatalogFeedItem = {
  externalId: string;
  name: string;
  brand?: string;
  category: string;
  colors: string[];
  imageUrl?: string;
  productUrl: string;
  styleTags: string[];
  merchant: string;
  price: number;
  currency: string;
  inStock?: boolean;
  affiliateUrl?: string;
  commissionRate?: number;
};

export interface CatalogProvider {
  readonly name: string;
  fetchProducts(): Promise<CatalogFeedItem[]>;
}
