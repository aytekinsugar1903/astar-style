import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");

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

  async function deleteAccount() {
    if (!session || deletePhrase.trim().toLocaleUpperCase("tr-TR") !== "SİL") return;
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { confirmation: "DELETE_MY_ACCOUNT" },
    });

    if (error || !data?.deleted) {
      setBusy(false);
      setMessage(error?.message ?? data?.error ?? "Hesap silinemedi.");
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/sign-in");
  }

  function confirmDelete() {
    if (deletePhrase.trim().toLocaleUpperCase("tr-TR") !== "SİL") {
      setMessage("Devam etmek için kutuya SİL yaz.");
      return;
    }

    Alert.alert(
      "Hesap kalıcı olarak silinsin mi?",
      "Fotoğrafların, gardırobun, stil profilin ve kayıtların geri alınamayacak şekilde silinecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Kalıcı olarak sil", style: "destructive", onPress: () => { void deleteAccount(); } },
      ],
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
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
            accessibilityLabel="Görünen ad"
          />
          <Text style={s.email}>{session?.user.email ?? "Demo kullanıcı"}</Text>
          <Pressable style={[s.primary, busy && s.disabled]} onPress={save} disabled={busy || !session} accessibilityRole="button">
            <Text style={s.primaryText}>{busy ? "Kaydediliyor…" : "Profili kaydet"}</Text>
          </Pressable>
        </View>

        <View style={s.panel}>
          <Text style={s.sectionTitle}>Stil özeti</Text>
          <Text style={s.summaryLabel}>Tarzlar</Text>
          <Text style={s.summary}>{styleTags.length ? styleTags.join(" · ") : "Henüz seçilmedi"}</Text>
          <Text style={s.summaryLabel}>Renkler</Text>
          <Text style={s.summary}>{preferredColors.length ? preferredColors.join(" · ") : "Henüz seçilmedi"}</Text>
          <Pressable style={s.secondary} onPress={() => router.push("/onboarding")} accessibilityRole="button">
            <Text style={s.secondaryText}>Stil tercihlerimi düzenle →</Text>
          </Pressable>
        </View>

        <View style={s.privacy}>
          <Text style={s.privacyTitle}>Gizlilik</Text>
          <Text style={s.privacyText}>Fotoğrafların özel depolama alanında tutulur ve izinsiz paylaşılmaz. Gardıroptan sildiğin fotoğraf depolamadan da kaldırılır.</Text>
        </View>

        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}

        <Pressable style={s.signOut} onPress={leave} disabled={busy} accessibilityRole="button">
          <Text style={s.signOutText}>Çıkış yap</Text>
        </Pressable>

        <View style={s.danger}>
          <Text style={s.dangerTitle}>Hesabı ve verileri sil</Text>
          <Text style={s.dangerCopy}>Bu işlem fotoğraflarını, gardırobunu, kombinlerini ve profilini kalıcı olarak kaldırır.</Text>
          {!deleteOpen ? (
            <Pressable style={s.dangerOutline} onPress={() => setDeleteOpen(true)} disabled={busy} accessibilityRole="button">
              <Text style={s.dangerOutlineText}>Hesabımı silmek istiyorum</Text>
            </Pressable>
          ) : (
            <View>
              <Text style={s.deleteInstruction}>Onaylamak için aşağıya SİL yaz.</Text>
              <TextInput
                style={s.deleteInput}
                value={deletePhrase}
                onChangeText={setDeletePhrase}
                placeholder="SİL"
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Hesap silme doğrulaması"
              />
              <Pressable
                style={[s.deleteButton, (busy || deletePhrase.trim().toLocaleUpperCase("tr-TR") !== "SİL") && s.disabled]}
                onPress={confirmDelete}
                disabled={busy || deletePhrase.trim().toLocaleUpperCase("tr-TR") !== "SİL"}
                accessibilityRole="button"
              >
                <Text style={s.deleteButtonText}>{busy ? "İşleniyor…" : "Hesabımı kalıcı olarak sil"}</Text>
              </Pressable>
              <Pressable onPress={() => { setDeleteOpen(false); setDeletePhrase(""); }} disabled={busy}>
                <Text style={s.cancelDelete}>Vazgeç</Text>
              </Pressable>
            </View>
          )}
        </View>
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
  disabled: { opacity: 0.45 },
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
  signOutText: { color: "#6E2D3A", fontWeight: "800" },
  danger: { borderWidth: 1, borderColor: "#D5A8B1", backgroundColor: "#FFF7F8", borderRadius: 20, padding: 18, marginTop: 8 },
  dangerTitle: { color: "#8A1F35", fontSize: 17, fontWeight: "800" },
  dangerCopy: { color: "#704D54", fontSize: 13, lineHeight: 19, marginTop: 7 },
  dangerOutline: { borderWidth: 1, borderColor: "#A73B51", borderRadius: 999, padding: 14, alignItems: "center", marginTop: 16 },
  dangerOutlineText: { color: "#8A1F35", fontWeight: "800" },
  deleteInstruction: { color: "#704D54", fontWeight: "700", marginTop: 16, marginBottom: 8 },
  deleteInput: { borderWidth: 1, borderColor: "#D5A8B1", borderRadius: 13, padding: 13, backgroundColor: "#FFF", fontSize: 16 },
  deleteButton: { backgroundColor: "#9C283D", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 12 },
  deleteButtonText: { color: "#FFF", fontWeight: "800" },
  cancelDelete: { color: "#6B665F", textAlign: "center", padding: 14, fontWeight: "700" },
});
