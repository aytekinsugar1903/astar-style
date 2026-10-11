import AsyncStorage from '@react-native-async-storage/async-storage';
import {parseCatalogFeed,safeCatalogUrl,type FeedResult} from './feed';
import {readImportedCatalog,commitCatalog} from './imported';
import {fetchPublicFeed,fetchWooCatalog} from './transport';
export type CatalogSource={id:string;name:string;sourceUrl:string;feedUrl:string;kind:'feed'|'woo';auto:boolean;lastChecked?:string;error?:string};
const key='weyra:catalog-sources:v1';
let writes=Promise.resolve();
function mutate(update:(old:CatalogSource[])=>CatalogSource[]){const result=writes.then(async()=>{await AsyncStorage.setItem(key,JSON.stringify(update(await readSources())));});writes=result.then(()=>{},()=>{});return result;}
export async function readSources():Promise<CatalogSource[]>{const raw=await AsyncStorage.getItem(key);const x=raw?JSON.parse(raw):[];if(!Array.isArray(x)||!x.every(s=>typeof s.id==='string'&&typeof s.name==='string'&&safeCatalogUrl(s.sourceUrl)&&safeCatalogUrl(s.feedUrl)&&['feed','woo'].includes(s.kind)))throw new Error('catalogStorageError');return x;}
export async function saveSource(source:CatalogSource){if(!safeCatalogUrl(source.sourceUrl)||!safeCatalogUrl(source.feedUrl))throw new Error('catalogSourceRequired');await mutate(old=>[...old.filter(s=>s.id!==source.id),source]);}
export async function forgetSource(id:string){await mutate(old=>old.filter(s=>s.id!==id));}
export async function previewRefresh(source:CatalogSource):Promise<FeedResult>{const raw=source.kind==='woo'?await fetchWooCatalog(source.sourceUrl):await fetchPublicFeed(source.feedUrl);const result=parseCatalogFeed(raw,source.name,source.sourceUrl);if(result.sourceId!==source.id||result.skipped||!result.products.length)throw new Error('catalogIncomplete');return result;}
let running=false;
export async function refreshConfiguredSources(){if(running)return;running=true;try{for(const source of await readSources()){if(!source.auto||source.lastChecked&&Date.now()-Date.parse(source.lastChecked)<86400000)continue;try{const result=await previewRefresh(source);if(!(await readSources()).some(s=>s.id===source.id&&s.auto&&s.feedUrl===source.feedUrl))continue;const count=(await readImportedCatalog()).filter(p=>p.sourceId===source.id).length;if(count>10&&result.products.length<count*.5)throw new Error("catalogIncomplete");await commitCatalog(result);await mutate(old=>old.map(s=>s.id===source.id?{...s,lastChecked:new Date().toISOString(),error:undefined}:s));}catch(e){await mutate(old=>old.map(s=>s.id===source.id?{...s,lastChecked:new Date().toISOString(),error:e instanceof Error?e.message:'catalogFetchError'}:s));}}}finally{running=false;}}
