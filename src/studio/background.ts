// Expo Go has no ONNX WebAssembly runtime. Manual cropping remains available.
export const backgroundRemovalAvailable=false;
export async function removeBackground(_uri:string):Promise<string>{throw new Error('backgroundUnavailable');}
export async function separatePieces(_uri:string):Promise<string[]>{throw new Error('backgroundUnavailable');}
