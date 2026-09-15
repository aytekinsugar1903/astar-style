import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Option = { value: string; label: TranslationKey };

const styleOptions: Option[] = [
  { value: "Minimal", label: "styleMinimal" },
  { value: "Klasik", label: "styleClassic" },
  { value: "Rahat", label: "styleCasual" },
  { value: "Romantik", label: "styleRomantic" },
  { value: "Sokak", label: "styleStreet" },
  { value: "Ofis", label: "styleOffice" },
  { value: "Cesur", label: "styleBold" },
  { value: "Zamansız", label: "styleTimeless" },
];

const colorOptions: Option[] = [
  { value: "Siyah", label: "colorBlack" },
  { value: "Krem", label: "colorCream" },
  { value: "Bordo", label: "colorBurgundy" },
  { value: "Lacivert", label: "colorNavy" },
  { value: "Toprak", label: "colorEarth" },
  { value: "Pastel", label: "colorPastel" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const [tags, setTags] = useState<string[]>([]);
  const [audience, setAudience] = useState<"women" | "men" | "unisex">("unisex");
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;

    void Promise.all([
      supabase.from("style_profiles").select("style_tags,preferred_colors,body_preferences").eq("user_id", session.user.id).maybeSingle(),
      supabase.from("consents").select("granted").eq("user_id", session.user.id).eq("consent_type", "privacy_and_ai_processing").eq("granted", true).limit(1).maybeSingle(),
    ]).then(([style, consent]) => {
      if (style.data) {
        setTags(style.data.style_tags);
        setPreferredColors(style.data.preferred_colors);
        const preferences = style.data.body_preferences;
        if (preferences && typeof preferences === "object" && !Array.isArray(preferences) && (preferences.audience === "women" || preferences.audience === "men" || preferences.audience === "unisex")) setAudience(preferences.audience);
      }
      if (consent.data?.granted) setAccepted(true);
    });
  }, [session]);

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) =>
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  async function save() {
    if (!accepted) { setMessage(t("onboardingConsentRequired")); return; }
    if (tags.length === 0) { setMessage(t("onboardingStyleRequired")); return; }
    if (!isSupabaseConfigured) { router.replace("/wardrobe"); return; }
    if (!session) { router.replace("/sign-in"); return; }

    setBusy(true);
    const [profile, style, consent] = await Promise.all([
      supabase.from("profiles").upsert({ id: session.user.id, locale, onboarding_completed: true }),
      supabase.from("style_profiles").upsert({ user_id: session.user.id, style_tags: tags, preferred_colors: preferredColors, body_preferences: { audience } }),
      supabase.from("consents").insert({ user_id: session.user.id, consent_type: "privacy_and_ai_processing", policy_version: "2026-09-15", granted: true }),
    ]);
    setBusy(false);

    const error = profile.error ?? style.error ?? consent.error;
    if (error) { setMessage(error.message); return; }
    router.replace("/wardrobe");
  }

  function renderOptions(options: Option[], selected: string[], setter: (next: string[]) => void) {
    return options.map((option) => {
      const isSelected = selected.includes(option.value);
      return (
        <Pressable
          key={option.value}
          onPress={() => toggle(option.value, selected, setter)}
          style={[s.chip, isSelected && s.active]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
        >
          <Text style={[s.chipText, isSelected && s.activeText]}>{t(option.label)}</Text>
        </Pressable>
      );
    });
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.step}>{t("onboardingStep")}</Text>
        <Text style={s.title}>{t("onboardingTitle")}</Text>
        <Text style={s.copy}>{t("onboardingCopy")}</Text>
        <Text style={s.label}>{t("audienceQuestion")}</Text>
        <View style={s.chips}>
          {([["women","audienceWomen"],["men","audienceMen"],["unisex","audienceUnisex"]] as const).map(([value,key]) => (
            <Pressable key={value} onPress={() => setAudience(value)} style={[s.chip,audience===value&&s.active]} accessibilityRole="radio" accessibilityState={{checked:audience===value}}>
              <Text style={[s.chipText,audience===value&&s.activeText]}>{t(key)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.label}>{t("onboardingStyleQuestion")}</Text>
        <View style={s.chips}>{renderOptions(styleOptions, tags, setTags)}</View>
        <Text style={s.label}>{t("onboardingColorQuestion")}</Text>
        <View style={s.chips}>{renderOptions(colorOptions, preferredColors, setPreferredColors)}</View>
        <Pressable
          style={s.consent}
          onPress={() => setAccepted(!accepted)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
        >
          <View style={[s.box, accepted && s.boxOn]}><Text style={s.tick}>{accepted ? "✓" : ""}</Text></View>
          <Text style={s.consentText}>{t("onboardingConsent")}</Text>
        </Pressable>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        <Pressable style={[s.button, busy && s.disabled]} onPress={save} disabled={busy} accessibilityRole="button">
          <Text style={s.buttonText}>{busy ? t("saving") : t("onboardingContinue")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:24,paddingBottom:50,width:"100%",maxWidth:680,alignSelf:"center"},
  step:{fontSize:11,fontWeight:"800",letterSpacing:1.6,color:"#6E2D3A",marginTop:16},title:{fontSize:38,lineHeight:42,fontWeight:"600",color:"#171713",marginTop:18},
  copy:{fontSize:15,lineHeight:22,color:"#69645D",marginTop:12},label:{fontSize:17,fontWeight:"700",color:"#171713",marginTop:30,marginBottom:12},
  chips:{flexDirection:"row",flexWrap:"wrap",gap:9},chip:{borderWidth:1,borderColor:"#CEC5B7",borderRadius:999,paddingVertical:11,paddingHorizontal:15,backgroundColor:"#FFF"},
  active:{backgroundColor:"#171713",borderColor:"#171713"},chipText:{color:"#33312D",fontWeight:"600"},activeText:{color:"#FFF"},
  consent:{flexDirection:"row",alignItems:"flex-start",marginTop:30,gap:12},box:{width:24,height:24,borderRadius:7,borderWidth:1,borderColor:"#9F978A",alignItems:"center",justifyContent:"center"},
  boxOn:{backgroundColor:"#6E2D3A",borderColor:"#6E2D3A"},tick:{color:"#FFF",fontWeight:"900"},consentText:{flex:1,color:"#5E5952",lineHeight:20,fontSize:13},
  message:{color:"#6E2D3A",marginTop:14},button:{backgroundColor:"#6E2D3A",borderRadius:999,padding:17,alignItems:"center",marginTop:24},buttonText:{color:"#FFF",fontWeight:"800"},
  disabled:{opacity:.5},
});
