import { useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { uploadWardrobeImage } from "@/wardrobe/upload";
import { queueTryOn } from "@/tryon/service";

export default function TryOnScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useI18n();
  const [personPath, setPersonPath] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function addPhoto() {
    if (!isSupabaseConfigured) {
      setPersonPath("demo/person.jpg");
      setMessage(t("demoPhotoReady"));
      return;
    }
    if (!session) { router.replace("/sign-in"); return; }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setMessage(t("galleryPermission")); return; }

    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: .82, allowsEditing: true });
    if (picked.canceled) return;

    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      uploadedPath = await uploadWardrobeImage(session.user.id, picked.assets[0].uri);
      await supabase.from("user_photos").update({ is_primary: false }).eq("user_id", session.user.id).eq("kind", "full_body");
      const { error } = await supabase.from("user_photos").insert({
        user_id: session.user.id,
        kind: "full_body",
        image_path: uploadedPath,
        is_primary: true,
      });
      if (error) throw error;
      setPersonPath(uploadedPath);
      setMessage(t("photoSaved"));
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("user-photos").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : t("photoUploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    if (!personPath) { setMessage(t("selectFullBodyFirst")); return; }
    if (!isSupabaseConfigured) { setMessage(t("demoTryOnDone")); return; }
    if (!session) { router.replace("/sign-in"); return; }

    setBusy(true);
    const { data, error } = await supabase.from("wardrobe_items").select("image_path").limit(1).maybeSingle();
    if (error || !data) {
      setMessage(t("addWardrobeFirst"));
      setBusy(false);
      return;
    }

    try {
      const job = await queueTryOn({
        userId: session.user.id,
        personImagePath: personPath,
        garmentImagePath: data.image_path,
      });
      setMessage(t("tryOnQueued", { status: job.status }));
    } catch (startError) {
      setMessage(startError instanceof Error ? startError.message : t("processStartFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
        <Text style={s.kicker}>{t("tryOnKicker")}</Text>
        <Text style={s.title}>{t("tryOnScreenTitle")}</Text>
        <Text style={s.copy}>{t("tryOnCopy")}</Text>
        <View style={s.preview}><Text style={s.previewText}>{personPath ? t("photoReady") : t("fullBodyPhoto")}</Text></View>
        <Pressable style={s.secondary} onPress={addPhoto} disabled={busy} accessibilityRole="button">
          <Text style={s.secondaryText}>{personPath ? t("changePhoto") : t("selectPhoto")}</Text>
        </Pressable>
        <Pressable style={[s.button, busy && s.disabled]} onPress={start} disabled={busy} accessibilityRole="button">
          <Text style={s.buttonText}>{busy ? t("preparing") : t("tryWardrobeItem")}</Text>
        </Pressable>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        <Text style={s.note}>{t("tryOnNotice")}</Text>
      </View>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,width:"100%",maxWidth:620,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:30},title:{fontSize:40,fontWeight:"600",color:"#171713",marginTop:12},copy:{color:"#6C665E",lineHeight:21,marginTop:10},
 preview:{height:280,borderRadius:28,borderWidth:1,borderStyle:"dashed",borderColor:"#AEA598",marginTop:24,alignItems:"center",justifyContent:"center",backgroundColor:"#E6DED1"},previewText:{fontWeight:"800",letterSpacing:1.6,color:"#6E2D3A"},
 secondary:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#D2C9BA",borderRadius:999,padding:15,alignItems:"center",marginTop:15},secondaryText:{fontWeight:"800"},
 button:{backgroundColor:"#171713",borderRadius:999,padding:17,alignItems:"center",marginTop:12},buttonText:{color:"#FFF",fontWeight:"800"},disabled:{opacity:.5},message:{color:"#6E2D3A",fontWeight:"700",textAlign:"center",marginTop:16},note:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:20},
});
