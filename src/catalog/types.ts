export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  color: string;
  styleTags: string[];
  price: number;
  currency: "TRY";
  productUrl: string;
  affiliateUrl?: string;
  commissionRate?: number;
  inStock: boolean;
  styleScore: number;
};
