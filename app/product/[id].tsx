import { useEffect, useState } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { localizeProduct } from "@/catalog/localize";
import { mockProducts } from "@/catalog/mock-products";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { track } from "@/analytics/track";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const sourceProduct = mockProducts.find((item) => item.id === id);
  const product = sourceProduct ? localizeProduct(sourceProduct, locale) : undefined;
  const [dbProductId, setDbProductId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!sourceProduct || !isSupabaseConfigured) return;
    let active = true;

    void supabase.from("products")
      .select("id")
      .eq("external_id", sourceProduct.id)
      .eq("source", "demo")
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) { setMessage(error.message); return; }

        setDbProductId(data?.id ?? null);
        if (!data || !session) return;

        const favorite = await supabase.from("favorites")
          .select("product_id")
          .eq("user_id", session.user.id)
          .eq("product_id", data.id)
          .maybeSingle();

        if (active) setSaved(Boolean(favorite.data));
      });

    return () => { active = false; };
  }, [sourceProduct, session]);

  async function toggleSaved() {
    if (!session) { router.push("/sign-in"); return; }
    if (!dbProductId) { setMessage(t("productNotReady")); return; }

    setBusy(true);
    setMessage("");
    const result = saved
      ? await supabase.from("favorites").delete().eq("user_id", session.user.id).eq("product_id", dbProductId)
      : await supabase.from("favorites").upsert({ user_id: session.user.id, product_id: dbProductId });

    if (result.error) setMessage(result.error.message);
    else {
      setSaved(!saved);
      void track(saved ? "product_unsaved" : "product_saved", { product_id: dbProductId });
      setMessage(saved ? t("productRemoved") : t("productSaved"));
    }
    setBusy(false);
  }

  async function openMerchant() {
    if (!sourceProduct) return;

    if (session && dbProductId) {
      await supabase.from("affiliate_clicks").insert({ user_id: session.user.id, product_id: dbProductId });
    }

    void track("product_click", { external_id: sourceProduct.id, product_id: dbProductId });
    await Linking.openURL(sourceProduct.affiliateUrl ?? sourceProduct.productUrl);
  }

  if (!product || !sourceProduct) {
    return <SafeAreaView style={s.safe}><Text style={s.notFound}>{t("productNotFound")}</Text></SafeAreaView>;
  }

  const localeTag = locale === "tr" ? "tr-TR" : "en-US";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("backToProducts")}</Text></Pressable>
        <View style={[s.visual, { backgroundColor: sourceProduct.color === "Siyah" ? "#222" : sourceProduct.color === "Bordo" ? "#6E2D3A" : "#E7DFD0" }]}>
          <Text style={s.visualText}>ASTRA STYLE</Text>
        </View>
        <Text style={s.brand}>{product.brand}</Text>
        <Text style={s.title}>{product.name}</Text>
        <Text style={s.meta}>{product.category} · {product.color} · {t("styleMatch", { score: product.styleScore })}</Text>
        <Text style={s.price}>{product.price.toLocaleString(localeTag)} TL</Text>
        <Text style={s.status}>{product.inStock ? t("inStock") : t("outOfStock")} · {t("demoProduct")}</Text>

        <Pressable style={[s.save, busy && s.disabled]} onPress={toggleSaved} disabled={busy} accessibilityRole="button">
          <Text style={s.saveText}>{saved ? t("saved") : t("save")}</Text>
        </Pressable>

        <Pressable disabled={!product.inStock} style={[s.button, !product.inStock && s.disabled]} onPress={openMerchant} accessibilityRole="link">
          <Text style={s.buttonText}>{t("goToMerchant")}</Text>
        </Pressable>

        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        <Pressable onPress={() => router.push("/favorites")} accessibilityRole="button"><Text style={s.savedLink}>{t("seeMySaved")}</Text></Pressable>
        <Text style={s.note}>{t("merchantNotice")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F1E8" },
  page: { padding: 22, paddingBottom: 50, width: "100%", maxWidth: 620, alignSelf: "center" },
  back: { color: "#6E2D3A", fontWeight: "700", marginTop: 12 },
  visual: { height: 300, borderRadius: 28, marginTop: 24, alignItems: "center", justifyContent: "center" },
  visualText: { color: "#FFF", fontWeight: "800", letterSpacing: 2 },
  brand: { fontSize: 12, color: "#746E65", letterSpacing: 1.3, marginTop: 25, textTransform: "uppercase" },
  title: { fontSize: 32, fontWeight: "600", color: "#171713", marginTop: 8 },
  meta: { color: "#706A62", marginTop: 10 },
  price: { fontSize: 25, fontWeight: "800", marginTop: 20 },
  status: { color: "#6E2D3A", fontWeight: "700", marginTop: 8 },
  save: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#CFC6B8", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 22 },
  saveText: { color: "#6E2D3A", fontWeight: "800" },
  button: { backgroundColor: "#171713", borderRadius: 999, padding: 17, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#FFF", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  message: { color: "#6E2D3A", textAlign: "center", fontWeight: "700", marginTop: 14 },
  savedLink: { color: "#6E2D3A", textAlign: "center", fontWeight: "800", marginTop: 18 },
  note: { fontSize: 11, lineHeight: 17, color: "#777168", textAlign: "center", marginTop: 16 },
  notFound: { margin: "auto" },
});
