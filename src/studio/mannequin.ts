import * as T from 'three';
import {MarchingCubes} from 'three/examples/jsm/objects/MarchingCubes.js';
import type {Garment} from './closet';
import type {BodyRegions} from './avatarShape';
import {colors} from './taxonomy';
export type ModelKind='female'|'male';
export type ModelSlot='top'|'bottom'|'shoes'|'bag'|'accessory';
export type ModelMeasures={height:number;chest:number;waist:number;hip:number;inseam:number;thigh:number};
export type ModelLook=Partial<Record<ModelSlot,Garment>>;
export function modelSlot(p:Garment):ModelSlot{return p.category==='shoes'?'shoes':p.category==='bag'?'bag':p.category==='accessory'?'accessory':['trousers','skirt','dress'].includes(p.category)?'bottom':'top';}
export function disposeModel(root:T.Object3D){const materials=new Set<T.Material>(),textures=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});for(const m of materials){for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();}for(const texture of textures)texture.dispose();}

const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
function dims(m:ModelMeasures,r:BodyRegions,kind:ModelKind){return {chest:clamp(m.chest/94*r.chest/100,.75,1.45),waist:clamp(m.waist/78*r.waist/100,.72,1.4),hip:clamp(m.hip/98*r.hip/100,.75,1.4),shoulders:clamp(m.chest/94*r.shoulders/100,.8,1.3),thigh:clamp(m.thigh/54*r.thigh/100,.7,1.4),calf:r.calf/100,male:kind==='male',leg:clamp(m.inseam/80,.8,1.2),height:clamp(m.height/172,.8,1.2)};}
type D=ReturnType<typeof dims>;
type Section=[number,number,number,number,number];
type Contour=Section[]&{continuousCurvature?:boolean;posterior?:{scale:number;depth:number}};
type Blob=[number,number,number,number,number,number]&{profile?:Contour;disabled?:boolean};
function smoothMin(a:number,b:number,k=.032){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
function ellipsoid(x:number,y:number,z:number,b:Blob){const px=x-b[0],py=y-b[1],pz=z-b[2],rx=b[3],ry=b[4],rz=b[5];const k0=Math.sqrt(px*px/(rx*rx)+py*py/(ry*ry)+pz*pz/(rz*rz));const k1=Math.sqrt(px*px/(rx**4)+py*py/(ry**4)+pz*pz/(rz**4));return k1<1e-8?-Math.min(rx,ry,rz):k0*(k0-1)/k1;}
function addMesh(group:T.Group,geo:T.BufferGeometry,material:T.Material,x=0,y=0,z=0){const mesh=new T.Mesh(geo,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
function oval(group:T.Group,mat:T.Material,x:number,y:number,z:number,rx:number,ry:number,rz:number){const mesh=addMesh(group,new T.SphereGeometry(1,32,24),mat,x,y,z);mesh.scale.set(rx,ry,rz);return mesh;}
type Ring=[number,number,number];
function fabric(p?:Garment,base='#DDD5C9'){const aliases:Record<string,string>={black:'Siyah',white:'Beyaz',blue:'Mavi',navy:'Lacivert',red:'Kırmızı',beige:'Bej',brown:'Kahverengi',grey:'Gri',gray:'Gri',green:'Yeşil',pink:'Pembe',purple:'Mor',yellow:'Sarı',cream:'Bej',ecru:'Bej',ekru:'Bej'};const colourName=p?.colors[0]??'';const color=p?.colorHex??colors.find(c=>c.id===(aliases[colourName.toLowerCase()]??colourName))?.hex??base;let map:T.CanvasTexture|undefined;if(p?.pattern&&p.pattern!=='solid'&&typeof document!=='undefined'){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=color;ctx.fillRect(0,0,256,256);ctx.fillStyle=colors.find(c=>c.id===p.colors[1])?.hex??'#F2EFE8';if(p.pattern==='striped'){for(let y=0;y<256;y+=24)ctx.fillRect(0,y,256,7);}else{for(let x=12;x<256;x+=36)for(let y=12;y<256;y+=36){ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}}map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;}
return new T.MeshStandardMaterial({color:map?'#FFFFFF':color,map:map??null,roughness:.88,metalness:0,side:T.DoubleSide});}
function fitLegs(group:T.Group,d:D){
 group.traverse(object=>{if(!(object instanceof T.Mesh))return;object.updateMatrix();object.geometry.applyMatrix4(object.matrix);object.position.set(0,0,0);object.rotation.set(0,0,0);object.scale.set(1,1,1);const a=object.geometry.getAttribute('position');for(let i=0;i<a.count;i++){const y=a.getY(i);a.setY(i,y<1.20?.06+(y-.06)*d.leg:y+1.14*(d.leg-1));}a.needsUpdate=true;const normals=object.geometry.getAttribute('normal');if(normals){for(let i=0;i<normals.count;i++){const y=a.getY(i);const v=new T.Vector3(normals.getX(i),normals.getY(i)/(y<(.06+1.14*d.leg)?d.leg:1),normals.getZ(i)).normalize();normals.setXYZ(i,v.x,v.y,v.z);}normals.needsUpdate=true;}object.geometry.computeBoundingSphere();});
 group.scale.y=d.height*2.04/(2.04+1.14*(d.leg-1));
}
function bodyBlobs(d:D):Blob[]{
 const blobs:Blob[]=[[0,1.91,0,.09,.126,.086],[0,1.756,0,.052,.085,.05],[0,1.56,0,(d.male?.205:.185)*d.chest,.15,.114],[0,1.40,0,.151*d.waist,.135,.101],[0,1.245,0,(d.male?.165:.18)*d.hip,.126,.116]];
 if(!d.male)for(const s of [-1,1])blobs.push([s*.074*d.chest,1.57,.073,.06,.057,.058]);
 for(const s of [-1,1]){const sh=.203*d.shoulders;
 blobs.push([s*sh,1.624,0,.065,.075,.067],[s*(sh+.04),1.48,0,.052,.153,.054],[s*(sh+.078),1.329,0,.038,.05,.039],[s*(sh+.091),1.197,.008,.039,.132,.04],[s*(sh+.108),1.04,.018,.034,.065,.026]);
 for(let f=0;f<4;f++)blobs.push([s*(sh+.093+f*.011),.976-(f%3)*.006,.021,.008,.044,.010]);
 blobs.push([s*(sh+.077),1.004,.031,.011,.043,.014]);
 const lx=.103*d.hip;
 blobs.push([s*lx,.993,0,.077*d.thigh,.252,.083],[s*lx,.737,.01,.046*d.thigh,.057,.052],[s*lx,.49,-.008,.053*d.calf,.215,.059],[s*lx,.241,0,.034,.085,.039],[s*lx,.115,.049,.043,.055,.103]);}
 for(const side of [-1,1]){const shoulder=.203*d.shoulders;blobs.push([side*shoulder*.48,1.615,0,shoulder*.67,.070,.078]);}
 // Continuous cross sections replace independent ellipsoid joints. Shared
 // torso profiles also serve the underwear and clothing fitting volumes.
 const torso:Contour=[
 [1.105,0,0,.098*d.hip,.075],[1.20,0,0,(d.male?.164:.178)*d.hip,.114],
 [1.40,0,0,.151*d.waist,.108],
 [1.60,0,0,(d.male?.203:.184)*d.chest,.114],[1.69,0,0,.127*d.shoulders,.080],
 [1.735,0,0,.052,.048]];
 torso.continuousCurvature=true;
 // Shape the posterior inside the continuous surface, without attaching
 // separate spheres. The broad lobes blend into the lower back and thighs.
 const posterior={scale:d.hip,depth:d.male?.044:.060};
 torso.posterior=posterior;
 for(const i of [2,3,4])blobs[i].profile=torso;
 const offset=d.male?5:7;
 for(let side=0;side<2;side++){
 const sign=side===0?-1:1,base=offset+side*15,sh=.203*d.shoulders,lx=.103*d.hip;
 const arm:Section[]=[
 [1.035,sign*(sh+.108),.018,.029,.028],[1.11,sign*(sh+.105),.014,.033,.033],
 [1.22,sign*(sh+.090),.007,.044,.043],[1.33,sign*(sh+.077),0,.044,.045],
 [1.44,sign*(sh+.051),0,.051,.054],[1.55,sign*(sh+.024),0,.057,.061],
 [1.64,sign*sh,0,.060,.064],[1.69,sign*(sh-.01),0,.033,.043]];
 blobs[base+1].profile=arm;blobs[base+2].disabled=blobs[base+3].disabled=true;
 const leg:Section[]=[
 [.18,sign*lx,.019,.034,.041],[.28,sign*lx,.001,.038*d.calf,.044],
 [.43,sign*lx,-.006,.051*d.calf,.057],[.57,sign*lx,-.004,.054*d.calf,.060],
 [.70,sign*lx,.008,.048*d.thigh,.054],[.78,sign*lx,.007,.052*d.thigh,.059],
 [.90,sign*lx,.002,.068*d.thigh,.078],[1.04,sign*lx,0,.079*d.thigh,.087],
 [1.17,sign*lx,0,.079*d.thigh,.086],[1.26,sign*lx,0,.057*d.thigh,.075]];
 (leg as Contour).posterior=posterior;
 blobs[base+10].profile=leg;for(const i of [11,12,13])blobs[base+i].disabled=true;
 }
 return blobs;
}
// Monotone cubic contours give continuous tangents through joints, without
// overshoot at the waist, calf or shoulder. Cache coefficients per volume.
const profileCurves=new WeakMap<Section[],number[][]>();
function posteriorCoordinate(x:number,y:number,z:number,scale:number,depth:number){
 const back=clamp(-z/.075,0,1),side=.082*scale,width=.085*scale;
 const lobes=Math.exp(-(((x-side)/width)**2))+Math.exp(-(((x+side)/width)**2));
 return z+depth*scale*lobes*Math.exp(-(((y-1.185)/.135)**2))*back*back*(3-2*back);
}
function profileDistance(x:number,y:number,z:number,sections:Contour){
 let curves=profileCurves.get(sections);if(!curves){
 const slope=(i:number,c:number)=>{if(i===0)return(sections[1][c]-sections[0][c])/(sections[1][0]-sections[0][0]);if(i===sections.length-1)return(sections[i][c]-sections[i-1][c])/(sections[i][0]-sections[i-1][0]);const h0=sections[i][0]-sections[i-1][0],h1=sections[i+1][0]-sections[i][0],d0=(sections[i][c]-sections[i-1][c])/h0,d1=(sections[i+1][c]-sections[i][c])/h1;if(d0*d1<=0)return 0;const w0=2*h1+h0,w1=h1+2*h0;return(w0+w1)/(w0/d0+w1/d1);};
 curves=[];
 // The torso shares continuous curvature across hips, waist and chest.
 const second:number[][]=[];
 if(sections.continuousCurvature)for(let c=1;c<=4;c++){
 const n=sections.length,diag=new Array<number>(n).fill(1),rhs=new Array<number>(n).fill(0),upper=new Array<number>(n).fill(0),lower=new Array<number>(n).fill(0);
 for(let i=1;i<n-1;i++){const h0=sections[i][0]-sections[i-1][0],h1=sections[i+1][0]-sections[i][0];lower[i]=h0;diag[i]=2*(h0+h1);upper[i]=h1;rhs[i]=6*((sections[i+1][c]-sections[i][c])/h1-(sections[i][c]-sections[i-1][c])/h0);}
 for(let i=1;i<n;i++){const q=lower[i]/diag[i-1];diag[i]-=q*upper[i-1];rhs[i]-=q*rhs[i-1];}
 const result=new Array<number>(n).fill(0);for(let i=n-1;i>=0;i--)result[i]=(rhs[i]-upper[i]*(result[i+1]??0))/diag[i];second[c]=result;
 }
 for(let i=0;i<sections.length-1;i++){const a=sections[i],b=sections[i+1],h=b[0]-a[0],coeff:number[]=[];for(let c=1;c<=4;c++){
 if(sections.continuousCurvature){const u=second[c][i],v=second[c][i+1];coeff.push(a[c],b[c]-a[c]-h*h*(2*u+v)/6,h*h*u/2,h*h*(v-u)/6);}
 else{const u=h*slope(i,c),v=h*slope(i+1,c);coeff.push(a[c],u,3*(b[c]-a[c])-2*u-v,2*(a[c]-b[c])+u+v);}
 }curves.push(coeff);}profileCurves.set(sections,curves);
 }
 const low=sections[0][0],high=sections[sections.length-1][0],yy=clamp(y,low,high);let index=sections.length-2;for(let i=1;i<sections.length;i++)if(yy<=sections[i][0]){index=i-1;break;}
 const a=sections[index],b=sections[index+1],t=clamp((yy-a[0])/(b[0]-a[0]),0,1),c=curves[index];
 const value=(offset:number)=>c[offset]+t*(c[offset+1]+t*(c[offset+2]+t*c[offset+3]));
 const cx=value(0),cz=value(4),rx=value(8),rz=value(12);
 if(sections.posterior)z=posteriorCoordinate(x,y,z,sections.posterior.scale,sections.posterior.depth);
 return Math.max((Math.hypot((x-cx)/rx,(z-cz)/rz)-1)*Math.min(rx,rz),low-y,y-high);
}
const volumeSets=new WeakMap<Blob[],Blob[]>();
function distanceToBlobs(x:number,y:number,z:number,blobs:Blob[]){let volumes=volumeSets.get(blobs);if(!volumes){const seen=new Set<Section[]>();volumes=blobs.filter(b=>{if(b.disabled)return false;if(b.profile){if(seen.has(b.profile))return false;seen.add(b.profile);}return true;});volumeSets.set(blobs,volumes);}let v=10;for(const b of volumes)v=smoothMin(v,b.profile?profileDistance(x,y,z,b.profile):ellipsoid(x,y,z,b));return v;}
function implicitMesh(group:T.Group,mat:T.Material,field:(x:number,y:number,z:number)=>number){
 const resolution=72,iso=new MarchingCubes(resolution,mat,true,false,65000);iso.isolation=0;
 let at=0;for(let z=0;z<resolution;z++)for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++)iso.field[at++]=-field((x/resolution*2-1)*.7,y/resolution*2.2,(z/resolution*2-1)*.42);
 iso.update();const count=iso.geometry.drawRange.count,geometry=new T.BufferGeometry();
 for(const id of ['position','normal','uv']){const attr=iso.geometry.getAttribute(id);if(attr)geometry.setAttribute(id,new T.Float32BufferAttribute(attr.array.slice(0,count*attr.itemSize),attr.itemSize));}
 const uv=geometry.getAttribute('uv'),positions=geometry.getAttribute('position');if(uv){for(let i=0;i<count;i++){uv.setXY(i,.5+Math.atan2(positions.getX(i),positions.getZ(i))/(Math.PI*2),(positions.getY(i)*1.1+1.1-.20)/1.5);}for(let i=0;i<count;i+=3){const us=[uv.getX(i),uv.getX(i+1),uv.getX(i+2)];if(Math.max(...us)-Math.min(...us)>.5)for(let j=0;j<3;j++)if(us[j]<.5)uv.setX(i+j,us[j]+1);}}
 geometry.applyMatrix4(new T.Matrix4().compose(new T.Vector3(0,1.1,0),new T.Quaternion(),new T.Vector3(.7,1.1,.42)));
 geometry.setDrawRange(0,count);geometry.computeBoundingSphere();iso.geometry.dispose();return addMesh(group,geometry,mat);
}
function skirtDistance(x:number,y:number,z:number,d:D,low:number){
 z=posteriorCoordinate(x,y,z,d.hip,d.male?.044:.060);
 const rings:Ring[]=[[low,.27*d.hip,.177],[1.0,.222*d.hip,.149],[1.17,.202*d.hip,.143],[1.30,.169*d.waist,.129]];
 const yy=clamp(y,low,1.30);let rx=rings[0][1],rz=rings[0][2];for(let i=1;i<rings.length;i++)if(yy<=rings[i][0]){const q=clamp((yy-rings[i-1][0])/(rings[i][0]-rings[i-1][0]),0,1);rx=T.MathUtils.lerp(rings[i-1][1],rings[i][1],q);rz=T.MathUtils.lerp(rings[i-1][2],rings[i][2],q);break;}
 return Math.max((Math.sqrt(x*x/(rx*rx)+z*z/(rz*rz))-1)*Math.min(rx,rz),low-y,y-1.30);
}
function fittedCloth(g:T.Group,mat:T.Material,p:Garment,d:D,slot:ModelSlot){
 const all=bodyBlobs(d),offset=d.male?5:7,torso=[...all.slice(2,offset),...all.slice(-2)];
 const armParts=[...all.slice(offset,offset+4),...all.slice(offset+15,offset+19)];
 const legParts=[...all.slice(offset+10,offset+14),...all.slice(offset+25,offset+29)];
 // Shoulder and sleeve volumes share the body's actual joints and taper.
 const arms=armParts;
 const margin=p.category==='jacket'?.035:p.category==='knit'?.028:.024;
 if(slot==='bottom'&&p.category!=='dress'&&p.category!=='skirt'){
 const lower=[all[3],all[4],...legParts.map(b=>{const profile=b.profile?Object.assign(b.profile.map(p=>[p[0],p[1],p[2],p[3]*1.13,p[4]*1.08] as Section),{posterior:b.profile.posterior,continuousCurvature:b.profile.continuousCurvature}):undefined;const v=Object.assign([...b],{disabled:b.disabled,profile}) as Blob;if(v[1]<1.0){v[3]*=1.13;v[5]*=1.08;}return v;})];const low=p.subtype==='shorts'?.84:.20;
 implicitMesh(g,mat,(x,y,z)=>Math.max(distanceToBlobs(x,y,z,lower)-.025,low-y,y-1.29));return;
 }
 if(p.category==='skirt'){implicitMesh(g,mat,(x,y,z)=>skirtDistance(x,y,z,d,p.subtype==='maxi'?.24:p.subtype==='mini'?.94:.72));return;}
 const sleeveLow=p.category==='tshirt'?1.47:1.09;
 implicitMesh(g,mat,(x,y,z)=>{
 let value=Math.max(distanceToBlobs(x,y,z,torso)-(margin+.021*clamp((1.43-y)/.23,0,1)),1.195-y,y-1.715);
 if(p.category!=='dress')value=smoothMin(value,Math.max(distanceToBlobs(x,y,z,arms)-Math.min(margin,.020),sleeveLow-y,y-1.715),.025);
 if(p.category==='dress')value=smoothMin(value,skirtDistance(x,y,z,d,p.subtype==='maxi'?.25:p.subtype==='mini'?.94:.72),.035);
 // Open neckline: subtraction avoids a floating collar and covered neck.
 const neck=Math.sqrt(x*x/(.067*.067)+z*z/(.060*.060))-1;
 return Math.max(value,-Math.max(neck*.06,1.63-y));
 });
}
export function createBody(m:ModelMeasures,r:BodyRegions,kind:ModelKind){const d=dims(m,r,kind),group=new T.Group();group.name='mannequin-body';
 const skin=new T.MeshStandardMaterial({color:'#BCAFA0',roughness:.57,metalness:.02});
 const blobs=bodyBlobs(d);
 const body=implicitMesh(group,skin,(x,y,z)=>distanceToBlobs(x,y,z,blobs));
 const underwear=fabric(undefined,'#C9C0B4');
 // Follow the skin's actual surface. Feather the base-layer edge into it
 // instead of creating a raised horizontal cap at the hips and chest.
 const baseLayer=(low:number,high:number,slot:ModelSlot)=>{
 const src=body.geometry,positions=src.getAttribute('position'),normals=src.getAttribute('normal'),uv=src.getAttribute('uv'),p:number[]=[],n:number[]=[],u:number[]=[];
 for(let i=0;i<positions.count;i+=3){const y=(positions.getY(i)+positions.getY(i+1)+positions.getY(i+2))/3;if(y<low||y>high)continue;
 if(slot==='top'&&Math.abs((positions.getX(i)+positions.getX(i+1)+positions.getX(i+2))/3)>.19*d.chest)continue;
 for(let j=0;j<3;j++){const at=i+j,yy=positions.getY(at),t=clamp(Math.min(yy-low,high-yy)/.025,0,1),offset=.003*t*t*(3-2*t);p.push(positions.getX(at)+normals.getX(at)*offset,yy+normals.getY(at)*offset,positions.getZ(at)+normals.getZ(at)*offset);n.push(normals.getX(at),normals.getY(at),normals.getZ(at));if(uv)u.push(uv.getX(at),uv.getY(at));}
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(n,3));if(uv)geo.setAttribute('uv',new T.Float32BufferAttribute(u,2));
 const layer=addMesh(group,geo,underwear);layer.userData.underwearSlot=slot;
 };
 underwear.polygonOffset=true;underwear.polygonOffsetFactor=-1;underwear.polygonOffsetUnits=-1;
 baseLayer(1.065,1.29,'bottom');if(!d.male)baseLayer(1.49,1.705,'top');
 fitLegs(group,d);return group;
}
export function createGarment(slot:ModelSlot,p:Garment,m:ModelMeasures,r:BodyRegions,kind:ModelKind){const d=dims(m,r,kind),g=new T.Group();g.name='worn-'+slot;g.userData.garmentId=p.id;const mat=fabric(p);const col=new T.Color(mat.color);const trim=new T.MeshStandardMaterial({color:col.clone().multiplyScalar(.6),roughness:.8,side:T.DoubleSide});
 if(slot==='top'||slot==='bottom'){
 fittedCloth(g,mat,p,d,slot);
 if(p.category==='shirt'||p.category==='jacket'||p.subtype==='polo'){
 // Lapels and buttons follow the fitted front rather than a fixed depth.
 const blobs=bodyBlobs(d);
 if(p.category==='jacket'||p.category==='shirt'){for(const side of [-1,1]){const shape=new T.Shape();shape.moveTo(side*.024,1.69);shape.lineTo(side*.10,1.62);shape.lineTo(side*.05,1.49);shape.lineTo(side*.012,1.62);shape.closePath();const geo=new T.ShapeGeometry(shape);const positions=geo.getAttribute('position');for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i);let z=.03;while(distanceToBlobs(x,y,z,blobs)<.044&&z<.30)z+=.002;positions.setZ(i,z+.008);}geo.computeVertexNormals();addMesh(g,geo,trim);}}
 for(let i=0;i<5;i++){const y=1.60-i*.077;let z=.11;while(distanceToBlobs(0,y,z,blobs)<.039&&z<.30)z+=.002;oval(g,trim,0,y,z+.004,.005,.005,.003);}
 }
 }else if(slot==='shoes'){
 for(const s of [-1,1]){const x=s*.103*d.hip;oval(g,mat,x,.119,.055,.054,.062,.116);oval(g,trim,x,.075,.060,.056,.018,.119);for(let i=0;i<3;i++){const lace=addMesh(g,new T.BoxGeometry(.063,.004,.007),new T.MeshStandardMaterial({color:'#EFEDE7'}),x,.176,.03+i*.017);lace.rotation.x=-.22;}}
 }else if(slot==='bag'){
 const x=Math.max(.203*d.shoulders+.108,.103*d.hip+.077*d.thigh+.095);const mesh=addMesh(g,new T.BoxGeometry(.16,.18,.065,3,3,3),mat,x,.92,.035);mesh.geometry.computeVertexNormals();const handle=addMesh(g,new T.TorusGeometry(.048,.006,8,32,Math.PI),trim,x,1.018,.036);
 handle.scale.y=1.4;
 }else{
 const blobs=bodyBlobs(d),points:T.Vector3[]=[];
 for(const [x,y,front] of [[-.045,1.735,0],[-.070,1.69,1],[-.050,1.63,1],[0,1.585,1],[.050,1.63,1],[.070,1.69,1],[.045,1.735,0]] as const){let z=front?.06:-.018;if(front)while(distanceToBlobs(x,y,z,blobs)<.048&&z<.30)z+=.002;points.push(new T.Vector3(x,y,z));}
 addMesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points),64,.0035,8,false),mat);const pendant=points[3];oval(g,trim,pendant.x,pendant.y-.012,pendant.z+.004,.015,.020,.005);

 }
 fitLegs(g,d);return g;
}

// Contract: garment-only static mesh, metres, Y-up, origin on the floor,
// already fitted to the default posed WEYRA mannequin. This is retargeting,
// not reconstruction of a product photograph or physical cloth simulation.
export function retargetWearable(root:T.Group,m:ModelMeasures,r:BodyRegions,kind:ModelKind){
 const d=dims(m,r,kind),blobs=bodyBlobs(d),result=new T.Group();root.updateMatrixWorld(true);let total=0;
 root.traverse(o=>{if(o instanceof T.SkinnedMesh)throw new Error('unsupportedRig');if(!(o instanceof T.Mesh))return;const geometry=o.geometry.clone();geometry.applyMatrix4(o.matrixWorld);const a=geometry.getAttribute('position');total+=a.count;if(total>200000)throw new Error('tooManyVertices');const normals=geometry.getAttribute('normal');
 for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);if(!Number.isFinite(x+y+z)||Math.abs(x)>.8||y<-.02||y>2.25||Math.abs(z)>.7)throw new Error('wrongProfile');
 let scale=1;if(y>=1.20){scale=y>1.54?d.chest:y>1.36?T.MathUtils.lerp(d.waist,d.chest,(y-1.36)/.18):T.MathUtils.lerp(d.hip,d.waist,(y-1.20)/.16);if(Math.abs(x)>.20&&y>1.09)x+=Math.sign(x)*.203*(d.shoulders-1);else x*=scale;}
 else{scale=y>.72?d.thigh:d.calf;const centre=Math.sign(x)*.103; if(Math.abs(x)>.045)x=Math.sign(x)*.103*d.hip+(x-centre)*scale;else x*=d.hip;}
 // Push penetrating vertices outward along the body's distance gradient.
 for(let n=0;n<6;n++){const distance=distanceToBlobs(x,y,z,blobs);if(distance>=.014)break;const e=.002,gx=distanceToBlobs(x+e,y,z,blobs)-distanceToBlobs(x-e,y,z,blobs),gy=distanceToBlobs(x,y+e,z,blobs)-distanceToBlobs(x,y-e,z,blobs),gz=distanceToBlobs(x,y,z+e,blobs)-distanceToBlobs(x,y,z-e,blobs),length=Math.hypot(gx,gy,gz)||1;const step=Math.min(.05,.016-distance);x+=gx/length*step;y+=gy/length*step;z+=gz/length*step;}
 a.setXYZ(i,x,y,z);if(normals){const v=new T.Vector3(normals.getX(i)/scale,normals.getY(i),normals.getZ(i)).normalize();normals.setXYZ(i,v.x,v.y,v.z);}}
 a.needsUpdate=true;if(normals)normals.needsUpdate=true;geometry.computeBoundingSphere();const mesh=addMesh(result,geometry,o.material);mesh.name=o.name;
 });if(!total)throw new Error('emptyWearable');fitLegs(result,d);return result;
}
