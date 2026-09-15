export const AUDIENCES = ["women", "men", "unisex"] as const;
export const OCCASIONS = ["wedding", "interview", "dinner", "holiday", "everyday", "date", "party", "graduation"] as const;
export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export const STYLES = ["minimal", "classic", "casual", "romantic", "street", "office", "bold", "timeless"] as const;
export const TEMPLATE_COUNT = AUDIENCES.length * OCCASIONS.length * SEASONS.length * STYLES.length;
export type Audience = typeof AUDIENCES[number];
export function currentSeason() {
  const month = new Date().getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}
export function orderedStyles(preferred:string[],seed:number){
  const normalized=preferred.map((value)=>value.toLocaleLowerCase("tr-TR"));
  const aliases:Record<string,string>={minimal:"minimal",klasik:"classic",classic:"classic",rahat:"casual",casual:"casual",romantik:"romantic",romantic:"romantic",sokak:"street",street:"street",ofis:"office",office:"office",cesur:"bold",bold:"bold","zamansız":"timeless",timeless:"timeless"};
  const preferredKeys=normalized.map((value)=>aliases[value]).filter((value):value is string=>Boolean(value));
  const all=[...new Set([...preferredKeys,...STYLES])];
  const offset=Math.abs(seed)%all.length;
  return [...all.slice(offset),...all.slice(0,offset)].slice(0,6);
}
export function styleLabel(style:string,english:boolean){
  const labels:Record<string,[string,string]>={minimal:["Minimal","Minimal"],classic:["Klasik","Classic"],casual:["Rahat","Casual"],romantic:["Romantik","Romantic"],street:["Sokak","Street"],office:["Ofis","Office"],bold:["Cesur","Bold"],timeless:["Zamansız","Timeless"]};
  return labels[style]?.[english?1:0]??style;
}
export function seasonLabel(season:string,english:boolean){
  const labels:Record<string,[string,string]>={spring:["İlkbahar","Spring"],summer:["Yaz","Summer"],autumn:["Sonbahar","Autumn"],winter:["Kış","Winter"]};
  return labels[season]?.[english?1:0]??season;
}

export function audienceLabel(audience:Audience,english:boolean){
  const labels:Record<Audience,[string,string]>={women:["Kadın","Women"],men:["Erkek","Men"],unisex:["Karma","Unisex"]};
  return labels[audience][english?1:0];
}
