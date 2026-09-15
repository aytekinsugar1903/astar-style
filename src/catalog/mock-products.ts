import type { CatalogProduct } from "./types";

export const mockProducts: CatalogProduct[] = [
  { id:"p1", name:"Saten Midi Elbise", brand:"Demo Atelier", category:"Elbise", color:"Bordo", styleTags:["Klasik","Romantik"], price:2499, currency:"TRY", productUrl:"https://example.com", inStock:true, styleScore:96 },
  { id:"p2", name:"Dökümlü Siyah Elbise", brand:"Demo Studio", category:"Elbise", color:"Siyah", styleTags:["Minimal","Zamansız"], price:1890, currency:"TRY", productUrl:"https://example.com", inStock:true, styleScore:91 },
  { id:"p3", name:"Krem Kesim Blazer", brand:"Demo Form", category:"Ceket", color:"Krem", styleTags:["Ofis","Klasik"], price:2790, currency:"TRY", productUrl:"https://example.com", inStock:true, styleScore:88 },
  { id:"p4", name:"İnce Topuklu Ayakkabı", brand:"Demo Line", category:"Ayakkabı", color:"Siyah", styleTags:["Klasik"], price:1299, currency:"TRY", productUrl:"https://example.com", inStock:false, styleScore:84 },
];
