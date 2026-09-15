import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";
import { TEMPLATE_COUNT, audienceLabel, currentSeason, orderedStyles, seasonLabel, styleLabel, type Audience } from "./templates.ts";

type WardrobeItem={id:string;name:string|null;category:string;colors:string[]|null;style_tags:string[]|null;seasons:string[]|null};
const group=(category:string)=>({shirt:"top",tshirt:"top",jacket:"outer",trousers:"bottom",skirt:"bottom",dress:"dress",shoes:"shoes",bag:"bag",accessory:"accessory"}[category]??"other");
const overlap=(values:string[]|null,preferences:string[])=>{const wanted=new Set(preferences.map(v=>v.toLocaleLowerCase("tr-TR")));return (values??[]).filter(v=>wanted.has(v.toLocaleLowerCase("tr-TR"))).length;};
function choose(items:WardrobeItem[],style:string,offset:number){
  const ranked=[...items].sort((a,b)=>{
    const score=(item:WardrobeItem)=>overlap(item.style_tags,[style])*8+overlap(item.colors,[])*2;
    return score(b)-score(a);
  });
  const rotated=[...ranked.slice(offset%Math.max(1,ranked.length)),...ranked.slice(0,offset%Math.max(1,ranked.length))];
  const picked:WardrobeItem[]=[];const groups=new Set<string>();
  for(const item of rotated){const key=group(item.category);if(!groups.has(key)){picked.push(item);groups.add(key);}if(picked.length===4)break;}
  for(const item of rotated){if(picked.length===4)break;if(!picked.some(x=>x.id===item.id))picked.push(item);}
  return picked;
}
function missing(items:WardrobeItem[],audience:Audience,style:string,english:boolean,budget:number){
  const groups=new Set(items.map(item=>group(item.category)));
  const base=groups.has("dress")&&audience!=="men"?["shoes"]:["top","bottom","shoes"];
  if((style==="classic"||style==="office")&&!groups.has("outer"))base.push("outer");
  if((style==="bold"||style==="romantic")&&!groups.has("accessory"))base.push("accessory");
  const needed=[...new Set(base.filter(key=>!groups.has(key)))];
  const labels:Record<string,[string,string]>={top:["Gömlek","Shirt"],bottom:["Pantolon","Trousers"],shoes:["Ayakkabı","Shoes"],outer:["Ceket","Jacket"],accessory:["Aksesuar","Accessory"]};
  const maxPrice=budget&&needed.length?Math.floor(budget/needed.length):undefined;
  return needed.map(key=>({query:labels[key]?.[english?1:0]??key,maxPrice}));
}
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  try{
    const {user,admin}=clients(req);const {data:auth}=await user.auth.getUser();
    if(!auth.user)return json({error:"UNAUTHORIZED"},401);
    const body=await req.json();const english=body.locale==="en";const fallback=english?"Everyday":"Günlük";
    const occasion=String(body.occasion??fallback).trim().slice(0,80)||fallback;
    const budget=Math.max(0,Math.min(1_000_000,Number(body.budget??0)));
    const seed=Math.abs(Math.trunc(Number(body.variationSeed??0)));
    const [{data:wardrobe,error:wardrobeError},{data:profile,error:profileError},{data:favorites,error:favoritesError}]=await Promise.all([
      user.from("wardrobe_items").select("id,name,category,colors,style_tags,seasons").limit(80),
      user.from("style_profiles").select("preferred_colors,style_tags,body_preferences").maybeSingle(),
      user.from("outfits").select("occasion").eq("is_favorite",true).order("created_at",{ascending:false}).limit(20),
    ]);
    if(wardrobeError)throw wardrobeError;if(profileError)throw profileError;if(favoritesError)throw favoritesError;
    const startedAt=Date.now();const reservation=await reserveUsage(admin,auth.user.id,usageLimits.outfit);
    if(!reservation.allowed)return json(limitPayload(reservation),429);
    const created:string[]=[];
    try{
      const preferences=profile?.body_preferences;
      const audience:Audience=preferences&&typeof preferences==="object"&&!Array.isArray(preferences)&&(preferences.audience==="women"||preferences.audience==="men")?preferences.audience:"unisex";
      const preferredColors=profile?.preferred_colors??[];const preferredTags=profile?.style_tags??[];
      const baseRanked=([...(wardrobe??[])] as WardrobeItem[]).sort((a,b)=>(overlap(b.colors,preferredColors)*3+overlap(b.style_tags,preferredTags)*5)-(overlap(a.colors,preferredColors)*3+overlap(a.style_tags,preferredTags)*5));
      const season=currentSeason();const styles=orderedStyles(preferredTags,seed);
      const learned=(favorites??[]).some(item=>item.occasion?.toLocaleLowerCase()===occasion.toLocaleLowerCase());
      const suggestions=[];
      for(let index=0;index<styles.length;index++){
        const style=styles[index];const selected=choose(baseRanked,style,seed+index*3);
        const title=english?`${occasion} · ${styleLabel(style,true)} option ${index+1}`:`${occasion} · ${styleLabel(style,false)} seçenek ${index+1}`;
        const explanation=english
          ?`${audienceLabel(audience,true)} collection · ${seasonLabel(season,true)}-ready ${styleLabel(style,true).toLocaleLowerCase()} styling, balanced with your colors and wardrobe.${learned?" Your liked outfits also influenced this option.":""}`
          :`${audienceLabel(audience,false)} koleksiyonu · ${seasonLabel(season,false)} için ${styleLabel(style,false).toLocaleLowerCase()} çizgide; renklerin ve gardırobun dengelenerek hazırlandı.${learned?" Beğendiğin kombinler de bu seçeneği etkiledi.":""}`;
        const {data:saved,error}=await user.from("outfits").insert({user_id:auth.user.id,title,occasion,explanation}).select("id").single();
        if(error)throw error;created.push(saved.id);
        if(selected.length){const {error:itemError}=await user.from("outfit_items").insert(selected.map(item=>({outfit_id:saved.id,wardrobe_item_id:item.id})));if(itemError)throw itemError;}
        suggestions.push({outfitId:saved.id,templateId:`${audience}:${season}:${style}:${index}`,title,explanation,wardrobeItemIds:selected.map(item=>item.id),missingPieces:missing(selected,audience,style,english,budget)});
      }
      await finishUsage(admin,reservation.event_id!,startedAt,true);
      return json({provider:"mock",estimatedCostUsd:0,templateCount:TEMPLATE_COUNT,suggestions,suggestion:suggestions[0]});
    }catch(error){for(const id of created)await user.from("outfits").delete().eq("id",id);if(reservation.event_id)await finishUsage(admin,reservation.event_id,startedAt,false);throw error;}
  }catch(error){console.error("outfit_failed",error);return json({error:"INTERNAL_ERROR"},500);}
});
