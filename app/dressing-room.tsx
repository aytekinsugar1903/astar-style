import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AvatarConfig } from "@/avatar/config";

type Item={id:string;name:string|null;category:string;image_path:string;cutout_image_path:string|null;imageUrl?:string};
const layer:Record<string,number>={tshirt:10,shirt:12,trousers:20,skirt:22,dress:25,jacket:30,shoes:40,bag:50,accessory:60};
const placement:Record<string,{top:number;height:number}>={tshirt:{top:78,height:115},shirt:{top:76,height:125},jacket:{top:70,height:150},dress:{top:76,height:230},trousers:{top:168,height:185},skirt:{top:158,height:130},shoes:{top:328,height:60},bag:{top:132,height:115},accessory:{top:48,height:70}};
const skin:Record<string,string>={light:"#F1D0B8",medium:"#D5A17C",tan:"#A86F4F",deep:"#6B402F"};

export default function DressingRoomScreen(){
 const router=useRouter();const {session}=useAuth();const {t}=useI18n();
 const [items,setItems]=useState<Item[]>([]);const [selected,setSelected]=useState<string[]>([]);
 const [avatar,setAvatar]=useState<AvatarConfig|null>(null);const [message,setMessage]=useState("");
 useEffect(()=>{if(!isSupabaseConfigured||!session)return;void Promise.all([
  supabase.from("wardrobe_items").select("id,name,category,image_path,cutout_image_path").order("created_at",{ascending:false}),
  supabase.from("style_profiles").select("avatar_config").eq("user_id",session.user.id).maybeSingle(),
  supabase.from("dressing_sessions").select("canvas_state").eq("user_id",session.user.id).maybeSingle(),
 ]).then(async([wardrobe,profile,dressing])=>{
  if(wardrobe.error||profile.error||dressing.error){setMessage(wardrobe.error?.message??profile.error?.message??dressing.error?.message??"");return;}
  const hydrated=await Promise.all((wardrobe.data??[]).map(async item=>{const path=item.cutout_image_path??item.image_path;const signed=await supabase.storage.from("user-photos").createSignedUrl(path,3600);return{...item,imageUrl:signed.data?.signedUrl};}));
  setItems(hydrated);const config=profile.data?.avatar_config;if(config&&typeof config==="object"&&!Array.isArray(config))setAvatar(config as unknown as AvatarConfig);
  const state=dressing.data?.canvas_state;if(state&&typeof state==="object"&&!Array.isArray(state)&&Array.isArray(state.items))setSelected(state.items.filter((id:unknown)=>typeof id==="string"));
 });},[session]);
 const active=useMemo(()=>items.filter(item=>selected.includes(item.id)).sort((a,b)=>(layer[a.category]??15)-(layer[b.category]??15)),[items,selected]);
 async function toggle(id:string){const next=selected.includes(id)?selected.filter(value=>value!==id):[...selected,id];setSelected(next);
  if(session&&isSupabaseConfigured){const{error}=await supabase.from("dressing_sessions").upsert({user_id:session.user.id,canvas_state:{items:next},updated_at:new Date().toISOString()});if(error)setMessage(error.message);}
 }
 const tone=skin[avatar?.skinTone??"medium"];const shoulders=avatar?.anchors.shoulderWidth??92;const waist=avatar?.anchors.waistWidth??76;
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>{t("back")}</Text></Pressable>
  <Text style={s.kicker}>{t("dressingRoomKicker")}</Text><Text style={s.title}>{t("dressingRoomTitle")}</Text><Text style={s.copy}>{t("dressingRoomCopy")}</Text>
  <View style={s.stage}>
   <View style={[s.head,{backgroundColor:tone}]} />
   <View style={[s.torso,{backgroundColor:tone,width:shoulders,borderBottomLeftRadius:waist/2,borderBottomRightRadius:waist/2}]} />
   <View style={[s.leg,{backgroundColor:tone,left:128}]} /><View style={[s.leg,{backgroundColor:tone,right:128}]} />
   {active.map(item=>item.imageUrl?<Image key={item.id} source={{uri:item.imageUrl}} resizeMode="contain" style={[s.garment,{top:(placement[item.category]??placement.tshirt).top,height:(placement[item.category]??placement.tshirt).height,zIndex:layer[item.category]??15}]} />:null)}
   {!active.length&&<Text style={s.empty}>{t("dressingRoomEmpty")}</Text>}
  </View>
  {!!message&&<Text style={s.message}>{message}</Text>}
  <Text style={s.drawerTitle}>{t("wardrobeDrawer")}</Text><View style={s.drawer}>{items.map(item=><Pressable key={item.id} style={[s.drawerItem,selected.includes(item.id)&&s.drawerItemOn]} onPress={()=>void toggle(item.id)}>
   {item.imageUrl?<Image source={{uri:item.imageUrl}} style={s.thumb} resizeMode="cover"/>:<View style={s.thumb}/>}<Text numberOfLines={2} style={s.itemName}>{item.name??t("unnamedItem")}</Text>
  </Pressable>)}</View>
 </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:760,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:26},title:{fontSize:38,fontWeight:"600",color:"#171713",marginTop:10},copy:{color:"#69645D",lineHeight:21,marginTop:8},
 stage:{height:400,backgroundColor:"#E7DED1",borderRadius:28,marginTop:20,overflow:"hidden",alignItems:"center"},head:{position:"absolute",top:22,width:58,height:65,borderRadius:29,zIndex:2},torso:{position:"absolute",top:80,height:160,borderRadius:38,zIndex:1},leg:{position:"absolute",top:210,width:34,height:165,borderRadius:18,zIndex:1},
 garment:{position:"absolute",left:80,right:80,width:250,alignSelf:"center"},empty:{position:"absolute",bottom:18,color:"#746E65",fontWeight:"700"},
 message:{color:"#6E2D3A",marginTop:12},drawerTitle:{fontSize:18,fontWeight:"800",marginTop:24,marginBottom:12},drawer:{flexDirection:"row",flexWrap:"wrap",gap:10},drawerItem:{width:104,backgroundColor:"#FFF",borderWidth:1,borderColor:"#DDD3C5",borderRadius:16,padding:8},drawerItemOn:{borderColor:"#6E2D3A",borderWidth:2},thumb:{width:"100%",height:86,borderRadius:10,backgroundColor:"#DDD3C5"},itemName:{fontSize:11,fontWeight:"700",color:"#34312C",marginTop:7}
});
