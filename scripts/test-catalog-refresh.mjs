import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFile,writeFile,unlink} from 'node:fs/promises';
const dir='src/catalog/',names=['sources','feed','imported','transport','storage'];const paths=names.map(n=>dir+'.refresh-'+n+'.mjs');
try{
await writeFile(paths[4],`export const data=new Map();export default {async getItem(k){return data.get(k)??null;},async setItem(k,v){data.set(k,v);}};`);
await writeFile(dir+'.refresh-platform.mjs','export const Platform={OS:"web"};');
paths.push(dir+'.refresh-platform.mjs');
for(const name of names.slice(0,4)){let code=ts.transpileModule(await readFile(dir+name+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replaceAll("from '@react-native-async-storage/async-storage'","from './.refresh-storage.mjs'").replaceAll("from 'react-native'","from './.refresh-platform.mjs'").replace("import seed from './weyra-collection.json';","const seed={sourceName:'seed',sourceUrl:'https://seed.example/',products:[]};").replace("import openStore from './open-store.json';","const openStore=[];");for(const dependency of names)code=code.replaceAll("from './"+dependency+"'","from './.refresh-"+dependency+".mjs'");await writeFile(dir+'.refresh-'+name+'.mjs',code);}
const source=await import('../'+paths[0]),feed=await import('../'+paths[1]),catalog=await import('../'+paths[2]),{data}=await import('../'+paths[4]);
const products=n=>Array.from({length:n},(_,i)=>({id:String(i),name:'Shoe '+i,brand:'Test',category:'shoes',imageUrl:'https://shop.example/shoe.jpg',productUrl:'https://shop.example/item/'+i}));
const url='https://shop.example/',id=feed.sourceIdentifier(url);const config={id,name:'Test',sourceUrl:url,feedUrl:url+'feed.json',kind:'feed',auto:true};
const initial=feed.parseCatalogFeed(JSON.stringify(products(20)),'Test',url);await catalog.commitCatalog(initial);await source.saveSource(config);
let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify(products(2)),{status:200});};await source.refreshConfiguredSources();assert.equal((await catalog.readImportedCatalog()).length,20,'shrinking feed must preserve the last catalog');assert.equal((await source.readSources())[0].error,'catalogIncomplete');await source.refreshConfiguredSources();assert.equal(calls,1,'daily cadence enforced after failure');
await source.saveSource({...config,lastChecked:undefined});globalThis.fetch=async()=>new Response(JSON.stringify(products(21)),{status:200});await source.refreshConfiguredSources();assert.equal((await catalog.readImportedCatalog()).length,21);assert.equal((await source.readSources())[0].error,undefined);
await source.saveSource({...config,lastChecked:undefined});globalThis.fetch=async()=>{await source.forgetSource(id);return new Response(JSON.stringify(products(25)),{status:200});};await source.refreshConfiguredSources();assert.equal((await catalog.readImportedCatalog()).length,21,'removed connection cannot update the catalog');assert.deepEqual(await source.readSources(),[]);
await Promise.all([catalog.commitCatalog(feed.parseCatalogFeed(JSON.stringify(products(1)),'A','https://a.example/')),catalog.commitCatalog(feed.parseCatalogFeed(JSON.stringify(products(1)),'B','https://b.example/'))]);assert.equal((await catalog.readImportedCatalog()).length,23,'concurrent imports preserve both sources');
console.log('PASS: daily refresh cadence, destructive-feed protection, successful refresh, removed connections, concurrent source imports');
}finally{await Promise.all(paths.map(p=>unlink(p).catch(()=>{})));}
