import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function SignInScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setMessage("");
    if (!isSupabaseConfigured) { router.replace("/"); return; }
    if (!email.includes("@") || password.length < 8) {
      setMessage("Geçerli bir e-posta ve en az 8 karakterli şifre gir.");
      return;
    }
    setBusy(true);
    const result = mode === "sign-up"
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (result.data.session) router.replace(mode === "sign-up" ? "/onboarding" : "/");
    else setMessage("Hesabını doğrulamak için e-postandaki bağlantıya dokun.");
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.panel}>
        <Text style={styles.brand}>ASTRA STYLE</Text>
        <Text style={styles.title}>{mode === "sign-in" ? "Tekrar hoş geldin." : "Stil alanını oluştur."}</Text>
        <Text style={styles.copy}>Gardırobun, kombinlerin ve stil profilin yalnızca sana özel.</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="E-posta" autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Şifre · en az 8 karakter" secureTextEntry />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <Pressable style={[styles.button, busy && styles.disabled]} onPress={submit} disabled={busy}>
          <Text style={styles.buttonText}>{busy ? "Bekle…" : mode === "sign-in" ? "Giriş yap" : "Hesap oluştur"}</Text>
        </Pressable>
        <Pressable onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
          <Text style={styles.switch}>{mode === "sign-in" ? "Yeni misin? Hesap oluştur" : "Zaten hesabın var mı? Giriş yap"}</Text>
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
