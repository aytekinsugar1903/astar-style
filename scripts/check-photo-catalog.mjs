import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
function loadData(path){const mod={exports:{}};const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(code,{exports:mod.exports,require:id=>id.startsWith('../../assets/')?resolve(dirname(path),id):{}},{filename:path});return mod.exports;}
const {sampleGarments}=loadData(resolve('src/studio/closet.ts'));
const {models,colors}=loadData(resolve('src/studio/taxonomy.ts'));
const hashes=new Set(),sources=new Set(),ids=new Set(),counts={};
for(const p of sampleGarments){
 assert(!ids.has(p.id),`Duplicate garment ID: ${p.id}`);ids.add(p.id);
 assert(p.credit&&p.creditUrl&&p.license,`Missing attribution: ${p.id}`);
 assert(p.creditUrl.startsWith('https://commons.wikimedia.org/wiki/File:'),`Missing primary source: ${p.id}`);
 assert(!sources.has(p.creditUrl),`Repeated source photograph: ${p.id}`);sources.add(p.creditUrl);
 assert(models[p.category]?.includes(p.subtype),`Invalid model: ${p.id}`);
 assert(p.colors.length>0&&p.colors.every(c=>colors.some(v=>v.id===c)),`Invalid colour metadata: ${p.id}`);
 assert(!/\b(?:NC|ND)\b/.test(p.license),`Unsupported sample-photo license: ${p.id}`);
 const bytes=readFileSync(p.source);assert(bytes.length>1000,`Empty asset: ${p.id}`);
 const hash=createHash('sha256').update(bytes).digest('hex');assert(!hashes.has(hash),`Repeated photo bytes: ${p.id}`);hashes.add(hash);
 counts[p.category]=(counts[p.category]??0)+1;
}
for(const cat of Object.keys(models))assert(counts[cat]>=6,`${cat} requires at least 6 different photos; got ${counts[cat]??0}`);
console.log(`${sampleGarments.length} distinct source photographs, attribution and category minimums verified: ${JSON.stringify(counts)}`);
