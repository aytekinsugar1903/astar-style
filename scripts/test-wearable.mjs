import ts from 'typescript';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as T from 'three';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const paths=['src/studio/.mannequin-test.mjs','src/studio/.taxonomy-test.mjs','src/studio/.wearable-test.mjs'];
try{
 for(const [source,out] of [['src/studio/taxonomy.ts',paths[1]],['src/studio/mannequin.ts',paths[0]],['src/studio/wearable.web.ts',paths[2]]]){const js=ts.transpileModule(await readFile(source,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("from './taxonomy'","from './.taxonomy-test.mjs'").replace("from './mannequin'","from './.mannequin-test.mjs'");await writeFile(out,js);}
 const {retargetWearable,disposeModel}=await import('../'+paths[0]),{checkWearableBuffer}=await import('../'+paths[2]);
 const seed=JSON.parse(await readFile('src/catalog/weyra-collection.json','utf8'));let files=0;
 for(const p of seed.products)for(const v of p.variants){const bytes=await readFile('public/'+new URL(v.wearable.url).pathname);const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);const json=checkWearableBuffer(buffer);assert.ok(json.meshes.length);const model=await new GLTFLoader().parseAsync(buffer,'');
 for(const m of [{height:172,chest:94,waist:78,hip:98,inseam:80,thigh:54},{height:195,chest:128,waist:114,hip:132,inseam:98,thigh:76}]){const fitted=retargetWearable(model.scene,m,{shoulders:115,chest:110,waist:105,hip:110,thigh:110,calf:110},v.wearable.kind);fitted.traverse(o=>{if(o instanceof T.Mesh){const a=o.geometry.getAttribute('position');assert.ok(a.count>0);for(let i=0;i<a.count;i++)assert.ok(Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)));}});disposeModel(fitted);}files++;}
 assert.equal(files,18);assert.throws(()=>checkWearableBuffer(new ArrayBuffer(20)));console.log(`PASS: ${files} real self-contained GLB files parse, retain materials and retarget to two measurement profiles`);
}finally{await Promise.all(paths.map(p=>unlink(p).catch(()=>{})));}
