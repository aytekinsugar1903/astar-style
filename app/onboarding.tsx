import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const stylesList = ["Minimal", "Klasik", "Rahat", "Romantik", "Sokak", "Ofis", "Cesur", "Zamansız"];
const colors = ["Siyah", "Krem", "Bordo", "Lacivert", "Toprak", "Pastel"];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (value: string, values: string[], setter: (v: string[]) => void) =>
    setter(values.includes(value) ? values.filter((x) => x !== value) : [...values, value]);

  async function save() {
    if (!accepted) { setMessage("Devam etmek için gizlilik onayını seç."); return; }
    if (tags.length === 0) { setMessage("En az bir stil seç."); return; }
    if (!isSupabaseConfigured) { router.replace("/wardrobe"); return; }
    if (!session) { router.replace("/sign-in"); return; }
    setBusy(true);
    const [profile, style, consent] = await Promise.all([
      supabase.from("profiles").upsert({ id: session.user.id, locale: "tr", onboarding_completed: true }),
      supabase.from("style_profiles").upsert({ user_id: session.user.id, style_tags: tags, preferred_colors: preferredColors }),
      supabase.from("consents").insert({ user_id: session.user.id, consent_type: "privacy_and_ai_processing", policy_version: "2026-09-15", granted: true }),
    ]);
    setBusy(false);
    const error = profile.error ?? style.error ?? consent.error;
    if (error) { setMessage(error.message); return; }
    router.replace("/wardrobe");
  }

  return (
    <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
      <Text style={s.step}>01 · STİL PROFİLİ</Text>
      <Text style={s.title}>Seni biraz tanıyalım.</Text>
      <Text style={s.copy}>Seçimlerin önerileri kişiselleştirir; daha sonra değiştirebilirsin.</Text>
      <Text style={s.label}>Tarzını nasıl tanımlarsın?</Text>
      <View style={s.chips}>{stylesList.map(x => <Pressable key={x} onPress={() => toggle(x, tags, setTags)} style={[s.chip, tags.includes(x) && s.active]}><Text style={[s.chipText, tags.includes(x) && s.activeText]}>{x}</Text></Pressable>)}</View>
      <Text style={s.label}>En sık kullandığın renkler</Text>
      <View style={s.chips}>{colors.map(x => <Pressable key={x} onPress={() => toggle(x, preferredColors, setPreferredColors)} style={[s.chip, preferredColors.includes(x) && s.active]}><Text style={[s.chipText, preferredColors.includes(x) && s.activeText]}>{x}</Text></Pressable>)}</View>
      <Pressable style={s.consent} onPress={() => setAccepted(!accepted)}>
        <View style={[s.box, accepted && s.boxOn]}><Text style={s.tick}>{accepted ? "✓" : ""}</Text></View>
        <Text style={s.consentText}>Fotoğraflarımın yalnızca stil analizi ve seçtiğim sanal deneme işlemleri için kullanılmasını kabul ediyorum.</Text>
      </Pressable>
      {!!message && <Text style={s.message}>{message}</Text>}
      <Pressable style={[s.button, busy && {opacity:.5}]} onPress={save} disabled={busy}><Text style={s.buttonText}>{busy ? "Kaydediliyor…" : "Gardırobuma geç →"}</Text></Pressable>
    </ScrollView></SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:24,paddingBottom:50,width:"100%",maxWidth:680,alignSelf:"center"},
  step:{fontSize:11,fontWeight:"800",letterSpacing:1.6,color:"#6E2D3A",marginTop:16},title:{fontSize:38,lineHeight:42,fontWeight:"600",color:"#171713",marginTop:18},
  copy:{fontSize:15,lineHeight:22,color:"#69645D",marginTop:12},label:{fontSize:17,fontWeight:"700",color:"#171713",marginTop:30,marginBottom:12},
  chips:{flexDirection:"row",flexWrap:"wrap",gap:9},chip:{borderWidth:1,borderColor:"#CEC5B7",borderRadius:999,paddingVertical:11,paddingHorizontal:15,backgroundColor:"#FFF"},
  active:{backgroundColor:"#171713",borderColor:"#171713"},chipText:{color:"#33312D",fontWeight:"600"},activeText:{color:"#FFF"},
  consent:{flexDirection:"row",alignItems:"flex-start",marginTop:30,gap:12},box:{width:24,height:24,borderRadius:7,borderWidth:1,borderColor:"#9F978A",alignItems:"center",justifyContent:"center"},
  boxOn:{backgroundColor:"#6E2D3A",borderColor:"#6E2D3A"},tick:{color:"#FFF",fontWeight:"900"},consentText:{flex:1,color:"#5E5952",lineHeight:20,fontSize:13},
  message:{color:"#6E2D3A",marginTop:14},button:{backgroundColor:"#6E2D3A",borderRadius:999,padding:17,alignItems:"center",marginTop:24},buttonText:{color:"#FFF",fontWeight:"800"}
});
