import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const actions: ReadonlyArray<readonly [string, string, string, "/wardrobe" | "/outfit" | "/try-on" | "/products" | "/stylist" | "/board"]> = [
  ["Dolabım", "Kıyafetlerini tara, ayır ve düzenle.", "01", "/wardrobe"],
  ["Kombin Yap", "Kendi dolabından sana özel kombinler.", "02", "/outfit"],
  ["Ürün Kontrol Et", "Almadan önce dolabınla uyumunu kontrol et.", "03", "/products"],
  ["Üzerimde Gör", "Seçtiğin kombini sanal olarak dene.", "04", "/try-on"],
  ["WEYRA AI", "Gardırobunu bilen kişisel stilistin.", "05", "/stylist"],
  ["Kombin Panosu", "Parçaları sürükle, kendi görünümünü oluştur.", "06", "/board"],
];

export default function HomeScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { t } = useI18n();
  const [checkingProfile, setCheckingProfile] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return;
    if (!session) {
      setCheckingProfile(false);
      router.replace("/sign-in");
      return;
    }

    let active = true;
    setCheckingProfile(true);
    void supabase.from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (!data?.onboarding_completed) router.replace("/onboarding");
        setCheckingProfile(false);
      });

    return () => { active = false; };
  }, [loading, router, session]);

  if (loading || checkingProfile) {
    return <SafeAreaView style={styles.safe}><Text style={styles.loading}>{t("loading")}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>WEYRA</Text>
          <Pressable style={styles.avatar} onPress={() => router.push("/profile")} accessibilityRole="button">
            <Text style={styles.avatarText}>A</Text>
          </Pressable>
        </View>
        {!isSupabaseConfigured && <Text style={styles.demo}>{t("demoMode")}</Text>}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>WEYRA DIGITAL CLOSET</Text>
          <Text style={styles.title}>Dolabın burada.</Text>
          <Text style={styles.subtitle}>Askılığını kaydır, bir parçadan kombin başlat veya WEYRA'ya bugün ne giyeceğini sor.</Text>
          <View style={styles.rail}><View style={styles.railBar}/><View style={styles.hangers}>
            {["Krem blazer","Beyaz gömlek","Siyah pantolon","Midi etek"].map((name,index)=><Pressable key={name} style={styles.hanger} onPress={() => router.push("/showcase")} accessibilityRole="button"><Text style={styles.hook}>⌄</Text><View style={[styles.miniGarment,index%2===1&&styles.miniLight]}><Text style={styles.miniText}>{name}</Text></View></Pressable>)}
          </View></View>
          <View style={styles.heroActions}><Pressable style={styles.primary} onPress={() => router.push("/showcase")} accessibilityRole="button"><Text style={styles.primaryText}>Askılığımı aç</Text><Text style={styles.arrow}>→</Text></Pressable><Pressable style={styles.secondary} onPress={() => router.push("/outfit")} accessibilityRole="button"><Text style={styles.secondaryText}>Bugün ne giyeyim?</Text></Pressable></View>
        </View>
        <Text style={styles.sectionTitle}>Gardırobun. Kararın. Stilin.</Text>
        <View style={styles.grid}>
          {actions.map(([title, subtitle, number, route]) => (
            <Pressable key={title} style={styles.card} onPress={() => router.push(route)} accessibilityRole="button">
              <Text style={styles.number}>{number}</Text>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{subtitle}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.privacy}>{t("homePrivacy")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const colors = { ink: "#171713", cream: "#F5F1E8", stone: "#D8D0C2", wine: "#6E2D3A", white: "#FFFFFF" };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, loading: { margin: "auto", fontSize: 18, fontWeight: "800", letterSpacing: 2 },
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 44, width: "100%", maxWidth: 760, alignSelf: "center" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  brand: { color: colors.ink, fontSize: 16, fontWeight: "800", letterSpacing: 2.2 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.white, fontWeight: "700" },
  demo: { color: colors.wine, fontSize: 11, fontWeight: "700", marginBottom: 12 },
  hero: { backgroundColor: colors.white, borderRadius: 28, padding: 22, minHeight: 390, borderWidth:1, borderColor:"#E7E0D5" },
  eyebrow: { color: colors.wine, letterSpacing: 1.8, fontSize: 11, fontWeight: "700", marginBottom: 14 },
  title: { color: colors.ink, fontSize: 46, lineHeight: 49, fontWeight: "500", letterSpacing: -1.5 },
  subtitle: { color: "#6F6B63", fontSize: 15, lineHeight: 22, marginTop: 16, maxWidth: 430 },
  primary: { flex:1, backgroundColor: colors.ink, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between" },
  primaryText: { color: colors.white, fontWeight: "700" }, arrow: { color: colors.white, fontSize: 18, fontWeight: "800" },
  rail:{marginTop:24,backgroundColor:"#F5F1E8",borderRadius:20,padding:14,overflow:"hidden"},railBar:{height:4,backgroundColor:"#38342F",borderRadius:4},hangers:{flexDirection:"row",justifyContent:"space-around",gap:6},hanger:{flex:1,alignItems:"center"},hook:{fontSize:26,color:"#4C4740",height:28},miniGarment:{height:90,width:"100%",maxWidth:82,backgroundColor:"#B8A391",borderRadius:7,alignItems:"center",justifyContent:"center",padding:5},miniLight:{backgroundColor:"#E6DED2"},miniText:{fontSize:9,fontWeight:"700",textAlign:"center",color:"#332D27"},heroActions:{flexDirection:"row",gap:8,marginTop:18},secondary:{flex:1,borderWidth:1,borderColor:colors.ink,borderRadius:999,paddingVertical:15,paddingHorizontal:14,alignItems:"center"},secondaryText:{color:colors.ink,fontWeight:"700",fontSize:12},\n  sectionTitle: { fontSize: 21, fontWeight: "700", color: colors.ink, marginTop: 28, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, minHeight: 154, flexGrow: 1, flexBasis: 160, borderWidth: 1, borderColor: "#E7E0D5" },
  number: { color: colors.wine, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", marginTop: 34 },
  cardSubtitle: { color: "#6F6B63", fontSize: 13, lineHeight: 18, marginTop: 6 },
  privacy: { color: "#777168", fontSize: 12, textAlign: "center", marginTop: 28 },
});
