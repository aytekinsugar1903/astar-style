import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isLocale, Locale } from "@/i18n/translations";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [displayName, setDisplayName] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");

  const requiredDeletePhrase = locale === "tr" ? "SİL" : "DELETE";
  const localeTag = locale === "tr" ? "tr-TR" : "en-US";
  const deletionConfirmed = deletePhrase.trim().toLocaleUpperCase(localeTag) === requiredDeletePhrase;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }

    void Promise.all([
      supabase.from("profiles").select("display_name,locale").eq("id", session.user.id).maybeSingle(),
      supabase.from("style_profiles").select("style_tags,preferred_colors").eq("user_id", session.user.id).maybeSingle(),
    ]).then(([profile, style]) => {
      if (profile.data?.display_name) setDisplayName(profile.data.display_name);
      if (isLocale(profile.data?.locale)) void setLocale(profile.data.locale);
      if (style.data) {
        setStyleTags(style.data.style_tags);
        setPreferredColors(style.data.preferred_colors);
      }
      const error = profile.error ?? style.error;
      if (error) setMessage(error.message);
    });
  }, [router, session, setLocale]);

  async function save() {
    if (!session) return;
    setBusy(true);
    setMessage("");

    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      display_name: displayName.trim() || null,
      locale,
    });

    setBusy(false);
    setMessage(error ? error.message : t("profileSaved"));
  }

  async function chooseLanguage(nextLocale: Locale) {
    await setLocale(nextLocale);
    setDeletePhrase("");
    if (!session || !isSupabaseConfigured) return;
    const { error } = await supabase.from("profiles").upsert({ id: session.user.id, locale: nextLocale });
    setMessage(error ? error.message : t("languageSaved"));
  }

  async function leave() {
    setBusy(true);
    await signOut();
    router.replace("/sign-in");
  }

  async function deleteAccount() {
    if (!session || !deletionConfirmed) return;
    setBusy(true);
    setMessage("");

    const { data, error } = await supabase.functions.invoke("delete-account", {
      body: { confirmation: "DELETE_MY_ACCOUNT" },
    });

    if (error || !data?.deleted) {
      setBusy(false);
      setMessage(error?.message ?? data?.error ?? t("deleteFailed"));
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    router.replace("/sign-in");
  }

  function confirmDelete() {
    if (!deletionConfirmed) {
      setMessage(t("deletePhraseError", { phrase: requiredDeletePhrase }));
      return;
    }

    Alert.alert(
      t("deleteAlertTitle"),
      t("deleteAlertCopy"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("deleteAlertAction"), style: "destructive", onPress: () => { void deleteAccount(); } },
      ],
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={s.back}>{t("backHome")}</Text>
        </Pressable>

        <Text style={s.kicker}>{t("accountKicker")}</Text>
        <Text style={s.title}>{t("profileTitle")}</Text>
        <Text style={s.copy}>{t("profileCopy")}</Text>

        <View style={s.panel}>
          <Text style={s.label}>{t("displayName")}</Text>
          <TextInput
            style={s.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t("namePlaceholder")}
            autoCapitalize="words"
            accessibilityLabel={t("displayName")}
          />
          <Text style={s.email}>{session?.user.email ?? t("demoUser")}</Text>
          <Pressable style={[s.primary, busy && s.disabled]} onPress={save} disabled={busy || !session} accessibilityRole="button">
            <Text style={s.primaryText}>{busy ? t("saving") : t("saveProfile")}</Text>
          </Pressable>
        </View>

        <View style={s.panel}>
          <Text style={s.sectionTitle}>{t("language")}</Text>
          <View style={s.languageRow}>
            {(["tr", "en"] as const).map((option) => (
              <Pressable
                key={option}
                style={[s.languageButton, locale === option && s.languageButtonActive]}
                onPress={() => { void chooseLanguage(option); }}
                accessibilityRole="button"
                accessibilityState={{ selected: locale === option }}
              >
                <Text style={[s.languageText, locale === option && s.languageTextActive]}>
                  {option === "tr" ? t("turkish") : t("english")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.panel}>
          <Text style={s.sectionTitle}>{t("styleSummary")}</Text>
          <Text style={s.summaryLabel}>{t("styles")}</Text>
          <Text style={s.summary}>{styleTags.length ? styleTags.join(" · ") : t("notSelected")}</Text>
          <Text style={s.summaryLabel}>{t("colors")}</Text>
          <Text style={s.summary}>{preferredColors.length ? preferredColors.join(" · ") : t("notSelected")}</Text>
          <Pressable style={s.secondary} onPress={() => router.push("/onboarding")} accessibilityRole="button">
            <Text style={s.secondaryText}>{t("editStyle")}</Text>
          </Pressable>
        </View>

        {session?.user.app_metadata?.role === "admin" && (
          <Pressable style={s.adminAccess} onPress={() => router.push("/admin")} accessibilityRole="button">
            <Text style={s.adminAccessTitle}>{t("openAdminPanel")}</Text>
            <Text style={s.adminAccessCopy}>{t("openAdminPanelCopy")}</Text>
          </Pressable>
        )}

        <View style={s.privacy}>
          <Text style={s.privacyTitle}>{t("privacyTitle")}</Text>
          <Text style={s.privacyText}>{t("privacyCopy")}</Text>
        </View>

        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}

        <Pressable style={s.signOut} onPress={leave} disabled={busy} accessibilityRole="button">
          <Text style={s.signOutText}>{t("signOut")}</Text>
        </Pressable>

        <View style={s.danger}>
          <Text style={s.dangerTitle}>{t("deleteTitle")}</Text>
          <Text style={s.dangerCopy}>{t("deleteCopy")}</Text>
          {!deleteOpen ? (
            <Pressable style={s.dangerOutline} onPress={() => setDeleteOpen(true)} disabled={busy} accessibilityRole="button">
              <Text style={s.dangerOutlineText}>{t("deleteStart")}</Text>
            </Pressable>
          ) : (
            <View>
              <Text style={s.deleteInstruction}>{t("deleteInstruction", { phrase: requiredDeletePhrase })}</Text>
              <TextInput
                style={s.deleteInput}
                value={deletePhrase}
                onChangeText={setDeletePhrase}
                placeholder={requiredDeletePhrase}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel={t("deleteAccessibility")}
              />
              <Pressable
                style={[s.deleteButton, (busy || !deletionConfirmed) && s.disabled]}
                onPress={confirmDelete}
                disabled={busy || !deletionConfirmed}
                accessibilityRole="button"
              >
                <Text style={s.deleteButtonText}>{busy ? t("processing") : t("deletePermanent")}</Text>
              </Pressable>
              <Pressable onPress={() => { setDeleteOpen(false); setDeletePhrase(""); }} disabled={busy} accessibilityRole="button">
                <Text style={s.cancelDelete}>{t("cancel")}</Text>
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
  languageRow: { flexDirection: "row", gap: 10 },
  languageButton: { flex: 1, borderWidth: 1, borderColor: "#D8D0C3", borderRadius: 999, padding: 13, alignItems: "center" },
  languageButtonActive: { backgroundColor: "#171713", borderColor: "#171713" },
  languageText: { color: "#6E2D3A", fontWeight: "800" },
  languageTextActive: { color: "#FFF" },
  summaryLabel: { color: "#817A72", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 10 },
  summary: { color: "#2B2925", lineHeight: 21, marginTop: 5 },
  secondary: { borderWidth: 1, borderColor: "#D8D0C3", borderRadius: 999, padding: 14, alignItems: "center", marginTop: 20 },
  secondaryText: { color: "#6E2D3A", fontWeight: "800" },
  adminAccess: { backgroundColor: "#171713", borderRadius: 20, padding: 18, marginBottom: 13 },
  adminAccessTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" },
  adminAccessCopy: { color: "#C9C4BC", fontSize: 13, marginTop: 6 },
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
