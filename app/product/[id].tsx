import {useAppStyles,useTheme} from '@/studio/theme';
import { useEffect, useState } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { localizeProduct } from "@/catalog/localize";
import { productColor } from "@/catalog/color";
import { mockProducts } from "@/catalog/mock-products";
import { loadCatalog } from "@/catalog/repository";
import type { CatalogProduct } from "@/catalog/types";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { track } from "@/analytics/track";

import {useImportedCatalog,catalogProduct} from '@/catalog/imported';
import {photoCatalog} from '@/catalog/photo-catalog';
export default function ProductDetailScreen() {const s=useAppStyles(baseStyles);

  const imported=useImportedCatalog();
  const [variantId,setVariantId]=useState("");
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const [sourceProduct, setSourceProduct] = useState<CatalogProduct | undefined>(() => [...photoCatalog,...mockProducts].find((item) => item.id === id));
  const [dbProductId, setDbProductId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(()=>{setVariantId("");setSourceProduct([...photoCatalog,...mockProducts].find(p=>p.id===id));},[id]);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void loadCatalog()
      .then(async (items) => {
        if (!active) return;
        const found = items.find((item) => item.id === id);
        if (!found) return;
        setSourceProduct(found);
        setDbProductId(found.dbId ?? null);
        if (!found.dbId || !session) return;
        const favorite = await supabase.from("favorites")
          .select("product_id")
          .eq("user_id", session.user.id)
          .eq("product_id", found.dbId)
          .maybeSingle();
        if (active) setSaved(Boolean(favorite.data));
      })
      .catch(() => { if (active) setMessage(t("catalogFallback")); });
    return () => { active = false; };
  }, [id, session, t]);

  const importedProduct=imported.products.find(p=>p.id===id);
  const current=importedProduct?catalogProduct(importedProduct):sourceProduct;
  const variant=current?.variants?.find(v=>v.id===variantId)??current?.variants?.find(v=>v.inStock)??current?.variants?.[0];
  const effective=current&&variant?{...current,color:variant.color,imageUrl:variant.imageUrl,price:variant.price??0,priceKnown:variant.price!==undefined,currency:variant.currency,inStock:variant.inStock===true,stockKnown:variant.inStock!==undefined,productUrl:variant.productUrl}:current;
  const product = effective ? localizeProduct(effective, locale) : undefined;

  async function toggleSaved() {
    if (!isSupabaseConfigured) return;
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
    if (!effective) return;
    if (session && dbProductId) {
      await supabase.from("affiliate_clicks").insert({ user_id: session.user.id, product_id: dbProductId });
    }
    void track("product_click", { external_id: effective.id, product_id: dbProductId });
    await Linking.openURL(effective.affiliateUrl ?? effective.productUrl);
  }

  if (!product || !effective) {
    return <SafeAreaView style={s.safe}><Text style={s.notFound}>{t("productNotFound")}</Text></SafeAreaView>;
  }

  const localeTag = locale === "tr" ? "tr-TR" : "en-US";
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("backToProducts")}</Text></Pressable>
        <View style={[s.visual, { backgroundColor: productColor(effective.color) }]}>
          {(effective.imageUrl||effective.photoSource)?<Image source={effective.imageUrl?{uri:effective.imageUrl}:effective.photoSource!} style={{width:"100%",height:"100%"}} resizeMode="contain"/>:<Text style={s.visualText}>WEYRA</Text>}
        </View>
        <Text style={s.brand}>{product.brand}</Text>
        <Text style={s.title}>{product.name}</Text>
        <Text style={s.meta}>{product.category} · {product.color}{product.styleScoreKnown!==false?" · "+t("styleMatch", { score: product.styleScore }):""}</Text>
        {!!variant&&<><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:16}}>{[...new Set(current?.variants?.map(v=>v.color))].map(color=><Pressable key={color} accessibilityRole="button" accessibilityState={{selected:variant.color===color}} onPress={()=>setVariantId(current!.variants!.find(v=>v.color===color)!.id)} style={[s.save,{marginTop:0,padding:12,borderWidth:variant.color===color?2:1}]}><Text>{color||t('catalogColorUnknown')}</Text></Pressable>)}</View><View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12}}>{current?.variants?.filter(v=>v.color===variant.color).map(v=><Pressable key={v.id} accessibilityRole="button" accessibilityState={{selected:variant.id===v.id}} onPress={()=>setVariantId(v.id)} style={[s.save,{marginTop:0,padding:12,borderWidth:variant.id===v.id?2:1}]}><Text>{v.size||t('catalogSizeUnknown')} {v.inStock===false?'×':''}</Text></Pressable>)}</View>{variant.images.length>1&&<ScrollView horizontal contentContainerStyle={{gap:12,paddingTop:14}}>{variant.images.map(uri=><Image key={uri} source={{uri}} style={{width:130,height:150}} resizeMode="contain"/>)}</ScrollView>}</>}
        <Text style={s.price}>{product.priceKnown===false?t("catalogPriceUnknown"):product.price.toLocaleString(localeTag)+" "+(locale === "tr" && product.currency === "TRY" ? "TL" : product.currency)}</Text>
        <Text style={s.status}>{t(product.stockKnown===false?"catalogStockUnknown":product.inStock?"inStock":"outOfStock")} · {t(effective.source==="imported"?"catalogImportedLabel":effective.source==="open-photo"?"catalogPhotoLabel":effective.source === "demo" || !effective.source ? "demoProduct" : "officialCatalogProduct")}</Text>
        {(variant||effective.source==='open-photo')&&<><Pressable style={s.button} onPress={()=>router.push({pathname:'/avatar',params:{piece:variant?.id??effective.id}})}><Text style={s.buttonText}>{t('catalogDress')}</Text></Pressable><Text style={s.note}>{t(variant?.wearable?'catalog3dAssetNotice':'catalogApproxNotice')}</Text></>}
        {!!effective.license&&<Text style={s.note}>{effective.credit} · {effective.license}</Text>}
        {isSupabaseConfigured && <Pressable style={[s.save, busy && s.disabled]} onPress={toggleSaved} disabled={busy} accessibilityRole="button">
          <Text style={s.saveText}>{saved ? t("saved") : t("save")}</Text>
        </Pressable>}
        <Pressable disabled={product.stockKnown!==false&&!product.inStock} style={[s.button, product.stockKnown!==false&&!product.inStock && s.disabled]} onPress={openMerchant} accessibilityRole="link">
          <Text style={s.buttonText}>{t(effective.source==='open-photo'?"catalogOpenSource":"goToMerchant")}</Text>
        </Pressable>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        {isSupabaseConfigured && <Pressable onPress={() => router.push("/favorites")} accessibilityRole="button"><Text style={s.savedLink}>{t("seeMySaved")}</Text></Pressable>}
        <Text style={s.note}>{t("merchantNotice")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F1E8" }, page: { padding: 22, paddingBottom: 50, width: "100%", maxWidth: 620, alignSelf: "center" }, back: { color: "#6E2D3A", fontWeight: "700", marginTop: 12 },
  visual: { height: 300, borderRadius: 28, marginTop: 24, alignItems: "center", justifyContent: "center" }, visualText: { color: "#FFF", fontWeight: "800", letterSpacing: 2 },
  brand: { fontSize: 12, color: "#746E65", letterSpacing: 1.3, marginTop: 25, textTransform: "uppercase" }, title: { fontSize: 32, fontWeight: "600", color: "#171713", marginTop: 8 },
  meta: { color: "#706A62", marginTop: 10 }, price: { fontSize: 25, fontWeight: "800", marginTop: 20 }, status: { color: "#6E2D3A", fontWeight: "700", marginTop: 8 },
  save: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#CFC6B8", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 22 }, saveText: { color: "#6E2D3A", fontWeight: "800" },
  button: { backgroundColor: "#171713", borderRadius: 999, padding: 17, alignItems: "center", marginTop: 10 }, buttonText: { color: "#FFF", fontWeight: "800" }, disabled: { opacity: 0.45 },
  message: { color: "#6E2D3A", textAlign: "center", fontWeight: "700", marginTop: 14 }, savedLink: { color: "#6E2D3A", textAlign: "center", fontWeight: "800", marginTop: 18 },
  note: { fontSize: 11, lineHeight: 17, color: "#777168", textAlign: "center", marginTop: 16 }, notFound: { margin: "auto" },
});


const baseStyles=s;
