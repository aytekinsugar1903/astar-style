import type {Garment} from './closet';
type Context={index:number;generation:number;temperature:number;surface:string;occasion?:string;preferredColors?:string[];feedback?:Record<string,number>;wearCounts?:Record<string,number>;audience?:string};
export function suggestPieces(items:Garment[],context:Context){
 const formal=/düğün|wedding|mülakat|interview|mezuniyet|graduation/i.test(context.occasion??'');
 const allowed=items.filter(p=>!(context.temperature>27&&p.category==='knit')&&!(['grass','cobblestone','sand'].includes(context.surface)&&p.category==='shoes'&&p.subtype==='heel')&&context.feedback?.[p.id]!==-1&&!(context.audience==='men'&&['dress','skirt'].includes(p.category))&&!( /düğün|wedding/i.test(context.occasion??'')&&p.category==='dress'&&p.colors.some(c=>/beyaz|white/i.test(c)))&&!(formal&&['shorts','sneaker'].includes(p.subtype??'')));
 const pick=(categories:string[],offset=0)=>{const matches=allowed.filter(p=>categories.includes(p.category));const own=matches.filter(p=>p.id.startsWith('local-'));const options=own.length?own:matches;const score=(p:Garment)=>Number(context.feedback?.[p.id]===1)*4+Number(p.colors.some(c=>context.preferredColors?.includes(c)))*2-Math.min(3,(context.wearCounts?.[p.id]??0)*.15);const ranked=[...options].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));if(!ranked.length)return undefined;const pool=ranked.filter(p=>score(p)>=score(ranked[0])-1);return pool[(context.index+context.generation+offset)%Math.max(1,pool.length)];};
 const dress=context.index%2===0?pick(['dress']):undefined;
 const chosen=dress?[dress]:[pick(formal?['shirt','knit']:['tshirt','shirt','knit']),pick(['trousers','skirt'])];chosen.push(pick(['shoes'],2));
 if(context.temperature<18)chosen.push(pick(['jacket'],3));chosen.push(pick(['bag'],4));
 return {items:chosen.filter((p):p is Garment=>!!p),excluded:items.length-allowed.length};
}
function eligible(items:Garment[],context:Context){
 const formal=/düğün|wedding|mülakat|interview|mezuniyet|graduation/i.test(context.occasion??'');
 const seen=new Set<string>();
 return items.filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return !(context.temperature>27&&p.category==='knit')&&!(['grass','cobblestone','sand'].includes(context.surface)&&p.category==='shoes'&&p.subtype==='heel')&&context.feedback?.[p.id]!==-1&&!(context.audience==='men'&&['dress','skirt'].includes(p.category))&&!(/düğün|wedding/i.test(context.occasion??'')&&p.category==='dress'&&p.colors.some(c=>/beyaz|white/i.test(c)))&&!(formal&&['shorts','sneaker'].includes(p.subtype??''));});
}
function ranked(items:Garment[],categories:string[],context:Context){
 const score=(p:Garment)=>Number(context.feedback?.[p.id]===1)*4+Number(p.colors.some(c=>context.preferredColors?.includes(c)))*2-Math.min(3,(context.wearCounts?.[p.id]??0)*.15)+(p.id.startsWith('local-')?2:p.id.startsWith('photo-')?1:0);
 return items.filter(p=>categories.includes(p.category)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
}
export function combinationStats(items:Garment[],context:Context){
 const allowed=eligible(items,context);
 const tops=ranked(allowed,['tshirt','shirt','knit'],context),bottoms=ranked(allowed,['trousers','skirt'],context),shoes=ranked(allowed,['shoes'],context),jackets=ranked(allowed,['jacket'],context),bags=ranked(allowed,['bag'],context),dresses=ranked(allowed,['dress'],context);
 const shoeN=Math.max(1,shoes.length),jacketN=jackets.length+1,bagN=Math.max(1,bags.length);
 const separates=tops.length&&bottoms.length?tops.length*bottoms.length*shoeN*jacketN*bagN:0;
 const dressLooks=dresses.length?dresses.length*shoeN*jacketN*bagN:0;
 return {tops,bottoms,shoes,jackets,bags,dresses,separates,dressLooks,total:separates+dressLooks,excluded:items.length-allowed.length};
}
export function combinationCount(items:Garment[],context:Context){return combinationStats(items,context).total;}
export function combinationAt(items:Garment[],context:Context,at:number){
 const space=combinationStats(items,context);if(at<0||at>=space.total)return [];
 const shoeN=Math.max(1,space.shoes.length),jacketN=space.jackets.length+1,bagN=Math.max(1,space.bags.length);
 if(at<space.separates){
  let n=at;const bagI=n%bagN;n=Math.floor(n/bagN);const jacketI=n%jacketN;n=Math.floor(n/jacketN);const shoeI=n%shoeN;n=Math.floor(n/shoeN);const bottomI=n%space.bottoms.length;n=Math.floor(n/space.bottoms.length);const topI=n%space.tops.length;
  const chosen=[space.tops[topI],space.bottoms[bottomI]];if(space.shoes.length)chosen.push(space.shoes[shoeI]);if(jacketI>0)chosen.push(space.jackets[jacketI-1]);if(space.bags.length)chosen.push(space.bags[bagI]);return chosen;
 }
 let n=at-space.separates;const bagI=n%bagN;n=Math.floor(n/bagN);const jacketI=n%jacketN;n=Math.floor(n/jacketN);const shoeI=n%shoeN;n=Math.floor(n/shoeN);const dressI=n%space.dresses.length;
 const chosen=[space.dresses[dressI]];if(space.shoes.length)chosen.push(space.shoes[shoeI]);if(jacketI>0)chosen.push(space.jackets[jacketI-1]);if(space.bags.length)chosen.push(space.bags[bagI]);return chosen;
}
