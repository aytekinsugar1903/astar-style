import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Piece={id:string;name:string|null;category:string;colors:string[];image_path:string;cutout_image_path:string|null;wear_count:number;imageUrl?:string};
const demo:Piece[]=[
 {id:"v1",name:"Krem blazer",category:"jacket",colors:["Krem"],image_path:"",cutout_image_path:null,wear_count:8},
 {id:"v2",name:"Beyaz gömlek",category:"shirt",colors:["Beyaz"],image_path:"",cutout_image_path:null,wear_count:14},
 {id:"v3",name:"Siyah pantolon",category:"trousers",colors:["Siyah"],image_path:"",cutout_image_path:null,wear_count:11},
 {id:"v4",name:"Midi etek",category:"skirt",colors:["Siyah"],image_path:"",cutout_image_path:null,wear_count:5},
];
export default function ShowcaseScreen(){
 const router=useRouter(); const {session}=useAuth();
 const [items,setItems]=useState<Piece[]>(isSupabaseConfigured?[]:demo);
 const [active,setActive]=useState("all");
 const load=useCallback(async()=>{
  if(!isSupabaseConfigured||!session)return;
  const q=await supabase.from("wardrobe_items").select("id,name,category,colors,image_path,cutout_image_path,wear_count").order("wear_count",{ascending:false});
  if(q.error)return;
  const hydrated=await Promise.all((q.data??[]).map(async p=>{const signed=await supabase.storage.from("user-photos").createSignedUrl(p.cutout_image_path??p.image_path,3600);return {...p,imageUrl:signed.data?.signedUrl};}));
  setItems(hydrated);
 },[session]);
 useEffect(()=>{void load()},[load]);
 const cats=["all",...Array.from(new Set(items.map(x=>x.category)))];
 const visible=active==="all"?items:items.filter(x=>x.category===active);
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
  <View style={s.top}><Pressable onPress={()=>router.back()}><Text style={s.back}>← Dolabım</Text></Pressable><Text style={s.logo}>WEYRA</Text></View>
  <Text style={s.kicker}>DİJİTAL VİTRİN</Text><Text style={s.title}>Dolabını askıda gez.</Text>
  <Text style={s.copy}>Parçalarını gerçek bir askılık hissiyle kaydır. Bir parçayı seç, kombin yap veya üzerinde gör.</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>{cats.map(c=><Pressable key={c} onPress={()=>setActive(c)} style={[s.chip,active===c&&s.chipOn]}><Text style={[s.chipText,active===c&&s.chipTextOn]}>{c==="all"?"Tümü":c}</Text></Pressable>)}</ScrollView>
  <View style={s.rail}><View style={s.bar}/><ScrollView horizontal snapToInterval={180} decelerationRate="fast" showsHorizontalScrollIndicator={false} contentContainerStyle={s.rack}>
   {visible.map((p,i)=><View key={p.id} style={s.slot}><View style={s.hanger}><Text style={s.hangerText}>⌄</Text></View><View style={s.garment}>{p.imageUrl?<Image source={{uri:p.imageUrl}} style={s.photo} resizeMode="contain"/>:<View style={[s.demo,{opacity:.82-i*.05}]}><Text style={s.demoText}>{p.name}</Text></View>}</View><Text style={s.name}>{p.name??"İsimsiz parça"}</Text><Text style={s.meta}>{p.colors?.join(", ")} · {p.wear_count??0} kez giyildi</Text><Pressable style={s.action} onPress={()=>router.push("/outfit")}><Text style={s.actionText}>Bu parçayla kombin yap</Text></Pressable></View>)}
  </ScrollView></View>
  <View style={s.actions}><Pressable style={s.dark} onPress={()=>router.push("/try-on")}><Text style={s.darkText}>Üzerimde Gör</Text></Pressable><Pressable style={s.light} onPress={()=>router.push("/board")}><Text style={s.lightText}>Lookbook Oluştur</Text></Pressable></View>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:60,maxWidth:900,width:"100%",alignSelf:"center"},top:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:10},back:{color:"#6E2D3A",fontWeight:"800"},logo:{fontWeight:"900",letterSpacing:3,color:"#171713"},kicker:{marginTop:34,fontSize:11,letterSpacing:2,color:"#6E2D3A",fontWeight:"900"},title:{fontSize:39,lineHeight:43,fontWeight:"600",color:"#171713",marginTop:8},copy:{color:"#6B665F",fontSize:15,lineHeight:22,marginTop:10,maxWidth:520},filters:{gap:8,paddingVertical:20},chip:{borderWidth:1,borderColor:"#CFC5B7",borderRadius:999,paddingHorizontal:14,paddingVertical:9},chipOn:{backgroundColor:"#171713",borderColor:"#171713"},chipText:{fontSize:12,color:"#5D574F"},chipTextOn:{color:"#FFF"},rail:{backgroundColor:"#FBF9F5",borderRadius:28,paddingVertical:24,overflow:"hidden",borderWidth:1,borderColor:"#E1D9CD"},bar:{height:5,backgroundColor:"#2D2A26",marginHorizontal:24,borderRadius:4},rack:{paddingHorizontal:20,paddingTop:0,gap:12},slot:{width:168,alignItems:"center"},hanger:{height:42,alignItems:"center",justifyContent:"center"},hangerText:{fontSize:37,color:"#4C4740",marginTop:-8},garment:{height:230,width:158,alignItems:"center",justifyContent:"center"},photo:{width:"100%",height:"100%"},demo:{width:130,height:205,backgroundColor:"#D8CBBB",borderRadius:8,alignItems:"center",justifyContent:"center",padding:10},demoText:{fontWeight:"800",color:"#3B342E",textAlign:"center"},name:{fontWeight:"800",fontSize:15,color:"#171713",marginTop:7,textAlign:"center"},meta:{fontSize:11,color:"#777067",marginTop:4,textAlign:"center"},action:{marginTop:11,borderBottomWidth:1,borderBottomColor:"#6E2D3A",paddingBottom:3},actionText:{fontSize:11,color:"#6E2D3A",fontWeight:"800"},actions:{gap:10,marginTop:20},dark:{backgroundColor:"#171713",borderRadius:999,padding:16,alignItems:"center"},darkText:{color:"#FFF",fontWeight:"800"},light:{borderWidth:1,borderColor:"#171713",borderRadius:999,padding:15,alignItems:"center"},lightText:{color:"#171713",fontWeight:"800"}});
