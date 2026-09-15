import type { CatalogProduct } from "./types";
import { demoProductDefinitions } from "./demo-products";
export const mockProducts: CatalogProduct[] = demoProductDefinitions.map((item) => ({
  id:item.id, source:"demo", audience:item.audience, name:item.trName, brand:item.brand,
  category:item.trCategory, color:item.trColor, styleTags:item.trTags, price:item.price,
  currency:"TRY", productUrl:"https://example.com", inStock:item.inStock, styleScore:item.styleScore,
}));
