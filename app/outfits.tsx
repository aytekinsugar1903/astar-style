import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { track } from "@/analytics/track";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Outfit = {
  id: string;
  title: string;
  occasion: string | null;
  explanation: string | null;
  is_favorite: boolean;
  created_at: string;
  outfit_items: Array<{ wardrobe_item_id: string }>;
};

export default function OutfitsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const [items, setItems] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [message, setMessage] = useState("");
  const [wearingId, setWearingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("outfits")
      .select("id,title,occasion,explanation,is_favorite,created_at,outfit_items(wardrobe_item_id)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setMessage(error.message);
    else setItems(data ?? []);
    setLoading(false);
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  async function toggleFavorite(item: Outfit) {
    if (!isSupabaseConfigured || !session) return;
    const next = !item.is_favorite;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_favorite: next } : entry));
    const { error } = await supabase
      .from("outfits")
      .update({ is_favorite: next })
      .eq("id", item.id)
      .eq("user_id", session.user.id);
    if (error) {
      setItems((current) => current.map((entry) => entry.id === item.id ? item : entry));
      setMessage(error.message);
      return;
    }
    void track(next ? "outfit_favorited" : "outfit_unfavorited");
  }

  async function markWorn(item: Outfit) {
    if (!isSupabaseConfigured || !session) return;
    setWearingId(item.id);
    setMessage("");
    const { error } = await supabase.rpc("mark_outfit_worn", { p_outfit_id: item.id, p_event_name: item.occasion ?? undefined });
    setWearingId(null);
    if (error) { setMessage(error.message); return; }
    void track("outfit_worn", { outfit_id: item.id, piece_count: item.outfit_items.length });
    setMessage(t("outfitMarkedWorn"));
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
        <Text style={s.kicker}>{t("outfitHistoryKicker")}</Text>
        <Text style={s.title}>{t("outfitHistoryScreenTitle")}</Text>
        <Text style={s.copy}>{t("outfitHistoryCopy")}</Text>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        {loading ? <Text style={s.empty}>{t("wait")}</Text> : items.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>{t("outfitHistoryEmpty")}</Text>
            <Pressable style={s.primary} onPress={() => router.push("/outfit")} accessibilityRole="button">
              <Text style={s.primaryText}>{t("prepareOutfits")}</Text>
            </Pressable>
          </View>
        ) : items.map((item) => (
          <View key={item.id} style={s.card}>
            <View style={s.row}>
              <View style={s.cardText}>
                {!!item.occasion && <Text style={s.occasion}>{item.occasion.toUpperCase()}</Text>}
                <Text style={s.cardTitle}>{item.title}</Text>
              </View>
              <Pressable
                style={[s.favorite, item.is_favorite && s.favoriteActive]}
                onPress={() => void toggleFavorite(item)}
                accessibilityRole="button"
                accessibilityLabel={item.is_favorite ? t("unfavoriteOutfit") : t("favoriteOutfit")}
              >
                <Text style={[s.favoriteText, item.is_favorite && s.favoriteTextActive]}>{item.is_favorite ? "♥" : "♡"}</Text>
              </Pressable>
            </View>
            {!!item.explanation && <Text style={s.explanation}>{item.explanation}</Text>}
            <Text style={s.date}>{new Date(item.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}</Text>
            <Pressable style={[s.wornButton,wearingId===item.id&&s.disabled]} onPress={()=>void markWorn(item)} disabled={wearingId===item.id} accessibilityRole="button">
              <Text style={s.wornButtonText}>{wearingId===item.id?t("saving"):t("woreToday")}</Text>
            </Pressable>
            {!!item.outfit_items[0]?.wardrobe_item_id && (
              <Pressable
                style={s.tryButton}
                onPress={() => router.push({ pathname: "/try-on", params: { wardrobeItemId: item.outfit_items[0].wardrobe_item_id } })}
                accessibilityRole="button"
              >
                <Text style={s.tryButtonText}>{t("virtualTryOnAction")}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:680,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 kicker:{fontSize:11,fontWeight:"800",letterSpacing:1.8,color:"#6E2D3A",marginTop:30},title:{fontSize:40,fontWeight:"600",color:"#171713",marginTop:12},copy:{color:"#6F6B63",lineHeight:21,marginTop:10,marginBottom:22},message:{color:"#6E2D3A",marginBottom:14},
 card:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#E3DACE",borderRadius:22,padding:20,marginBottom:13},row:{flexDirection:"row",alignItems:"flex-start",gap:12},cardText:{flex:1},occasion:{fontSize:10,fontWeight:"800",letterSpacing:1.4,color:"#6E2D3A"},cardTitle:{fontSize:21,fontWeight:"700",color:"#171713",marginTop:7},explanation:{color:"#615D56",lineHeight:20,marginTop:12},date:{color:"#918B82",fontSize:11,marginTop:15},
 favorite:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:"#CBBFB0",alignItems:"center",justifyContent:"center"},favoriteActive:{backgroundColor:"#6E2D3A",borderColor:"#6E2D3A"},favoriteText:{fontSize:21,color:"#6E2D3A"},favoriteTextActive:{color:"#FFF"},
 empty:{color:"#777168",marginTop:22},emptyCard:{backgroundColor:"#FFF",borderRadius:22,padding:22},emptyTitle:{fontSize:18,fontWeight:"700",color:"#171713"},primary:{backgroundColor:"#171713",borderRadius:999,padding:15,alignItems:"center",marginTop:18},primaryText:{color:"#FFF",fontWeight:"800"},
 wornButton:{backgroundColor:"#171713",borderRadius:999,padding:13,alignItems:"center",marginTop:15},wornButtonText:{color:"#FFF",fontWeight:"800"},disabled:{opacity:.5},
 tryButton:{borderWidth:1,borderColor:"#6E2D3A",borderRadius:999,padding:13,alignItems:"center",marginTop:10},tryButtonText:{color:"#6E2D3A",fontWeight:"800"},
});
