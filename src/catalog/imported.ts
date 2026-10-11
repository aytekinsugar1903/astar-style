import {Platform} from 'react-native';
import {useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {parseCatalogFeed,type ImportedProduct,type FeedResult,type CatalogVariant} from './feed';
import seed from './weyra-collection.json';
import openStore from './open-store.json';
import type {CatalogProduct} from './types';
import type {Garment} from '../studio/closet';
const key='weyra:merchant-catalog:v1',listeners=new Set<()=>void>();
export const notifyCatalog=()=>listeners.forEach(fn=>fn());
let writes=Promise.resolve();
function mutate(update:(old:ImportedProduct[])=>ImportedProduct[]){const result=writes.then(async()=>{const next=update(await readSavedCatalog());await AsyncStorage.setItem(key,JSON.stringify(next));listeners.forEach(fn=>fn());});writes=result.then(()=>{},()=>{});return result;}
export async function readSavedCatalog():Promise<ImportedProduct[]>{const raw=await AsyncStorage.getItem(key);if(!raw)return parseCatalogFeed(JSON.stringify(seed),seed.sourceName,seed.sourceUrl).products;const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('catalogStorageError');return parsed.filter(p=>p&&typeof p.id==='string'&&Array.isArray(p.variants)&&p.variants.length);}
export async function readImportedCatalog():Promise<ImportedProduct[]>{const saved=await readSavedCatalog();return [...openStore.map(p=>({...p,variants:p.variants.map(v=>({...v,imageUrl:Platform.OS==='web'?v.imageUrl:p.imageSources[0],images:Platform.OS==='web'?v.images:p.imageSources}))})) as ImportedProduct[],...saved.filter(p=>p.sourceId!=='livostyle-open')];}
export async function commitCatalog(result:FeedResult){if(!result.products.length||result.skipped)throw new Error('catalogIncomplete');await mutate(old=>[...old.filter(p=>p.sourceId!==result.sourceId),...result.products]);}
export async function removeCatalog(sourceId:string){await mutate(old=>old.filter(p=>p.sourceId!==sourceId));}
export function useImportedCatalog(){const [products,setProducts]=useState<ImportedProduct[]>([]),[error,setError]=useState(''),[ready,setReady]=useState(false);useEffect(()=>{let active=true;const refresh=()=>{void readImportedCatalog().then(p=>{if(active){setProducts(p);setError('');}}).catch(()=>active&&setError('catalogStorageError')).finally(()=>active&&setReady(true));};listeners.add(refresh);refresh();return()=>{active=false;listeners.delete(refresh);};},[]);return{products,error,ready};}
export function catalogProduct(p:ImportedProduct):CatalogProduct{const v=p.variants.find(v=>v.inStock)??p.variants[0];return{id:p.id,source:'imported',merchant:p.sourceName,brand:p.brand,name:p.name,category:p.category,color:v.color,imageUrl:v.imageUrl,price:v.price??0,priceKnown:v.price!==undefined,currency:v.currency,inStock:v.inStock===true,stockKnown:v.inStock!==undefined,productUrl:v.productUrl,styleTags:[],styleScore:72,styleScoreKnown:false,variants:p.variants,originalCategory:p.category,categoryKey:p.categoryKey};}
export function variantGarment(p:ImportedProduct,v:CatalogVariant):Garment{return{photoType:p.photoType,material:p.material,fit:p.fit,care:p.care,license:p.license,credit:p.credit,creditUrl:p.creditUrl,price:v.price,currency:v.currency,id:v.id,name:[p.name,v.color,v.size].filter(Boolean).join(' · '),brand:p.brand,category:p.categoryKey,subtype:p.subtype,pattern:p.pattern??'solid',colors:[v.color||''],colorHex:v.colorHex,image_path:'',imageUrl:v.imageUrl,wearable:v.wearable,merchant:p.sourceName,productUrl:v.productUrl};}
