import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { replyToStyleQuestion, type ClosetPiece, type StyleContext } from "@/stylist/engine";

type Message = { id: string; from: "user" | "stylist"; text: string };
type HumanRequest = { id: string; status: string; stylist_reply: string | null; created_at: string };
export default function StylistScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [closet, setCloset] = useState<ClosetPiece[]>([]);
  const [context, setContext] = useState<StyleContext>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [missingQueries, setMissingQueries] = useState<string[]>([]);
  const [requests, setRequests] = useState<HumanRequest[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    let active = true;
    void Promise.all([
      supabase.from("wardrobe_items").select("id,name,category,colors,style_tags").limit(150),
      supabase.from("stylist_requests").select("id,status,stylist_reply,created_at").order("created_at", { ascending: false }).limit(20),
    ]).then(([items, human]) => {
      if (!active) return;
      if (items.error || human.error) { setMessage(items.error?.message ?? human.error?.message ?? ""); return; }
      setCloset(items.data ?? []);
      setRequests(human.data ?? []);
    });
    return () => { active = false; };
  }, [session]);
  function send() {
    const question = input.trim().slice(0, 500);
    if (!question) return;
    const answer = replyToStyleQuestion(question, closet, context, locale);
    setContext(answer.context); setSelectedIds(answer.selectedIds); setMissingQueries(answer.missingQueries);
    setMessages(current => [...current, { id: `u${Date.now()}`, from: "user", text: question }, { id: `s${Date.now()}`, from: "stylist", text: answer.message }]);
    setInput("");
  }
  async function askHuman() {
    if (!session) { router.push("/sign-in"); return; }
    const lastQuestion = [...messages].reverse().find(entry => entry.from === "user")?.text;
    if (!lastQuestion) { setMessage(t("stylistAskFirst")); return; }
    setBusy(true);
    const result = await supabase.from("stylist_requests").insert({ user_id: session.user.id, request_text: lastQuestion, outfit_item_ids: selectedIds }).select("id,status,stylist_reply,created_at").single();
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    setRequests(current => [result.data, ...current]);
    setMessage(t("stylistHumanQueued"));
  }
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={() => router.back()}><Text style={s.back}>{t("back")}</Text></Pressable>
    <Text style={s.title}>{t("stylistTitle")}</Text><Text style={s.copy}>{t("stylistCopy")}</Text>
    {messages.map(entry => <View key={entry.id} style={[s.bubble, entry.from === "user" ? s.user : s.answer]}><Text style={s.bubbleText}>{entry.text}</Text></View>)}
    <TextInput style={s.input} value={input} onChangeText={setInput} placeholder={t("stylistPlaceholder")} accessibilityLabel={t("stylistPlaceholder")} multiline maxLength={500} />
    <Pressable onPress={send} style={s.button} accessibilityRole="button"><Text style={s.buttonText}>{t("stylistSend")}</Text></Pressable>
    {!!selectedIds.length && <Text style={s.hint}>{t("stylistFromCloset", { count: selectedIds.length })}</Text>}
    {!!missingQueries.length && <Pressable onPress={() => router.push({ pathname: "/products", params: { query: missingQueries[0], budget: String(context.budget ? Math.floor(context.budget / missingQueries.length) : "") } })} style={s.secondary}><Text>{t("stylistSearchMissing")}</Text></Pressable>}
    <Pressable onPress={() => void askHuman()} disabled={busy} style={s.secondary} accessibilityRole="button"><Text>{t("stylistHumanRequest")}</Text></Pressable>
    <Text style={s.hint}>{t("stylistHumanNotice")}</Text>
    {!!message && <Text style={s.hint}>{message}</Text>}
    {requests.map(request => <View key={request.id} style={s.request}><Text style={s.hint}>{request.stylist_reply ? t("stylistHumanAnswered") : t("stylistHumanPending")} · {new Date(request.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}</Text>{!!request.stylist_reply && <Text>{request.stylist_reply}</Text>}</View>)}
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#F5F1E8" }, page: { padding: 22, paddingBottom: 80, maxWidth: 680, alignSelf: "center", width: "100%" }, back: { color: "#6E2D3A", fontWeight: "700", marginTop: 12 }, title: { fontSize: 36, fontWeight: "700", color: "#171713", marginTop: 26 }, copy: { color: "#666158", lineHeight: 21, marginTop: 8, marginBottom: 18 }, bubble: { padding: 16, borderRadius: 18, marginBottom: 10 }, user: { backgroundColor: "#E4D7D8", alignSelf: "flex-end", maxWidth: "90%" }, answer: { backgroundColor: "#FFF", alignSelf: "flex-start", maxWidth: "95%" }, bubbleText: { color: "#28241F", lineHeight: 21 }, input: { backgroundColor: "white", minHeight: 65, borderRadius: 14, borderColor: "#C9BFB0", borderWidth: 1, padding: 12, marginTop: 12 }, button: { backgroundColor: "#171713", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 12 }, buttonText: { color: "white", fontWeight: "800" }, secondary: { borderWidth: 1, borderColor: "#6E2D3A", borderRadius: 999, padding: 14, alignItems: "center", marginTop: 12 }, hint: { marginTop: 12, color: "#615B54", lineHeight: 20 }, request: { backgroundColor: "white", marginTop: 12, padding: 14, borderRadius: 14 } });
