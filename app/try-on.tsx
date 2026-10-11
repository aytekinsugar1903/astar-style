import {useAppStyles,useTheme} from '@/studio/theme';
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { functionErrorKey } from "@/lib/function-error";
import { uploadWardrobeImage } from "@/wardrobe/upload";
import {useCloset,picture} from '@/studio/closet';
import {selectPhoto} from '@/studio/media';
import { queueTryOn } from "@/tryon/service";

export default function TryOnScreen() {const s=useAppStyles(baseStyles);

  const router = useRouter();
  const { wardrobeItemId } = useLocalSearchParams<{ wardrobeItemId?: string }>();
  const { session } = useAuth();const {items}=useCloset();const selected=items.find(p=>p.id===wardrobeItemId);
  const { t } = useI18n();
  const [personPath, setPersonPath] = useState<string | null>(null);
  const [garmentName, setGarmentName] = useState(wardrobeItemId ? t("selectedOutfitPiece") : "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let active = true;
    void Promise.all([
      supabase.from("user_photos").select("image_path").eq("user_id", session.user.id).eq("kind", "full_body").eq("is_primary", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      wardrobeItemId
        ? supabase.from("wardrobe_items").select("name").eq("id", wardrobeItemId).eq("user_id", session.user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]).then(([photo, garment]) => {
      if (!active) return;
      if (photo.data?.image_path) setPersonPath(photo.data.image_path);
      if (garment.data?.name) setGarmentName(garment.data.name);
    });
    return () => { active = false; };
  }, [session, wardrobeItemId]);

  async function addPhoto() {
    if (!isSupabaseConfigured) {
      try { const picked=await selectPhoto(); if(picked){setPersonPath(picked.data);setMessage(t("localTryOnPhotoReady"));} } catch { setMessage(t("photoUploadFailed")); }
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
    const baseQuery = supabase.from("wardrobe_items").select("image_path,name").eq("user_id", session.user.id);
    const { data, error } = wardrobeItemId
      ? await baseQuery.eq("id", wardrobeItemId).maybeSingle()
      : await baseQuery.limit(1).maybeSingle();
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
      setMessage(t(await functionErrorKey(startError, "virtual_try_on")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
        <Text style={s.kicker}>{t("tryOnKicker")}</Text>
        <Text style={s.title}>{t("tryOnScreenTitle")}</Text>
        <Text style={s.copy}>{t("tryOnCopy")}</Text>
        {!!garmentName && <View style={s.selection}><Text style={s.selectionLabel}>{t("selectedForTryOn")}</Text><Text style={s.selectionName}>{selected?.name??garmentName}</Text>{selected&&<Image source={picture(selected)} resizeMode="contain" style={{width:'100%',height:140,marginTop:10}} accessibilityLabel={selected.name}/>}</View>}
        <View style={s.preview}>{personPath&&!isSupabaseConfigured?<Image source={{uri:personPath}} style={{width:"100%",height:"100%"}} resizeMode="contain"/>:<Text style={s.previewText}>{personPath ? t("photoReady") : t("fullBodyPhoto")}</Text>}</View>
        <Pressable style={s.secondary} onPress={addPhoto} disabled={busy} accessibilityRole="button">
          <Text style={s.secondaryText}>{personPath ? t("changePhoto") : t("selectPhoto")}</Text>
        </Pressable>
        <Pressable style={[s.button, busy && s.disabled]} onPress={start} disabled={busy} accessibilityRole="button">
          <Text style={s.buttonText}>{busy ? t("preparing") : t("tryWardrobeItem")}</Text>
        </Pressable>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        {!isSupabaseConfigured&&personPath&&<Pressable style={s.secondary} onPress={()=>{setPersonPath(null);setMessage("");}}><Text style={s.secondaryText}>{t("removeLocalPreview")}</Text></Pressable>}
        <Pressable style={s.secondary} onPress={()=>router.push("/board")}><Text style={s.secondaryText}>{t("boardTitle")}</Text></Pressable>
        <Text style={s.note}>{t("tryOnNotice")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:40,width:"100%",maxWidth:620,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:30},title:{fontSize:40,fontWeight:"600",color:"#171713",marginTop:12},copy:{color:"#6C665E",lineHeight:21,marginTop:10},
 selection:{backgroundColor:"#FFF",borderRadius:16,padding:14,marginTop:18,borderWidth:1,borderColor:"#DDD3C5"},selectionLabel:{fontSize:10,fontWeight:"800",letterSpacing:1.2,color:"#6E2D3A"},selectionName:{fontSize:16,fontWeight:"700",color:"#171713",marginTop:5},
 preview:{height:280,borderRadius:28,borderWidth:1,borderStyle:"dashed",borderColor:"#AEA598",marginTop:18,alignItems:"center",justifyContent:"center",backgroundColor:"#E6DED1"},previewText:{fontWeight:"800",letterSpacing:1.6,color:"#6E2D3A"},
 secondary:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#D2C9BA",borderRadius:999,padding:15,alignItems:"center",marginTop:15},secondaryText:{fontWeight:"800"},
 button:{backgroundColor:"#171713",borderRadius:999,padding:17,alignItems:"center",marginTop:12},buttonText:{color:"#FFF",fontWeight:"800"},disabled:{opacity:.5},message:{color:"#6E2D3A",fontWeight:"700",textAlign:"center",marginTop:16},note:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:20},
});


const baseStyles=s;
