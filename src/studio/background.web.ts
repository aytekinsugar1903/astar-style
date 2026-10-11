// U²-Net inference runs locally. Only static model/runtime assets are fetched.
type Runtime={env:{wasm:{wasmPaths:string;numThreads:number;proxy:boolean}};InferenceSession:{create:(path:string,options:unknown)=>Promise<Session>};Tensor:new(type:string,data:Float32Array,dims:number[])=>unknown};
type Session={inputNames:string[];outputNames:string[];run:(feeds:Record<string,unknown>)=>Promise<Record<string,{data:ArrayLike<number>}>>};
export const backgroundRemovalAvailable=true;
let runtimePromise:Promise<Runtime>|null=null;
function runtime(){if(!runtimePromise)runtimePromise=new Promise<Runtime>((resolve,reject)=>{const script=document.createElement('script');script.src='/image-engine/ort.wasm.min.js';script.onload=()=>{const ort=(window as unknown as {ort:Runtime}).ort;ort.env.wasm.wasmPaths='/image-engine/';ort.env.wasm.numThreads=1;ort.env.wasm.proxy=false;resolve(ort);};script.onerror=()=>{script.remove();runtimePromise=null;reject(new Error('backgroundFailed'));};document.head.appendChild(script);});return runtimePromise;}
function loadImage(uri:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('photoFailed'));img.src=uri;});}
let sessionPromise:Promise<Session>|null=null;
let running=false;
export async function removeBackground(uri:string):Promise<string>{
 if(running)throw new Error('backgroundBusy');running=true;
 try{
 const [ort,img]=await Promise.all([runtime(),loadImage(uri)]);
 if(!sessionPromise)sessionPromise=ort.InferenceSession.create('/image-engine/u2netp.onnx',{executionProviders:['wasm'],graphOptimizationLevel:'all'}).catch(e=>{sessionPromise=null;throw e;});
 const session=await sessionPromise;const size=320,total=size*size;
 const input=document.createElement('canvas');input.width=input.height=size;const ctx=input.getContext('2d')!;ctx.drawImage(img,0,0,size,size);const pixels=ctx.getImageData(0,0,size,size).data;
 let max=1;for(let i=0;i<pixels.length;i+=4)max=Math.max(max,pixels[i],pixels[i+1],pixels[i+2]);
 const data=new Float32Array(total*3),mean=[.485,.456,.406],std=[.229,.224,.225];for(let c=0;c<3;c++)for(let i=0;i<total;i++)data[c*total+i]=(pixels[i*4+c]/max-mean[c])/std[c];
 const tensor=new ort.Tensor('float32',data,[1,3,size,size]);const results=await session.run({[session.inputNames[0]]:tensor});const mask=results[session.outputNames[0]].data;let low=Infinity,high=-Infinity;for(let i=0;i<total;i++){low=Math.min(low,mask[i]);high=Math.max(high,mask[i]);}if(high-low<.001)throw new Error('backgroundFailed');
 const maskCanvas=document.createElement('canvas');maskCanvas.width=maskCanvas.height=size;const mc=maskCanvas.getContext('2d')!,alpha=mc.createImageData(size,size);let left=size,top=size,right=0,bottom=0,count=0;
 for(let i=0;i<total;i++){const v=(mask[i]-low)/(high-low);const a=Math.round(Math.max(0,Math.min(1,(v-.12)/.76))*255);alpha.data[i*4]=alpha.data[i*4+1]=alpha.data[i*4+2]=255;alpha.data[i*4+3]=a;if(v>.5){left=Math.min(left,i%size);right=Math.max(right,i%size);top=Math.min(top,Math.floor(i/size));bottom=Math.max(bottom,Math.floor(i/size));count++;}}
 if(count<total*.005)throw new Error('backgroundFailed');mc.putImageData(alpha,0,0);
 const scale=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));const full=document.createElement('canvas');full.width=Math.round(img.naturalWidth*scale);full.height=Math.round(img.naturalHeight*scale);const fc=full.getContext('2d')!;fc.drawImage(img,0,0,full.width,full.height);fc.globalCompositeOperation='destination-in';fc.drawImage(maskCanvas,0,0,full.width,full.height);
 const x=Math.max(0,left-5)/size*full.width,y=Math.max(0,top-5)/size*full.height,w=(Math.min(size,right+6)/size*full.width)-x,h=(Math.min(size,bottom+6)/size*full.height)-y;
 const out=document.createElement('canvas');const fit=500/Math.max(w,h);out.width=Math.max(1,Math.round(w*fit));out.height=Math.max(1,Math.round(h*fit));out.getContext('2d')!.drawImage(full,x,y,w,h,0,0,out.width,out.height);
 return out.toDataURL('image/png');
 }finally{running=false;}
}

// Separate disconnected foreground regions. This does not infer garment classes.
export async function separatePieces(uri:string):Promise<string[]>{
 const cleaned=await removeBackground(uri),img=await loadImage(cleaned);const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;const total=c.width*c.height,seen=new Uint8Array(total),queue=new Int32Array(total),regions:{left:number;right:number;top:number;bottom:number;count:number;indices:number[]}[]=[];
 for(let seed=0;seed<total;seed++){if(seen[seed]||pixels[seed*4+3]<128)continue;let head=0,tail=1;queue[0]=seed;seen[seed]=1;let left=c.width,right=0,top=c.height,bottom=0;const indices:number[]=[];
 while(head<tail){const at=queue[head++],x=at%c.width,y=Math.floor(at/c.width);indices.push(at);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(const neighbor of [x?at-1:-1,x<c.width-1?at+1:-1,y?at-c.width:-1,y<c.height-1?at+c.width:-1]){if(neighbor>=0&&!seen[neighbor]&&pixels[neighbor*4+3]>=128){seen[neighbor]=1;queue[tail++]=neighbor;}}}
 if(indices.length>total*.008&&(right-left)>c.width*.03&&(bottom-top)>c.height*.03)regions.push({left,right,top,bottom,count:indices.length,indices});
 }
 if(!regions.length)throw new Error('backgroundFailed');
 // Tiny detached details are excluded from split proposals. Keep the original for review.
 const largest=regions.sort((a,b)=>b.count-a.count).slice(0,10).sort((a,b)=>a.left-b.left);
 return largest.map(r=>{const x=Math.max(0,r.left-5),y=Math.max(0,r.top-5),w=Math.min(c.width,r.right+6)-x,h=Math.min(c.height,r.bottom+6)-y;const out=document.createElement('canvas');out.width=w;out.height=h;out.getContext('2d')!.drawImage(c,x,y,w,h,0,0,w,h);return out.toDataURL('image/png');});
}
