import ts from 'typescript';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import * as T from 'three';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const paths=['src/studio/.mannequin-test.mjs','src/studio/.taxonomy-test.mjs'];
try{
 for(const [source,out] of [['src/studio/taxonomy.ts',paths[1]],['src/studio/mannequin.ts',paths[0]]]){
 const text=await readFile(source,'utf8');const js=ts.transpileModule(text,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("from './taxonomy'","from './.taxonomy-test.mjs'");await writeFile(out,js);
 }
 const {createBody,createGarment,disposeModel,modelSlot}=await import('../'+paths[0]);
 const m={height:172,chest:94,waist:78,hip:98,inseam:80,thigh:54};const r={shoulders:100,chest:100,waist:100,hip:100,thigh:100,calf:100};
 for(const kind of ['female','male']){
 const body=createBody(m,r,kind);const surface=body.children[0];assert.ok(surface.geometry.drawRange.count>10000);assert.ok(surface.geometry.drawRange.count<65000*3);
 const a=surface.geometry.getAttribute('position');for(let i=0;i<surface.geometry.drawRange.count;i++)assert.ok(Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)));
 body.updateMatrixWorld(true);
 // Posterior volume must be present in the actual mesh, with both sides
 // blending into the hips; adding it must not enlarge the abdomen.
 for(const x of [-.082,.082])for(const y of [1.15,1.185,1.22]){const hit=new T.Raycaster(new T.Vector3(x,y,-1),new T.Vector3(0,0,1)).intersectObject(surface)[0];assert.ok(hit&&hit.point.z<(kind==='female'?-.145:-.13),`${kind}: flat posterior at ${x}/${y}`);}
 const abdomen=new T.Raycaster(new T.Vector3(0,1.20,1),new T.Vector3(0,0,-1)).intersectObject(surface)[0];assert.ok(abdomen&&abdomen.point.z<.14,`${kind}: posterior shaping enlarged the abdomen`);
 // Regression for the visible 'beaded knee': inspect the actual mesh, not its input volumes.
 for(const x of [-.103,.103])for(const y of [.69,.70,.72,.75,.78]){const front=new T.Raycaster(new T.Vector3(x,y,1),new T.Vector3(0,0,-1)).intersectObject(surface)[0];const back=new T.Raycaster(new T.Vector3(x,y,-1),new T.Vector3(0,0,1)).intersectObject(surface)[0];assert.ok(front&&back,`${kind}: disconnected knee surface`);assert.ok(front.point.z-back.point.z>.095,`${kind}: pinched knee contour at ${y}`);}
 const bounds=new T.Box3().setFromObject(body);assert.ok(bounds.max.y>2&&bounds.max.y<2.2);assert.ok(bounds.min.y>=0);disposeModel(body);
 for(const category of ['tshirt','jacket','trousers','skirt','dress','shoes','bag','accessory']){
 const p={id:category,name:category,category,colors:['Mavi'],pattern:'solid',image_path:''};const g=createGarment(modelSlot(p),p,m,r,kind);assert.ok(g.children.length);g.traverse(mesh=>{if(mesh instanceof T.Mesh){const a=mesh.geometry.getAttribute('position');for(let i=0;i<a.count;i++)assert.ok(Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)));}});disposeModel(g);
 }
 }
 const profiles=[
 {label:'small',m:{height:155,chest:76,waist:60,hip:82,inseam:66,thigh:42},r:{shoulders:85,chest:85,waist:85,hip:85,thigh:85,calf:85}},
 {label:'default',m,r},
 {label:'large',m:{height:198,chest:138,waist:125,hip:148,inseam:100,thigh:82},r:{shoulders:130,chest:135,waist:130,hip:135,thigh:130,calf:135}}
 ];let checked=0;
 for(const kind of ['female','male'])for(const profile of profiles){
 const body=createBody(profile.m,profile.r,kind);body.updateMatrixWorld(true);
 for(const category of ['tshirt','jacket','trousers','dress','skirt']){
 const p={id:category,name:category,category,colors:['Mavi'],pattern:'solid',image_path:''};const cloth=createGarment(modelSlot(p),p,profile.m,profile.r,kind);cloth.updateMatrixWorld(true);
 const points=category==='skirt'?[[0,1.22],[.1,1.15],[-.1,1.15]]:category==='trousers'?[[.1,.4],[.1,.65],[.1,.85],[0,1.22]]:[[0,1.28],[0,1.43],[0,1.56],[.065,1.56],[-.065,1.56]];
 const leg=Math.max(.8,Math.min(1.2,profile.m.inseam/80)),height=Math.max(.8,Math.min(1.2,profile.m.height/172));
 for(const [x,y0] of points){const y=(y0<1.20?.06+(y0-.06)*leg:y0+1.14*(leg-1))*height*2.04/(2.04+1.14*(leg-1));
 for(const side of [-1,1]){const ray=new T.Raycaster(new T.Vector3(x,y,side*1),new T.Vector3(0,0,-side));const skinHit=ray.intersectObject(body.children[0])[0];if(!skinHit)continue;const clothHit=ray.intersectObject(cloth,true)[0];assert.ok(clothHit,`${kind}/${profile.label}/${category}: uncovered sample`);assert.ok(clothHit.distance<skinHit.distance-.005,`${kind}/${profile.label}/${category}: skin penetrates garment at ${x}/${y0}`);checked++;}
 }
 disposeModel(cloth);
 }disposeModel(body);
 }
 console.log(`PASS: female/male surfaces, 8 categories, 3 size profiles, ${checked} front/back garment-clearance samples`);
}finally{await Promise.all(paths.map(p=>unlink(p).catch(()=>{})));}
