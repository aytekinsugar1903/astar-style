import ts from 'typescript';
import {mkdir,readFile,writeFile,unlink} from 'node:fs/promises';
import {DOMImplementation,XMLSerializer} from '@xmldom/xmldom';
import sharp from 'sharp';
import * as T from 'three';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const doc=new DOMImplementation().createDocument(null,'root');globalThis.document={createElementNS(ns,n){const el=doc.createElementNS(ns,n);el.style={};return el;}};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(r=>{this.result='data:application/octet-stream;base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}};
const paths=['src/studio/.mannequin-build.mjs','src/studio/.taxonomy-build.mjs'];const origin='https://weyra-phone-demo.aytekinsugar.chatgpt.site/';
try{
 for(const [source,out] of [['src/studio/taxonomy.ts',paths[1]],['src/studio/mannequin.ts',paths[0]]]){const js=ts.transpileModule(await readFile(source,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("from './taxonomy'","from './.taxonomy-build.mjs'");await writeFile(out,js);}
 const {createGarment,modelSlot,disposeModel}=await import('../'+paths[0]);const m={height:172,chest:94,waist:78,hip:98,inseam:80,thigh:54},r={shoulders:100,chest:100,waist:100,hip:100,thigh:100,calf:100};
 const products=[];await mkdir('public/catalog/weyra-3d',{recursive:true});
 for(const kind of ['female','male'])for(const category of ['tshirt','jacket','trousers','shoes',...(kind==='female'?['dress']:[])]){
 const variants=[];for(const [color,hex] of [['Mavi','#3978B0'],['Siyah','#222222']]){
 const id=kind+'-'+category+'-'+color;const garment={id,name:id,category,colors:[color],colorHex:hex,pattern:'solid',image_path:''};const group=createGarment(modelSlot(garment),garment,m,r,kind);
 const glb=await new GLTFExporter().parseAsync(group,{binary:true});await writeFile('public/catalog/weyra-3d/'+id+'.glb',Buffer.from(glb));
 const scene=new T.Scene();scene.add(group,new T.AmbientLight('#FFFFFF',1.4));const light=new T.DirectionalLight('#FFFFFF',2);light.position.set(-2,4,4);scene.add(light);const bounds=new T.Box3().setFromObject(group),centre=bounds.getCenter(new T.Vector3()),extent=bounds.getSize(new T.Vector3());const camera=new T.PerspectiveCamera(35,1,.1,20);const distance=Math.max(extent.y,extent.x)*1.9+.25;camera.position.set(centre.x+.22,centre.y+.07,centre.z+distance);camera.lookAt(centre);camera.updateMatrixWorld();scene.updateMatrixWorld(true);const renderer=new SVGRenderer();renderer.setSize(500,500);renderer.render(scene,camera);const svg=new XMLSerializer().serializeToString(renderer.domElement).replace(/<svg([^>]+)>/,'<svg$1><rect x="-250" y="-250" width="500" height="500" fill="#F5F6F8"/>');await sharp(Buffer.from(svg)).png().toFile('public/catalog/weyra-3d/'+id+'.png');
 variants.push({id,color,colorHex:hex,size:'Referans kalıp',imageUrl:origin+'catalog/weyra-3d/'+id+'.png?shape=continuous-v4',productUrl:origin+'avatar',wearable:{url:origin+'catalog/weyra-3d/'+id+'.glb',profile:'weyra-v1',kind,provenance:'weyra-template',license:'CC0-1.0'}});disposeModel(scene);
 }
 const names={tshirt:'Tişört',jacket:'Ceket',trousers:'Pantolon',dress:'Elbise',shoes:'Ayakkabı'};products.push({id:'weyra-'+kind+'-'+category,name:'WEYRA 3D kalıp · '+(kind==='female'?'Kadın':'Erkek')+' '+names[category],brand:'WEYRA',category,variants});
 }
 const data={schema:'weyra-catalog-v1',sourceName:'WEYRA 3D kalıp koleksiyonu',sourceUrl:origin,products};await writeFile('public/catalog/weyra-collection.json',JSON.stringify(data,null,2));await writeFile('src/catalog/weyra-collection.json',JSON.stringify(data));await writeFile('public/catalog/weyra-3d/LICENSE.txt','WEYRA authored reference garment meshes and their generated preview images are dedicated to the public domain under CC0 1.0. These are generic fitting templates, not copies of retailer products.\nhttps://creativecommons.org/publicdomain/zero/1.0/\n');console.log('Created',products.length,'products;',products.reduce((n,p)=>n+p.variants.length,0),'GLB/image variants');
}finally{await Promise.all(paths.map(p=>unlink(p).catch(()=>{})));}
