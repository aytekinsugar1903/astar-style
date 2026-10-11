import type {TranslationKey} from '@/i18n/translations';
export const models:Record<string,string[]>={
 trousers:['denim','linen','tailored','chino','cargo','jogger'],
 tshirt:['crew','polo','vneck','oversized','henley'],
 knit:['turtleneck','crew','vneck','cardigan'],
 skirt:['pleated','pencil','aline','mini','midi','maxi','skater'],
 dress:['mini','midi','maxi','aline','shirtDress','evening'],
 shoes:['sneaker','formal','suede','loafer','boot','sandal','heel'],
 shirt:['classic','oxford','linen','denim'],jacket:['blazer','denim','leather','puffer','bomber','sport','utility'],bag:['shoulder','backpack','clutch','tote'],accessory:['belt','scarf','hat']};
export const colors=[{id:'Siyah',hex:'#222222'},{id:'Beyaz',hex:'#FFFFFF'},{id:'Mavi',hex:'#3978B0'},{id:'Lacivert',hex:'#263554'},{id:'Kırmızı',hex:'#B93439'},{id:'Bej',hex:'#CFC3A7'},{id:'Toprak',hex:'#847761'},{id:'Kahverengi',hex:'#785540'},{id:'Gri',hex:'#989C9E'},{id:'Yeşil',hex:'#587C60'},{id:'Pembe',hex:'#D6A0B2'},{id:'Mor',hex:'#876C98'},{id:'Sarı',hex:'#D5B143'}];
export const modelKey=(id:string)=>('model_'+id) as TranslationKey;
export const colorKey=(id:string)=>('color_'+id) as TranslationKey;
export function variants<T extends {category:string;subtype?:string;colors:string[]}>(item:T,items:T[]){return items.filter(p=>p.category===item.category&&(p.subtype??'other')===(item.subtype??'other'));}
