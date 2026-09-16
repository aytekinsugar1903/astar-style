export type Context={occasion:string;temperatureC?:number;surface?:"indoor"|"grass"|"cobblestone"|"sand";timeOfDay?:"day"|"evening"};
export type RuleItem={id:string;name:string|null;category:string;colors:string[]|null;style_tags:string[]|null;seasons:string[]|null};
const text=(item:RuleItem)=>[item.name,item.category,...(item.colors??[]),...(item.style_tags??[]),...(item.seasons??[])].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
export function filterEligible(items:RuleItem[],context:Context){
 const excluded:Array<{id:string;reasons:string[]}>=[];const occasion=context.occasion.toLocaleLowerCase("tr-TR");
 const eligible=items.filter(item=>{const value=text(item),reasons:string[]=[];
  if((occasion.includes("düğün")||occasion.includes("wedding"))&&item.category==="dress"&&/beyaz|white/.test(value))reasons.push("wedding_white_dress");
  if(context.surface==="grass"&&/ince topuk|stiletto|thin heel/.test(value))reasons.push("grass_thin_heels");
  if(context.surface==="sand"&&/topuk|heel|stiletto/.test(value))reasons.push("sand_heels");
  if(typeof context.temperatureC==="number"&&context.temperatureC>=27&&/kış|winter|yün|wool/.test(value))reasons.push("too_warm");
  if(typeof context.temperatureC==="number"&&context.temperatureC<=10&&/yaz|summer|sandalet|sandal/.test(value))reasons.push("too_cold");
  if(reasons.length)excluded.push({id:item.id,reasons});return reasons.length===0;
 });
 return{eligible,excluded};
}
