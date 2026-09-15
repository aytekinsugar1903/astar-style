import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { uploadWardrobeImage } from "@/wardrobe/upload";
import { queueTryOn } from "@/tryon/service";

export default function TryOnScreen(){
  const router=useRouter(); const {session}=useAuth();
  const [personPath,setPersonPath]=useState<string|null>(null);
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);

  async function addPhoto(){
    if(!isSupabaseConfigured){setPersonPath("demo/person.jpg");setMessage("Demo tam boy fotoğraf hazır.");return;}
    if(!session){router.replace("/sign-in");return;}
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){setMessage("Galeri izni gerekiyor.");return;}
    const picked=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:.82,allowsEditing:true});
    if(picked.canceled)return;
    setBusy(true);
    try{
      const path=await uploadWardrobeImage(session.user.id,picked.assets[0].uri);
      await supabase.from("user_photos").update({is_primary:false}).eq("user_id",session.user.id).eq("kind","full_body");
      const {error}=await supabase.from("user_photos").insert({user_id:session.user.id,kind:"full_body",image_path:path,is_primary:true});
      if(error)throw error; setPersonPath(path);setMessage("Fotoğraf güvenli şekilde kaydedildi.");
    }catch(e){setMessage(e instanceof Error?e.message:"Fotoğraf yüklenemedi.");}finally{setBusy(false);}
  }

  async function start(){
    if(!personPath){setMessage("Önce tam boy fotoğrafını seç.");return;}
    if(!isSupabaseConfigured){setMessage("Demo sanal deneme tamamlandı · gerçek görsel üretilmedi.");return;}
    if(!session){router.replace("/sign-in");return;}
    setBusy(true);
    const {data,error}=await supabase.from("wardrobe_items").select("image_path").limit(1).maybeSingle();
    if(error||!data){setMessage("Önce gardırobuna bir kıyafet ekle.");setBusy(false);return;}
    try{const job=await queueTryOn({userId:session.user.id,personImagePath:personPath,garmentImagePath:data.image_path});setMessage(`Sanal deneme sıraya alındı · ${job.status}`);}
    catch(e){setMessage(e instanceof Error?e.message:"İşlem başlatılamadı.");}finally{setBusy(false);}
  }

  return <SafeAreaView style={s.safe}><View style={s.page}>
    <Pressable onPress={()=>router.back()}><Text style={s.back}>← Geri</Text></Pressable>
    <Text style={s.kicker}>SANAL DENEME</Text><Text style={s.title}>Üzerinde gör.</Text><Text style={s.copy}>Önden çekilmiş, iyi aydınlatılmış tam boy fotoğraf en iyi sonucu verir.</Text>
    <View style={s.preview}><Text style={s.previewText}>{personPath?"FOTOĞRAF HAZIR":"TAM BOY FOTOĞRAF"}</Text></View>
    <Pressable style={s.secondary} onPress={addPhoto} disabled={busy}><Text style={s.secondaryText}>{personPath?"Fotoğrafı değiştir":"Fotoğraf seç"}</Text></Pressable>
    <Pressable style={[s.button,busy&&{opacity:.5}]} onPress={start} disabled={busy}><Text style={s.buttonText}>{busy?"Hazırlanıyor…":"Gardırobumdaki parçayı dene →"}</Text></Pressable>
    {!!message&&<Text style={s.message}>{message}</Text>}
    <Text style={s.note}>Bu özellik beden garantisi değil, görsel stil önizlemesidir. Ücretli sanal deneme API’si henüz aktif değildir.</Text>
  </View></SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,width:"100%",maxWidth:620,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:30},title:{fontSize:40,fontWeight:"600",color:"#171713",marginTop:12},copy:{color:"#6C665E",lineHeight:21,marginTop:10},
 preview:{height:280,borderRadius:28,borderWidth:1,borderStyle:"dashed",borderColor:"#AEA598",marginTop:24,alignItems:"center",justifyContent:"center",backgroundColor:"#E6DED1"},previewText:{fontWeight:"800",letterSpacing:1.6,color:"#6E2D3A"},
 secondary:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#D2C9BA",borderRadius:999,padding:15,alignItems:"center",marginTop:15},secondaryText:{fontWeight:"800"},
 button:{backgroundColor:"#171713",borderRadius:999,padding:17,alignItems:"center",marginTop:12},buttonText:{color:"#FFF",fontWeight:"800"},message:{color:"#6E2D3A",fontWeight:"700",textAlign:"center",marginTop:16},note:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:20}
});
