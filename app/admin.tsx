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
};

const demo: Metrics = { users: 0, products: 4, tryOnCount: 0, affiliateClicks: 0, aiCostUsd: 0, failedAiCalls: 0 };

export default function AdminScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<Metrics>(demo);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.functions.invoke("admin-dashboard").then(({ data, error }) => {
      if (error) setMessage(t("adminOnly"));
      else setMetrics(data);
    });
  }, [t]);

  const cards = [
    [t("adminUser"), metrics.users],
    [t("adminProduct"), metrics.products],
    [t("adminTryOn"), metrics.tryOnCount],
    [t("adminAffiliateClick"), metrics.affiliateClicks],
    [t("adminAiCost"), `$${metrics.aiCostUsd.toFixed(4)}`],
    [t("adminFailedAi"), metrics.failedAiCalls],
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
