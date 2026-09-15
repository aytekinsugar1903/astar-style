export type CatalogProduct = {
  id: string;
  dbId?: string;
  source?: string;
  imageUrl?: string;
  merchant?: string;
  name: string;
  brand: string;
  category: string;
  color: string;
  styleTags: string[];
  price: number;
  currency: string;
  productUrl: string;
  affiliateUrl?: string;
  commissionRate?: number;
  inStock: boolean;
  styleScore: number;
};
