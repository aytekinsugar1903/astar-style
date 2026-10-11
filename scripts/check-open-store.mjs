import assert from 'node:assert/strict';import {readFile,stat} from 'node:fs/promises';
const products=JSON.parse(await readFile('src/catalog/open-store.json','utf8')),ids=new Set(),variants=new Set(),counts={};
assert.equal(products.length,104);
for(const p of products){assert(!ids.has(p.id));ids.add(p.id);counts[p.categoryKey]=(counts[p.categoryKey]??0)+1;assert.equal(p.license,'MIT');assert.equal(p.credit,'Arcada LLC / Livostyle');assert.equal(new Set(p.variants.map(v=>v.color)).size,1);assert(p.material!==undefined&&p.fit!==undefined);for(const v of p.variants){assert(!variants.has(v.id));variants.add(v.id);assert.equal(v.currency,'USD');assert(Number.isFinite(v.price)&&v.price>=0);assert(/^\/store\/\d+-[01]\.webp$/.test(v.imageUrl));for(const image of v.images)assert((await stat('public'+image)).size>1000);}assert(p.imageSources.every(u=>new URL(u).hostname==='cdn.shopify.com'));}
assert((await readFile('public/store/LICENSE.txt','utf8')).includes('Copyright (c) 2026 Arcada LLC'));
console.log('PASS',products.length,'store products,',variants.size,'variants, original image files, colour integrity and MIT notice',counts);
