import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { mockAiProvider } from "@/ai/mock-provider";
import type { OutfitSuggestion } from "@/ai/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function OutfitScreen(){
  const router=useRouter(); const {session}=useAuth();
  const [occasion,setOccasion]=useState("Düğün");
  const [budget,setBudget]=useState("3000");
  const [result,setResult]=useState<OutfitSuggestion|null>(null);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");

  async function create(){
    setBusy(true); setMessage("");
    let ids=["demo-dress","demo-jacket","demo-shoes"];
    if(isSupabaseConfigured&&session){
      const {data,error}=await supabase.from("wardrobe_items").select("id").limit(20);
      if(error){setMessage(error.message);setBusy(false);return;}
      ids=(data??[]).map(x=>x.id);
    }
    const suggestions=await mockAiProvider.createOutfits({locale:"tr",occasion,budget:Number(budget)||undefined,currency:"TRY",wardrobeItemIds:ids});
    setResult(suggestions[0]); setBusy(false);
  }

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={()=>router.back()}><Text style={s.back}>← Geri</Text></Pressable>
    <Text style={s.kicker}>AI STİLİST</Text><Text style={s.title}>Nereye gidiyorsun?</Text>
    <Text style={s.label}>Etkinlik</Text><TextInput style={s.input} value={occasion} onChangeText={setOccasion} placeholder="Düğün, iş görüşmesi, akşam yemeği…"/>
    <Text style={s.label}>Toplam bütçe</Text><TextInput style={s.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="3000"/>
    <Pressable style={[s.button,busy&&{opacity:.5}]} onPress={create} disabled={busy}><Text style={s.buttonText}>{busy?"Gardırop inceleniyor…":"Kombinleri hazırla →"}</Text></Pressable>
    {!!message&&<Text style={s.message}>{message}</Text>}
    {result&&<View style={s.result}><Text style={s.resultKicker}>SANA ÖZEL ÖNERİ</Text><Text style={s.resultTitle}>{result.title}</Text><Text style={s.resultCopy}>{result.explanation}</Text>
      <Text style={s.line}>{result.wardrobeItemIds.length} gardırop parçası kullanıldı</Text>
      <Pressable style={s.secondary} onPress={()=>router.push("/products")}><Text style={s.secondaryText}>Eksik parçaları ve alternatifleri gör</Text></Pressable>
      <Pressable style={s.try} onPress={()=>router.push("/try-on")}><Text style={s.tryText}>Sanal olarak dene →</Text></Pressable>
    </View>}
    <Text style={s.note}>Şu anda ücretsiz mock AI kullanılıyor; ücretli model yalnızca açık onaydan sonra bağlanacak.</Text>
  </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:680,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:30},title:{fontSize:40,fontWeight:"600",color:"#171713",marginTop:12},label:{fontWeight:"700",marginTop:22,marginBottom:8},
 input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#DCD3C5",borderRadius:14,padding:15,fontSize:16},button:{backgroundColor:"#171713",borderRadius:999,padding:17,alignItems:"center",marginTop:24},buttonText:{color:"#FFF",fontWeight:"800"},
 message:{color:"#6E2D3A",marginTop:14},result:{backgroundColor:"#6E2D3A",borderRadius:26,padding:24,marginTop:26},resultKicker:{color:"#DCC7CA",fontSize:10,fontWeight:"800",letterSpacing:1.6},resultTitle:{color:"#FFF",fontSize:27,fontWeight:"600",marginTop:14},resultCopy:{color:"#F1E6E8",lineHeight:21,marginTop:10},line:{color:"#FFF",fontWeight:"700",marginTop:18},
 secondary:{backgroundColor:"#FFF",borderRadius:999,padding:14,alignItems:"center",marginTop:20},secondaryText:{color:"#171713",fontWeight:"800"},try:{padding:14,alignItems:"center"},tryText:{color:"#FFF",fontWeight:"800"},note:{fontSize:11,color:"#777168",textAlign:"center",lineHeight:17,marginTop:22}
});
