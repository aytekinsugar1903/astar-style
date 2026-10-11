// Public FASHN demo adapter. Never pass personal/wardrobe photographs here.
export const photoTryOnAvailable=true;
export type PhotoType='model'|'flat-lay';
export const DEMO_HOST='https://fashn-ai-fashn-vton-1-5.hf.space';
const api=DEMO_HOST+'/gradio_api';
export function tryOnCategory(category:string){return category==='dress'?'one-pieces':['trousers','skirt'].includes(category)?'bottoms':['tshirt','shirt','knit','jacket'].includes(category)?'tops':null;}
export function trustedGarment(uri:string){if(/^\/store\/\d+-[01]\.webp$/.test(uri))return true;try{const u=new URL(uri,window.location.origin);return u.origin===window.location.origin&&u.pathname.startsWith('/assets/assets/garments/');}catch{return false;}}
async function upload(uri:string,name:string,signal:AbortSignal){const response=await fetch(uri,{signal});if(!response.ok)throw new Error('photoTryOnImageError');const blob=await response.blob();if(blob.size>8_000_000||blob.size<100)throw new Error('photoTryOnImageError');const form=new FormData();form.append('files',blob,name);const result=await fetch(api+'/upload',{method:'POST',body:form,signal});if(!result.ok)throw new Error('photoTryOnUnavailable');const paths:unknown=await result.json();if(!Array.isArray(paths)||typeof paths[0]!=='string')throw new Error('photoTryOnUnavailable');return {path:paths[0],meta:{_type:'gradio.FileData'}};}
export async function generatePhotoTryOn(input:{kind:'female'|'male';garmentUri:string;category:string;photoType:PhotoType;signal:AbortSignal;onProgress:(stage:'upload'|'queued'|'render')=>void}):Promise<string>{
 const category=tryOnCategory(input.category);if(!category)throw new Error('photoTryOnUnsupported');if(!trustedGarment(input.garmentUri))throw new Error('photoTryOnPrivate');
 const controller=new AbortController();const cancel=()=>controller.abort();input.signal.addEventListener('abort',cancel,{once:true});if(input.signal.aborted)controller.abort();const timeout=setTimeout(cancel,180000);const signal=controller.signal;
 try{input.onProgress('upload');const [person,garment]=await Promise.all([upload('/tryon/'+input.kind+'.webp','model.webp',signal),upload(input.garmentUri,'garment.jpg',signal)]);
 const response=await fetch(api+'/call/try_on',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:[person,garment,category,input.photoType,30,1.5,42,true]}),signal});if(!response.ok)throw new Error('photoTryOnUnavailable');const job:unknown=await response.json();if(!job||typeof (job as {event_id?:unknown}).event_id!=='string')throw new Error('photoTryOnUnavailable');input.onProgress('queued');
 const stream=await fetch(api+'/call/try_on/'+encodeURIComponent((job as {event_id:string}).event_id),{signal});if(!stream.ok||!stream.body)throw new Error('photoTryOnUnavailable');const reader=stream.body.getReader(),decoder=new TextDecoder();let buffer='';
 try{while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true}).replace(/\r/g,'');let end:number;while((end=buffer.indexOf('\n\n'))>=0){const message=buffer.slice(0,end);buffer=buffer.slice(end+2);const event=message.match(/^event:\s*(.+)$/m)?.[1];const payload=message.match(/^data:\s*(.+)$/m)?.[1];if(event==='heartbeat')input.onProgress('render');if(event==='error')throw new Error('photoTryOnUnavailable');if(event==='complete'&&payload){const data:unknown=JSON.parse(payload);const result=Array.isArray(data)?data[0]:null;const uri=typeof result?.url==='string'?result.url:'';if(!uri.startsWith(DEMO_HOST+'/gradio_api/file='))throw new Error('photoTryOnUnavailable');return uri;}}}}
 finally{await reader.cancel().catch(()=>{});}
 throw new Error('photoTryOnUnavailable');
 }catch(error){if(signal.aborted&&!input.signal.aborted)throw new Error('photoTryOnTimeout');throw error;}
 finally{clearTimeout(timeout);input.signal.removeEventListener('abort',cancel);}
}
