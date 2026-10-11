export const photoTryOnAvailable=false;
export type PhotoType='model'|'flat-lay';
export function tryOnCategory(category:string){return category==='dress'?'one-pieces':['trousers','skirt'].includes(category)?'bottoms':['tshirt','shirt','knit','jacket'].includes(category)?'tops':null;}
export function trustedGarment(_uri:string){return false;}
export async function generatePhotoTryOn(_input:{kind:'female'|'male';garmentUri:string;category:string;photoType:PhotoType;signal:AbortSignal;onProgress:(stage:'upload'|'queued'|'render')=>void}):Promise<string>{throw new Error('photoTryOnNative');}
