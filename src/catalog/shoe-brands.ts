export const shoeBrands = [
 {name:'Nike',url:'https://www.nike.com/tr/'},
 {name:'adidas',url:'https://www.adidas.com.tr/tr/ayakkabi'},
 {name:'PUMA',url:'https://tr.puma.com/'},
 {name:'Skechers',url:'https://www.skechers.com.tr/'},
 {name:'Converse',url:'https://www.converse.com.tr/'},
 {name:'Vans',url:'https://www.vans.com.tr/ayakkabi'},
 {name:'ASICS',url:'https://www.asics.com.tr/'},
 {name:'Lumberjack',url:'https://www.flo.com.tr/ayakkabi?marka=lumberjack',retailer:'FLO'},
 {name:'Kinetix',url:'https://www.flo.com.tr/marka/kinetix',retailer:'FLO'},
] as const;
// Exact normalized brand identity, never substring matching (Nike != Nike-inspired).
export function brandKey(value:string){return value.trim().normalize('NFKC').toLocaleLowerCase('en-US').replace(/\s+/g,' ');}
export function isShoe(product:{category:string;categoryKey?:string}){return product.categoryKey==='shoes'||['shoes','ayakkabı','ayakkabi'].includes(brandKey(product.category));}
