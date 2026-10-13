import {useAppStyles} from '@/studio/theme';
import { useState } from "react";
import { Redirect, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function SignInScreen() {
 const styles=useAppStyles(signInStyles);
  const router = useRouter();
  const { t } = useI18n();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!isSupabaseConfigured) return <Redirect href="/" />;

  async function submit() {
    setMessage("");
    if (!isSupabaseConfigured) { router.replace("/"); return; }
    if (!email.includes("@") || password.length < 8) {
      setMessage(t("authInvalid"));
      return;
    }
    setBusy(true);
    const result = mode === "sign-up"
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (result.data.session) router.replace(mode === "sign-up" ? "/onboarding" : "/");
    else setMessage(t("authVerify"));
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.panel}>
        <Text style={styles.brand}>WEYRA</Text>
        <Text style={styles.title}>{mode === "sign-in" ? t("authWelcome") : t("authCreateTitle")}</Text>
        <Text style={styles.copy}>{t("authCopy")}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t("email")}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          accessibilityLabel={t("email")}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder={t("password")}
          secureTextEntry
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          accessibilityLabel={t("password")}
        />
        {!!message && <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>}
        <Pressable style={[styles.button, busy && styles.disabled]} onPress={submit} disabled={busy} accessibilityRole="button">
          <Text style={styles.buttonText}>{busy ? t("wait") : mode === "sign-in" ? t("signIn") : t("createAccount")}</Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")} accessibilityRole="button">
          <Text style={styles.switch}>{mode === "sign-in" ? t("authSwitchCreate") : t("authSwitchSignIn")}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F5F1E8", justifyContent: "center", padding: 20 },
  panel: { width: "100%", maxWidth: 520, alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 28, padding: 26 },
  brand: { fontSize: 13, fontWeight: "800", letterSpacing: 2, color: "#6E2D3A" },
  title: { fontSize: 36, lineHeight: 40, color: "#171713", marginTop: 28, fontWeight: "600" },
  copy: { fontSize: 15, lineHeight: 22, color: "#69645D", marginTop: 12, marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#DDD5C8", borderRadius: 14, padding: 15, fontSize: 16, marginBottom: 12, backgroundColor: "#FAF8F4" },
  message: { color: "#6E2D3A", marginBottom: 12, lineHeight: 19 },
  button: { backgroundColor: "#171713", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 4 },
  disabled: { opacity: 0.55 }, buttonText: { color: "#FFFFFF", fontWeight: "800" },
  switch: { color: "#6E2D3A", textAlign: "center", marginTop: 20, fontWeight: "700" },
});



const signInStyles=styles;
