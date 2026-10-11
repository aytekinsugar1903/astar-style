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
