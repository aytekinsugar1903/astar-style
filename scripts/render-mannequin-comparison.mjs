import ts from 'typescript';
import {readFile,writeFile,unlink,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {DOMImplementation,XMLSerializer} from '@xmldom/xmldom';
import sharp from 'sharp';
import * as T from 'three';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
const doc=new DOMImplementation().createDocument(null,'root');globalThis.document={createElementNS(ns,n){const el=doc.createElementNS(ns,n);el.style={};return el;}};
const paths=['src/studio/.taxonomy-render.mjs','src/studio/.mannequin-before-render.mjs','src/studio/.mannequin-after-render.mjs'];
try{
 const before=execFileSync('git',['show',(process.argv[2]??'9ab1fe5da8315bca02fc1dc6cab9cfea32448688')+':source/src/studio/mannequin.ts'],{encoding:'utf8'});
 for(const [source,out] of [[await readFile('src/studio/taxonomy.ts','utf8'),paths[0]],[before,paths[1]],[await readFile('src/studio/mannequin.ts','utf8'),paths[2]]])await writeFile(out,ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("from './taxonomy'","from './.taxonomy-render.mjs'"));
 const measurements={height:172,chest:94,waist:78,hip:98,inseam:80,thigh:54},regions={shoulders:100,chest:100,waist:100,hip:100,thigh:100,calf:100};
 const panels=[];
 for(const path of paths.slice(1)){
 const {createBody,disposeModel}=await import('../'+path);const scene=new T.Scene(),body=createBody(measurements,regions,'female');scene.add(body,new T.AmbientLight('#FFFFFF',1.3));const light=new T.DirectionalLight('#FFFFFF',1.8);light.position.set(-2,3,process.argv[3]==="rear"?-4:4);scene.add(light);
 const camera=new T.PerspectiveCamera(33,600/800,.1,20);camera.position.set(...(process.argv[3]==="rear"?[2.7,1.1,-3.0]:[.25,1.1,4.0]));camera.lookAt(0,1.04,0);camera.updateMatrixWorld();scene.updateMatrixWorld(true);
 const renderer=new SVGRenderer();renderer.setSize(600,800);renderer.setPrecision(4);renderer.render(scene,camera);const svg=new XMLSerializer().serializeToString(renderer.domElement).replace(/<svg([^>]+)>/,'<svg$1><rect x="-300" y="-400" width="600" height="800" fill="#26323C"/>');panels.push(await sharp(Buffer.from(svg)).png().toBuffer());disposeModel(scene);
 }
 await mkdir('docs/qa',{recursive:true});await sharp({create:{width:1200,height:800,channels:4,background:'#26323C'}}).composite([{input:panels[0],left:0,top:0},{input:panels[1],left:600,top:0}]).png().toFile('docs/qa/smooth-body-comparison.png');console.log('Rendered real geometry: left previous, right current. CPU projection, not a WebGL/device screenshot.');
}finally{await Promise.all(paths.map(p=>unlink(p).catch(()=>{})));}
