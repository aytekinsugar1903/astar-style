export type BodyRegions={calf:number;thigh:number;hip:number;waist:number;chest:number;shoulders:number};
export const defaultRegions:BodyRegions={calf:100,thigh:100,hip:100,waist:100,chest:100,shoulders:100};
export const regionIds=(Object.keys(defaultRegions) as (keyof BodyRegions)[]);
export function regionValue(value:unknown,fallback=100){return typeof value==='number'&&Number.isFinite(value)?Math.max(70,Math.min(140,value)):fallback;}
export function restoreRegions(saved:{regions?:Partial<BodyRegions>;torso?:number;legs?:number}):BodyRegions{return Object.fromEntries(regionIds.map(id=>[id,regionValue(saved.regions?.[id],regionValue(['calf','thigh','hip'].includes(id)?saved.legs:saved.torso))])) as BodyRegions;}
