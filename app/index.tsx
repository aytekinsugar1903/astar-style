import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const actions: ReadonlyArray<readonly [TranslationKey, TranslationKey, string, "/wardrobe" | "/outfit" | "/try-on" | "/products" | "/favorites"]> = [
  ["wardrobeTitle", "wardrobeSubtitle", "01", "/wardrobe"],
  ["outfitTitle", "outfitSubtitle", "02", "/outfit"],
  ["tryOnTitle", "tryOnSubtitle", "03", "/try-on"],
  ["productsTitle", "productsSubtitle", "04", "/products"],
  ["favoritesTitle", "favoritesSubtitle", "05", "/favorites"],
  ["eventTitle", "eventSubtitle", "06", "/outfit"],
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
          <Text style={styles.brand}>ASTRA STYLE</Text>
          <Pressable style={styles.avatar} onPress={() => router.push("/profile")} accessibilityRole="button">
            <Text style={styles.avatarText}>A</Text>
          </Pressable>
        </View>
        {!isSupabaseConfigured && <Text style={styles.demo}>{t("demoMode")}</Text>}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t("homeEyebrow")}</Text>
          <Text style={styles.title}>{t("homeTitle")}</Text>
          <Text style={styles.subtitle}>{t("homeSubtitle")}</Text>
          <Pressable style={styles.primary} onPress={() => router.push("/outfit")} accessibilityRole="button">
            <Text style={styles.primaryText}>{t("homePrimary")}</Text><Text style={styles.arrow}>→</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionTitle}>{t("homeSection")}</Text>
        <View style={styles.grid}>
          {actions.map(([titleKey, subtitleKey, number, route]) => (
            <Pressable key={titleKey} style={styles.card} onPress={() => router.push(route)} accessibilityRole="button">
              <Text style={styles.number}>{number}</Text>
              <Text style={styles.cardTitle}>{t(titleKey)}</Text>
              <Text style={styles.cardSubtitle}>{t(subtitleKey)}</Text>
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
  hero: { backgroundColor: colors.ink, borderRadius: 28, padding: 26, minHeight: 340, justifyContent: "flex-end" },
  eyebrow: { color: colors.stone, letterSpacing: 1.8, fontSize: 11, fontWeight: "700", marginBottom: 14 },
  title: { color: colors.white, fontSize: 46, lineHeight: 49, fontWeight: "500", letterSpacing: -1.5 },
  subtitle: { color: "#DAD5CC", fontSize: 15, lineHeight: 22, marginTop: 16, maxWidth: 430 },
  primary: { marginTop: 24, backgroundColor: colors.white, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between" },
  primaryText: { color: colors.ink, fontWeight: "700" }, arrow: { color: colors.wine, fontSize: 18, fontWeight: "800" },
  sectionTitle: { fontSize: 21, fontWeight: "700", color: colors.ink, marginTop: 28, marginBottom: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, minHeight: 154, flexGrow: 1, flexBasis: 160, borderWidth: 1, borderColor: "#E7E0D5" },
  number: { color: colors.wine, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", marginTop: 34 },
  cardSubtitle: { color: "#6F6B63", fontSize: 13, lineHeight: 18, marginTop: 6 },
  privacy: { color: "#777168", fontSize: 12, textAlign: "center", marginTop: 28 },
});
