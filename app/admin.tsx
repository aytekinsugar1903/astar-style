import {useAppStyles,useTheme} from '@/studio/theme';
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  stylistRequests?: Array<{ id: string; request_text: string; created_at: string }>;
};

const demo: Metrics = {
  users: 0, products: 4, tryOnCount: 0, affiliateClicks: 0, aiCostUsd: 0,
  failedAiCalls: 0, aiCalls24h: 0, aiCost24hUsd: 0, limited24h: 0,
  dau: 0, mau: 0, retention7dPct: 0, avgSessionSeconds30d: 0,
  screenViews30d: 0, productClicks30d: 0, productSaves30d: 0, clientErrors24h: 0,
};

export default function AdminScreen() {const s=useAppStyles(baseStyles);

  const router = useRouter();
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<Metrics>(demo);
  const [message, setMessage] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.functions.invoke("admin-dashboard").then(({ data, error }) => {
      if (error) setMessage(t("adminOnly"));
      else setMetrics({ ...demo, ...data });
    });
  }, [t]);

  async function syncCatalog() {
    setSyncBusy(true);
    setSyncMessage("");
    const { data, error } = await supabase.functions.invoke("catalog-sync", { body: {} });
    if (error) setSyncMessage(t("catalogSyncFailed"));
    else {
      setSyncMessage(t("catalogSyncDone", { count: data.productsUpserted ?? 0 }));
      setMetrics((value) => ({ ...value, products: data.productsUpserted ?? value.products }));
    }
    setSyncBusy(false);
  }
  async function sendReply(id: string) {
    const reply = replies[id]?.trim();
    if (!reply) return;
    const result = await supabase.functions.invoke("stylist-reply", { body: { requestId: id, reply } });
    if (result.error) { setMessage(t("adminReplyFailed")); return; }
    setMetrics(current => ({ ...current, stylistRequests: current.stylistRequests?.filter(request => request.id !== id) }));
  }

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
        <Text style={s.title}>WEYRA Control</Text>
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
        <Text style={s.syncTitle}>{t("adminHumanQueue")}</Text>
        {(metrics.stylistRequests ?? []).map(request => <View key={request.id} style={s.sync}>
          <Text style={s.syncCopy}>{request.request_text}</Text>
          <TextInput style={s.replyInput} multiline value={replies[request.id] ?? ""} maxLength={2000} onChangeText={value => setReplies(current => ({ ...current, [request.id]: value }))} placeholder={t("adminReplyPlaceholder")} accessibilityLabel={t("adminReplyPlaceholder")} />
          <Pressable style={s.syncButton} onPress={() => void sendReply(request.id)} accessibilityRole="button"><Text style={s.syncButtonText}>{t("adminReplySend")}</Text></Pressable>
        </View>)}
        <View style={s.sync}>
          <Text style={s.syncTitle}>{t("catalogSyncTitle")}</Text>
          <Text style={s.syncCopy}>{t("catalogSyncCopy")}</Text>
          <Pressable style={[s.syncButton, syncBusy && s.disabled]} onPress={() => void syncCatalog()} disabled={syncBusy} accessibilityRole="button">
            <Text style={s.syncButtonText}>{syncBusy ? t("catalogSyncRunning") : t("catalogSyncAction")}</Text>
          </Pressable>
          {!!syncMessage && <Text style={s.syncMessage} accessibilityLiveRegion="polite">{syncMessage}</Text>}
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
 replyInput:{backgroundColor:"#FFF",color:"#171713",minHeight:88,borderRadius:12,padding:12,marginTop:12},
 safe:{flex:1,backgroundColor:"#171713"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:850,alignSelf:"center"},back:{color:"#DCC7CA",fontWeight:"700",marginTop:12},kicker:{fontSize:11,color:"#C99AA3",fontWeight:"800",letterSpacing:1.8,marginTop:30},title:{fontSize:40,color:"#FFF",fontWeight:"600",marginTop:12},copy:{color:"#BDB7AE",marginTop:8},message:{color:"#F3B9C4",marginTop:15},
 grid:{flexDirection:"row",flexWrap:"wrap",gap:12,marginTop:26},card:{backgroundColor:"#292925",borderRadius:20,padding:20,minHeight:130,flexGrow:1,flexBasis:145},value:{color:"#FFF",fontSize:28,fontWeight:"800"},label:{color:"#BDB7AE",marginTop:28},
 sync:{backgroundColor:"#292925",borderRadius:22,padding:22,marginTop:20,borderWidth:1,borderColor:"#45453E"},syncTitle:{color:"#FFF",fontSize:18,fontWeight:"800"},syncCopy:{color:"#BDB7AE",lineHeight:20,marginTop:8},syncButton:{backgroundColor:"#FFF",borderRadius:999,padding:14,alignItems:"center",marginTop:16},syncButtonText:{color:"#171713",fontWeight:"800"},syncMessage:{color:"#E8C7CD",fontWeight:"700",marginTop:12},disabled:{opacity:.5},guard:{backgroundColor:"#6E2D3A",borderRadius:22,padding:22,marginTop:20},guardTitle:{color:"#FFF",fontSize:18,fontWeight:"800"},guardCopy:{color:"#F0DDE1",lineHeight:20,marginTop:8},
});


const baseStyles=s;
