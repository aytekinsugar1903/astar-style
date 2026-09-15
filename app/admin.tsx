import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Metrics = {
  users: number;
  products: number;
  tryOnCount: number;
  affiliateClicks: number;
  aiCostUsd: number;
  failedAiCalls: number;
  aiCalls24h: number;
  aiCost24hUsd: number;
  limited24h: number;
  dau: number;
  mau: number;
  retention7dPct: number;
  avgSessionSeconds30d: number;
  screenViews30d: number;
  productClicks30d: number;
  productSaves30d: number;
  clientErrors24h: number;
};

const demo: Metrics = {
  users: 0, products: 4, tryOnCount: 0, affiliateClicks: 0, aiCostUsd: 0,
  failedAiCalls: 0, aiCalls24h: 0, aiCost24hUsd: 0, limited24h: 0,
  dau: 0, mau: 0, retention7dPct: 0, avgSessionSeconds30d: 0,
  screenViews30d: 0, productClicks30d: 0, productSaves30d: 0, clientErrors24h: 0,
};

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<Metrics>(demo);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.functions.invoke("admin-dashboard").then(({ data, error }) => {
      if (error) setMessage(t("adminOnly"));
      else setMetrics({ ...demo, ...data });
    });
  }, [t]);

  const cards = [
    [t("adminDau"), metrics.dau],
    [t("adminMau"), metrics.mau],
    [t("adminRetention"), `%${metrics.retention7dPct.toFixed(1)}`],
    [t("adminSession"), t("adminSeconds", { count: Math.round(metrics.avgSessionSeconds30d) })],
    [t("adminScreenViews"), metrics.screenViews30d],
    [t("adminProductClicks30d"), metrics.productClicks30d],
    [t("adminProductSaves30d"), metrics.productSaves30d],
    [t("adminClientErrors24h"), metrics.clientErrors24h],
    [t("adminUser"), metrics.users],
    [t("adminProduct"), metrics.products],
    [t("adminTryOn"), metrics.tryOnCount],
    [t("adminAffiliateClick"), metrics.affiliateClicks],
    [t("adminAiCost"), `$${metrics.aiCostUsd.toFixed(4)}`],
    [t("adminFailedAi"), metrics.failedAiCalls],
    [t("adminAiCalls24h"), metrics.aiCalls24h],
    [t("adminAiCost24h"), `$${metrics.aiCost24hUsd.toFixed(4)}`],
    [t("adminLimited24h"), metrics.limited24h],
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
        <Text style={s.kicker}>{t("adminKicker")}</Text>
        <Text style={s.title}>ASTRA Control</Text>
        <Text style={s.copy}>{t("adminCopy")}</Text>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        <View style={s.grid}>
          {cards.map(([label, value]) => (
            <View key={String(label)} style={s.card}>
              <Text style={s.value}>{value}</Text>
              <Text style={s.label}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={s.guard}>
          <Text style={s.guardTitle}>{t("costGuardTitle")}</Text>
          <Text style={s.guardCopy}>{t("costGuardCopy")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#171713"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:850,alignSelf:"center"},back:{color:"#DCC7CA",fontWeight:"700",marginTop:12},kicker:{fontSize:11,color:"#C99AA3",fontWeight:"800",letterSpacing:1.8,marginTop:30},title:{fontSize:40,color:"#FFF",fontWeight:"600",marginTop:12},copy:{color:"#BDB7AE",marginTop:8},message:{color:"#F3B9C4",marginTop:15},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:12,marginTop:26},card:{backgroundColor:"#292925",borderRadius:20,padding:20,minHeight:130,flexGrow:1,flexBasis:145},value:{color:"#FFF",fontSize:28,fontWeight:"800"},label:{color:"#BDB7AE",marginTop:28},
 guard:{backgroundColor:"#6E2D3A",borderRadius:22,padding:22,marginTop:20},guardTitle:{color:"#FFF",fontSize:18,fontWeight:"800"},guardCopy:{color:"#F0DDE1",lineHeight:20,marginTop:8},
});
