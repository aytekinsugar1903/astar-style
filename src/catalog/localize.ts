import type { Locale } from "@/i18n/translations";
import { demoProductDefinitions } from "./demo-products";
import type { CatalogProduct } from "./types";
export function localizeProduct(product: CatalogProduct, locale: Locale): CatalogProduct {
  if (locale !== "en") return product;
  const item=demoProductDefinitions.find((value)=>value.id===product.id);
  return item ? {...product,name:item.enName,category:item.enCategory,color:item.enColor,styleTags:item.enTags} : product;
}
export function localizeFacet(value:string,locale:Locale){
  if(locale!=="en") return value;
  if(value==="Tümü") return "All";
  for(const item of demoProductDefinitions){
    if(item.trCategory===value)return item.enCategory;
    if(item.trColor===value)return item.enColor;
    const index=item.trTags.indexOf(value);
    if(index>=0)return item.enTags[index]??value;
  }
  return value;
}
