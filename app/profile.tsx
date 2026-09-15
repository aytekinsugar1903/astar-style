import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }

    void Promise.all([
      supabase.from("profiles").select("display_name").eq("id", session.user.id).maybeSingle(),
      supabase.from("style_profiles").select("style_tags,preferred_colors").eq("user_id", session.user.id).maybeSingle(),
    ]).then(([profile, style]) => {
      if (profile.data?.display_name) setDisplayName(profile.data.display_name);
      if (style.data) {
        setStyleTags(style.data.style_tags);
        setPreferredColors(style.data.preferred_colors);
      }
      const error = profile.error ?? style.error;
      if (error) setMessage(error.message);
    });
  }, [router, session]);

  async function save() {
    if (!session) return;
    setBusy(true);
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      display_name: displayName.trim() || null,
      locale: "tr",
    });

    setBusy(false);
    setMessage(error ? error.message : "Profilin kaydedildi.");
  }

  async function leave() {
    setBusy(true);
    await signOut();
    router.replace("/sign-in");
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>← Ana sayfa</Text>
        </Pressable>

        <Text style={s.kicker}>HESABIM</Text>
        <Text style={s.title}>Profilim</Text>
        <Text style={s.copy}>Stil profilin ve özel gardırobun yalnızca hesabına bağlıdır.</Text>

        <View style={s.panel}>
          <Text style={s.label}>Görünen ad</Text>
          <TextInput
            style={s.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Adın"
            autoCapitalize="words"
          />
          <Text style={s.email}>{session?.user.email ?? "Demo kullanıcı"}</Text>
          <Pressable style={[s.primary, busy && s.disabled]} onPress={save} disabled={busy || !session}>
            <Text style={s.primaryText}>{busy ? "Kaydediliyor…" : "Profili kaydet"}</Text>
          </Pressable>
        </View>

        <View style={s.panel}>
          <Text style={s.sectionTitle}>Stil özeti</Text>
          <Text style={s.summaryLabel}>Tarzlar</Text>
          <Text style={s.summary}>{styleTags.length ? styleTags.join(" · ") : "Henüz seçilmedi"}</Text>
          <Text style={s.summaryLabel}>Renkler</Text>
          <Text style={s.summary}>{preferredColors.length ? preferredColors.join(" · ") : "Henüz seçilmedi"}</Text>
          <Pressable style={s.secondary} onPress={() => router.push("/onboarding")}>
            <Text style={s.secondaryText}>Stil tercihlerimi düzenle →</Text>
          </Pressable>
        </View>

        <View style={s.privacy}>
          <Text style={s.privacyTitle}>Gizlilik</Text>
          <Text style={s.privacyText}>Fotoğrafların özel depolama alanında tutulur ve izinsiz paylaşılmaz. Gardıroptan sildiğin fotoğraf depolamadan da kaldırılır.</Text>
        </View>

        {!!message && <Text style={s.message}>{message}</Text>}

        <Pressable style={s.signOut} onPress={leave} disabled={busy}>
          <Text style={s.signOutText}>Çıkış yap</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F1E8" },
  page: { padding: 22, paddingBottom: 50, width: "100%", maxWidth: 680, alignSelf: "center" },
  back: { color: "#6E2D3A", fontWeight: "700", marginTop: 12 },
  kicker: { fontSize: 11, fontWeight: "800", letterSpacing: 1.8, color: "#6E2D3A", marginTop: 30 },
  title: { fontSize: 40, fontWeight: "600", color: "#171713", marginTop: 12 },
  copy: { color: "#6B665F", lineHeight: 21, marginTop: 9, marginBottom: 22 },
  panel: { backgroundColor: "#FFF", borderRadius: 22, padding: 20, marginBottom: 13 },
  label: { color: "#171713", fontWeight: "700", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#D8D0C3", borderRadius: 14, padding: 14, fontSize: 16, backgroundColor: "#FAF8F4" },
  email: { color: "#777168", fontSize: 13, marginTop: 10 },
  primary: { backgroundColor: "#171713", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 18 },
  primaryText: { color: "#FFF", fontWeight: "800" },
  disabled: { opacity: 0.5 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#171713", marginBottom: 14 },
  summaryLabel: { color: "#817A72", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 10 },
  summary: { color: "#2B2925", lineHeight: 21, marginTop: 5 },
  secondary: { borderWidth: 1, borderColor: "#D8D0C3", borderRadius: 999, padding: 14, alignItems: "center", marginTop: 20 },
  secondaryText: { color: "#6E2D3A", fontWeight: "800" },
  privacy: { borderWidth: 1, borderColor: "#CFC6B8", borderRadius: 20, padding: 18, marginTop: 2 },
  privacyTitle: { color: "#171713", fontWeight: "800" },
  privacyText: { color: "#6B665F", fontSize: 13, lineHeight: 19, marginTop: 7 },
  message: { color: "#6E2D3A", fontWeight: "700", textAlign: "center", marginTop: 16 },
  signOut: { padding: 16, alignItems: "center", marginTop: 12 },
  signOutText: { color: "#9C283D", fontWeight: "800" },
});
