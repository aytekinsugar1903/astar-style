import {useAppStyles,useTheme} from '@/studio/theme';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translations";
import {useCloset,picture,type Garment} from '@/studio/closet';
import {combinationAt,combinationStats} from '@/studio/outfits';
import {useImportedCatalog,variantGarment} from '@/catalog/imported';
import type { OutfitSuggestion } from "@/ai/types";
import { OUTFIT_TEMPLATE_COUNT } from "@/outfits/templates";
import { track } from "@/analytics/track";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { functionErrorKey } from "@/lib/function-error";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDaily,changeDaily} from '@/daily/store';
import {itemWears} from '@/daily/logic';
const occasionKeys:TranslationKey[]=["occasionWedding","occasionInterview","occasionDinner","occasionHoliday","occasionDaily","occasionFirstDate","occasionParty","occasionGraduation"];
export default function OutfitScreen(){const s=useAppStyles(baseStyles);

 const {items:garments,ready}=useCloset();const imported=useImportedCatalog();const {state:daily}=useDaily();const [audience,setAudience]=useState("unisex");const [preferredColors,setPreferredColors]=useState<string[]>([]);useEffect(()=>{void AsyncStorage.getItem("weyra:style-profile:v1").then(raw=>{if(raw){const profile=JSON.parse(raw);if(["women","men","unisex"].includes(profile.audience))setAudience(profile.audience);if(Array.isArray(profile.preferredColors))setPreferredColors(profile.preferredColors);}}).catch(()=>{});},[]);const router=useRouter();const {session}=useAuth();const {locale,t}=useI18n();
 const [occasion,setOccasion]=useState(t("occasionWedding"));const [budget,setBudget]=useState("3000");
 const [temperature,setTemperature]=useState("20");const [surface,setSurface]=useState<"indoor"|"grass"|"cobblestone"|"sand">("indoor");
 const [timeOfDay,setTimeOfDay]=useState<"day"|"evening">("evening");const [excludedCount,setExcludedCount]=useState(0);
 const [results,setResults]=useState<OutfitSuggestion[]>([]);const [templateCount,setTemplateCount]=useState(OUTFIT_TEMPLATE_COUNT);
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [generation,setGeneration]=useState(0);const [page,setPage]=useState(0);
 const pool=useMemo(()=>{const seen=new Set<string>();const list:Garment[]=[];for(const garment of [...garments,...imported.products.flatMap(product=>product.variants.map(variant=>variantGarment(product,variant)))]){if(seen.has(garment.id))continue;seen.add(garment.id);list.push(garment);}return list;},[garments,imported.products]);
 const comboContext=useMemo(()=>({index:0,generation:0,temperature:Number(temperature)||20,surface,occasion,audience,preferredColors,feedback:daily.feedback,wearCounts:Object.fromEntries(pool.map(p=>[p.id,itemWears(daily,p.id)]))}),[pool,temperature,surface,occasion,audience,preferredColors,daily]);
 const stats=ready&&imported.ready?combinationStats(pool,comboContext):null;
 const seeProducts=(item:OutfitSuggestion)=>{const missing=item.missingPieces[0];router.push({pathname:"/products",params:{query:missing?.query??"",budget:String(missing?.maxPrice??(Number(budget)||""))}});};
 const feedback=async(item:OutfitSuggestion,value:number)=>{try{await changeDaily(v=>({...v,feedback:{...v.feedback,...Object.fromEntries(item.wardrobeItemIds.map(id=>[id,value]))}}));setMessage(t("dailyFeedbackSaved"));}catch{setMessage(t("dailyStorageError"));}};
 const tryOutfit=(item:OutfitSuggestion)=>{const id=item.wardrobeItemIds[0];if(id){router.push({pathname:"/try-on",params:{wardrobeItemId:id}});return;}router.push("/try-on");};
 async function create(){
  setBusy(true);setMessage("");let ids=["demo-dress","demo-jacket","demo-shoes","demo-bag"];
  if(isSupabaseConfigured&&session){
   const {data,error}=await supabase.from("wardrobe_items").select("id").limit(80);if(error){setMessage(error.message);setBusy(false);return;}ids=(data??[]).map(item=>item.id);
   const next=generation+1;setGeneration(next);
   const response=await supabase.functions.invoke("outfit",{body:{occasion,budget:Number(budget)||0,locale,variationSeed:next,temperatureC:Number(temperature)||20,surface,timeOfDay}});
   if(response.error){setMessage(t(await functionErrorKey(response.error,"outfit")));setBusy(false);return;}
   const suggestions=response.data.suggestions??[response.data.suggestion];setResults(suggestions);setTemplateCount(response.data.templateCount??OUTFIT_TEMPLATE_COUNT);setExcludedCount(response.data.excluded?.length??0);
   void track("outfit_created",{wardrobe_item_count:ids.length,suggestion_count:suggestions.length});setBusy(false);return;
  }
  showPage(0);setGeneration(value=>value+1);setBusy(false);
 }
 function showPage(atPage:number){
  const labels=locale==='en'?['Minimal','Classic','Casual','Romantic','Street','Bold']:['Minimal','Klasik','Rahat','Romantik','Sokak','Cesur'];const word=locale==='en'?'option':'seçenek';const built:OutfitSuggestion[]=[];
  for(let i=0;i<6;i++){const at=atPage*6+i;const selected=combinationAt(pool,comboContext,at);if(!selected.length)break;const has=(categories:string[])=>selected.some(p=>categories.includes(p.category));const missing=has(['dress'])?has(['shoes'])?[]:[t('studioCopy6')]:[...(!has(['tshirt','shirt','knit'])?[t('avatarTop')]:[]),...(!has(['trousers','skirt'])?[t('avatarBottom')]:[]),...(!has(['shoes'])?[t('studioCopy6')]:[])];const style=labels[at%labels.length];built.push({title:occasion?`${occasion} · ${style} ${word} ${at+1}`:`${style} ${locale==='en'?'look':'kombin'}`,explanation:t('outfitLocalExplanation'),wardrobeItemIds:selected.map(p=>p.id),missingPieces:missing.map(query=>({query,reason:t('dailyEmpty')}))});}
  setPage(atPage);setResults(built);setExcludedCount(combinationStats(pool,comboContext).excluded);
 }
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
  <Pressable onPress={()=>router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
  <Text style={s.kicker}>{t("outfitKicker")}</Text><Text style={s.title}>{t("outfitQuestion")}</Text>
  {isSupabaseConfigured?<Text style={s.scale}>{t("outfitEngineScale",{count:templateCount})}</Text>:!!stats&&<Text testID="outfit-combination-count" style={s.scale}>{t("outfitCombinationScale",{count:stats.total})}</Text>}
  <Text style={s.label}>{t("eventPresets")}</Text><View style={s.chips}>{occasionKeys.map(key=>{const label=t(key),on=occasion===label;return <Pressable key={key} style={[s.chip,on&&s.chipSelected]} onPress={()=>setOccasion(label)} accessibilityRole="button"><Text style={[s.chipText,on&&s.chipTextSelected]}>{label}</Text></Pressable>;})}</View>
  <Text style={s.label}>{t("occasion")}</Text><TextInput style={s.input} value={occasion} onChangeText={setOccasion} placeholder={t("occasionPlaceholder")} accessibilityLabel={t("occasion")}/>
  <Text style={s.label}>{t("weatherAndSetting")}</Text>
  <View style={s.contextRow}><View style={s.contextField}><Text style={s.smallLabel}>{t("temperatureC")}</Text><TextInput style={s.input} value={temperature} onChangeText={setTemperature} keyboardType="numeric" accessibilityLabel={t("temperatureC")}/></View>
  <View style={s.contextField}><Text style={s.smallLabel}>{t("timeOfDay")}</Text><View style={s.miniRow}>{(["day","evening"] as const).map(value=><Pressable key={value} style={[s.mini,value===timeOfDay&&s.miniOn]} onPress={()=>setTimeOfDay(value)}><Text style={[s.miniText,value===timeOfDay&&s.miniTextOn]}>{t(value==="day"?"day":"evening")}</Text></Pressable>)}</View></View></View>
  <Text style={s.smallLabel}>{t("surface")}</Text><View style={s.chips}>{(["indoor","grass","cobblestone","sand"] as const).map(value=><Pressable key={value} style={[s.chip,value===surface&&s.chipSelected]} onPress={()=>setSurface(value)}><Text style={[s.chipText,value===surface&&s.chipTextSelected]}>{t(value==="indoor"?"surfaceIndoor":value==="grass"?"surfaceGrass":value==="cobblestone"?"surfaceCobblestone":"surfaceSand")}</Text></Pressable>)}</View>
  <Text style={s.label}>{t("totalBudget")}</Text><TextInput style={s.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="3000" accessibilityLabel={t("totalBudget")}/>
  <Pressable style={[s.button,busy&&s.disabled]} onPress={create} disabled={busy} accessibilityRole="button"><Text style={s.buttonText}>{busy?t("wardrobeAnalyzing"):t("prepareOutfits")}</Text></Pressable>
  {!!message&&<Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
  {excludedCount>0&&<Text style={s.ruleNotice}>{t("ruleFiltered",{count:excludedCount})}</Text>}
  {!!results.length&&<Text style={s.resultsTitle}>{t("outfitResults",{count:results.length})}</Text>}
  {!isSupabaseConfigured&&!!results.length&&<View style={s.chips}>{page>0&&<Pressable accessibilityRole="button" style={s.chip} onPress={()=>showPage(page-1)}><Text style={s.chipText}>{t("outfitPrev")}</Text></Pressable>}{(page+1)*6<(stats?.total??0)&&<Pressable accessibilityRole="button" style={s.chip} onPress={()=>showPage(page+1)}><Text style={s.chipText}>{t("outfitNext")}</Text></Pressable>}</View>}
  {!isSupabaseConfigured&&!!results.length&&<Text style={s.note}>{t('outfitPhotosNotice')}</Text>}
  {results.map((item,index)=><View key={item.title+index} style={s.result}>
    <Text style={s.resultKicker}>{t("outfitOption",{count:index+1})}</Text><Text style={s.resultTitle}>{item.title}</Text><Text style={s.resultCopy}>{item.explanation}</Text><View style={s.chips}><Pressable accessibilityRole="button" style={s.chip} onPress={()=>void feedback(item,1)}><Text style={s.chipText}>{t("dailyLike")}</Text></Pressable><Pressable accessibilityRole="button" style={s.chip} onPress={()=>void feedback(item,-1)}><Text style={s.chipText}>{t("dailyDislike")}</Text></Pressable></View>
    {!isSupabaseConfigured&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:15}}>{item.wardrobeItemIds.map(id=>{const p=pool.find(g=>g.id===id);return p?<View key={id} style={{width:120,backgroundColor:'#FAFBF9',padding:8,borderRadius:12}}><Image accessibilityLabel={p.name} source={picture(p)} style={{width:104,height:135}} resizeMode="contain"/><Text style={{fontSize:12,color:'#17231F',marginTop:8}} numberOfLines={2}>{p.name}</Text><Text style={{fontSize:10,color:'#6C746F',marginTop:4}}>{t(p.id.startsWith('local-')?'yourPiece':'samplePiece')}</Text></View>:null;})}</View>}
    <Text style={s.line}>{t("wardrobePiecesUsed",{count:item.wardrobeItemIds.length})}</Text>
    <Text style={s.missing}>{item.missingPieces.length?t("missingPiecesLabel",{pieces:item.missingPieces.map(piece=>piece.query).join(" · ")}):t("outfitComplete")}</Text>
    <Pressable style={s.secondary} onPress={()=>seeProducts(item)} accessibilityRole="button"><Text style={s.secondaryText}>{t("seeMissingPieces")}</Text></Pressable>
    {!isSupabaseConfigured&&<Pressable style={s.secondary} accessibilityRole="button" onPress={()=>router.push({pathname:'/board',params:{pieces:item.wardrobeItemIds.join(','),title:item.title}})}><Text style={s.secondaryText}>{t('outfitBoardAction')}</Text></Pressable>}
    <Pressable style={s.try} onPress={()=>tryOutfit(item)} accessibilityRole="button"><Text style={s.tryText}>{t("virtualTryOnAction")}</Text></Pressable>
  </View>)}
  <Pressable style={s.history} onPress={()=>router.push(isSupabaseConfigured?"/outfits":"/planner")} accessibilityRole="button"><Text style={s.historyText}>{t("viewOutfitHistory")}</Text></Pressable>
  <Text style={s.note}>{t("mockAiNotice")}</Text>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:680,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:30},title:{fontSize:40,fontWeight:"600",color:"#171713",marginTop:12},scale:{color:"#6E2D3A",fontWeight:"700",lineHeight:20,marginTop:10},label:{fontWeight:"700",marginTop:22,marginBottom:8},
 chips:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{borderWidth:1,borderColor:"#D4C9BA",borderRadius:999,paddingVertical:9,paddingHorizontal:13,backgroundColor:"#FFF"},chipSelected:{backgroundColor:"#6E2D3A",borderColor:"#6E2D3A"},chipText:{color:"#4B4740",fontWeight:"700",fontSize:13},chipTextSelected:{color:"#FFF"},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#DCD3C5",borderRadius:14,padding:15,fontSize:16},button:{backgroundColor:"#171713",borderRadius:999,padding:17,alignItems:"center",marginTop:24},buttonText:{color:"#FFF",fontWeight:"800"},disabled:{opacity:.5},message:{color:"#6E2D3A",marginTop:14},resultsTitle:{fontSize:20,fontWeight:"800",color:"#171713",marginTop:28},
 contextRow:{flexDirection:"row",gap:12},contextField:{flex:1},smallLabel:{fontSize:12,fontWeight:"700",color:"#635E56",marginTop:10,marginBottom:7},miniRow:{flexDirection:"row",gap:6},mini:{flex:1,backgroundColor:"#FFF",borderWidth:1,borderColor:"#DCD3C5",borderRadius:12,paddingVertical:15,alignItems:"center"},miniOn:{backgroundColor:"#171713"},miniText:{fontSize:12,fontWeight:"700",color:"#4B4740"},miniTextOn:{color:"#FFF"},ruleNotice:{color:"#6E2D3A",fontWeight:"700",marginTop:14},
 result:{backgroundColor:"#6E2D3A",borderRadius:26,padding:24,marginTop:14},resultKicker:{color:"#DCC7CA",fontSize:10,fontWeight:"800",letterSpacing:1.6},resultTitle:{color:"#FFF",fontSize:25,fontWeight:"600",marginTop:12},resultCopy:{color:"#F1E6E8",lineHeight:21,marginTop:10},line:{color:"#FFF",fontWeight:"700",marginTop:18},missing:{color:"#F1E6E8",lineHeight:19,marginTop:8},secondary:{backgroundColor:"#FFF",borderRadius:999,padding:14,alignItems:"center",marginTop:20},secondaryText:{color:"#171713",fontWeight:"800"},try:{padding:14,alignItems:"center"},tryText:{color:"#FFF",fontWeight:"800"},history:{borderWidth:1,borderColor:"#6E2D3A",borderRadius:999,padding:14,alignItems:"center",marginTop:20},historyText:{color:"#6E2D3A",fontWeight:"800"},note:{fontSize:11,color:"#777168",textAlign:"center",lineHeight:17,marginTop:22},
});


const baseStyles=s;
