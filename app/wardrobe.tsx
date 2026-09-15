import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translations";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { functionErrorKey } from "@/lib/function-error";
import { uploadWardrobeImage } from "@/wardrobe/upload";
import { track } from "@/analytics/track";

type Item = {
  id: string;
  name: string | null;
  category: string;
  colors: string[];
  image_path: string;
  imageUrl?: string;
};

const demoItems: Item[] = [
  { id: "1", name: "Siyah gece elbisesi", category: "dress", colors: ["Siyah"], image_path: "" },
  { id: "2", name: "Krem blazer", category: "jacket", colors: ["Krem"], image_path: "" },
];

const categoryKeys: Record<string, TranslationKey> = {
  dress: "categoryDress",
  pants: "categoryPants",
  skirt: "categorySkirt",
  shirt: "categoryShirt",
  tshirt: "categoryTshirt",
  "t-shirt": "categoryTshirt",
  jacket: "categoryJacket",
  shoes: "categoryShoes",
  bag: "categoryBag",
  accessory: "categoryAccessory",
  other: "categoryOther",
};

export default function WardrobeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const [items, setItems] = useState<Item[]>(isSupabaseConfigured ? [] : demoItems);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !session) return;

    const { data, error } = await supabase
      .from("wardrobe_items")
      .select("id,name,category,colors,image_path")
      .order("created_at", { ascending: false });

    if (error) { setMessage(error.message); return; }

    const hydrated = await Promise.all((data ?? []).map(async (item) => {
      const signed = await supabase.storage.from("user-photos").createSignedUrl(item.image_path, 3600);
      return { ...item, imageUrl: signed.data?.signedUrl };
    }));
    setItems(hydrated);
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  function itemName(item: Item) {
    if (item.id === "1") return t("demoDressName");
    if (item.id === "2") return t("demoBlazerName");
    if (item.name === "Yeni kıyafet") return t("newGarment");
    if (item.name === "Yeni parça") return t("newItem");
    return item.name ?? t("unnamedItem");
  }

  function categoryName(category: string) {
    const key = categoryKeys[category.toLocaleLowerCase("en-US")];
    return key ? t(key) : category;
  }

  function colorName(color: string) {
    const keys: Record<string, TranslationKey> = {
      Siyah: "colorBlack", Krem: "colorCream", Bordo: "colorBurgundy",
      Lacivert: "colorNavy", Toprak: "colorEarth", Pastel: "colorPastel",
    };
    return keys[color] ? t(keys[color]) : color;
  }

  async function addItem() {
    if (!isSupabaseConfigured) {
      setMessage(t("demoGarmentAdded"));
      setItems((value) => [{ id: String(Date.now()), name: "Yeni parça", category: "other", colors: [], image_path: "" }, ...value]);
      return;
    }
    if (!session) { router.replace("/sign-in"); return; }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setMessage(t("galleryPermissionWardrobe")); return; }

    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.82, allowsEditing: true });
    if (picked.canceled) return;

    setBusy(true);
    setMessage(t("secureUploading"));
    let uploadedPath: string | null = null;

    try {
      const asset = picked.assets[0];
      uploadedPath = await uploadWardrobeImage(session.user.id, asset.uri, asset.mimeType ?? "image/jpeg");

      const { data: item, error } = await supabase.from("wardrobe_items").insert({
        user_id: session.user.id,
        name: "Yeni kıyafet",
        category: "other",
        image_path: uploadedPath,
      }).select("id").single();
      if (error) throw error;

      const classified = await supabase.functions.invoke("classify-garment", {
        body: { wardrobeItemId: item.id, locale },
      });

      void track("wardrobe_item_added", { wardrobe_item_id: item.id });
      if (classified.error) {
        const errorMessage = t(await functionErrorKey(classified.error, "garment_classification"));
        setMessage(`${t("garmentAnalysisPending")} ${errorMessage}`);
      } else {
        setMessage(t("garmentAnalyzed"));
      }
      await load();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("user-photos").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: Item) {
    if (!isSupabaseConfigured) {
      setItems((value) => value.filter((entry) => entry.id !== item.id));
      setMessage(t("demoGarmentRemoved"));
      return;
    }
    if (!session) { router.replace("/sign-in"); return; }

    setDeletingId(item.id);
    setMessage("");

    try {
      const removed = await supabase.storage.from("user-photos").remove([item.image_path]);
      if (removed.error) throw removed.error;

      const deleted = await supabase.from("wardrobe_items").delete().eq("id", item.id).eq("user_id", session.user.id);
      if (deleted.error) throw deleted.error;

      setItems((value) => value.filter((entry) => entry.id !== item.id));
      void track("wardrobe_item_deleted", { wardrobe_item_id: item.id });
      setMessage(t("garmentDeleted"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("garmentDeleteFailed"));
      await load();
    } finally {
      setDeletingId(null);
    }
  }

  function confirmRemove(item: Item) {
    Alert.alert(
      t("deleteGarmentAlert"),
      t("deleteGarmentAlertCopy"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("deleteAction"), style: "destructive", onPress: () => { void removeItem(item); } },
      ],
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.top}>
          <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("backHome")}</Text></Pressable>
          <Text style={s.count}>{t("wardrobeCount", { count: items.length })}</Text>
        </View>
        <Text style={s.title}>{t("wardrobeScreenTitle")}</Text>
        <Text style={s.copy}>{t("wardrobeCopy")}</Text>
        <Pressable style={[s.add, busy && s.disabled]} onPress={addItem} disabled={busy || !!deletingId} accessibilityRole="button">
          <Text style={s.addText}>{busy ? t("uploading") : t("addGarment")}</Text>
        </Pressable>
        {!!message && <Text style={s.message} accessibilityLiveRegion="polite">{message}</Text>}
        <View style={s.grid}>
          {items.map((item) => {
            const name = itemName(item);
            return (
              <View key={item.id} style={s.card}>
                <View style={s.image}>
                  {item.imageUrl
                    ? <Image source={{ uri: item.imageUrl }} style={s.photo} resizeMode="cover" accessibilityLabel={name} />
                    : <Text style={s.imageText}>ASTRA</Text>}
                </View>
                <Text style={s.item}>{name}</Text>
                <Text style={s.meta}>
                  {categoryName(item.category)} · {item.colors.length ? item.colors.map(colorName).join(", ") : t("colorPending")}
                </Text>
                <Pressable
                  onPress={() => confirmRemove(item)}
                  disabled={deletingId === item.id}
                  accessibilityRole="button"
                  accessibilityLabel={t("garmentDeleteLabel", { name })}
                >
                  <Text style={s.deleteText}>{deletingId === item.id ? t("deleting") : t("deleteGarment")}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
        {items.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{t("wardrobeEmptyTitle")}</Text>
            <Text style={s.emptyCopy}>{t("wardrobeEmptyCopy")}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F1E8" },
  page: { padding: 22, paddingBottom: 50, width: "100%", maxWidth: 760, alignSelf: "center" },
  top: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  back: { color: "#6E2D3A", fontWeight: "700" },
  count: { color: "#716B63" },
  title: { fontSize: 40, fontWeight: "600", color: "#171713", marginTop: 28 },
  copy: { color: "#6B665F", fontSize: 15, marginTop: 8 },
  add: { backgroundColor: "#171713", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 22 },
  addText: { color: "#FFF", fontWeight: "800" },
  disabled: { opacity: 0.5 },
  message: { color: "#6E2D3A", marginTop: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22 },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 10, flexGrow: 1, flexBasis: 145, maxWidth: 230 },
  image: { height: 150, borderRadius: 14, overflow: "hidden", backgroundColor: "#D9D0C2", alignItems: "center", justifyContent: "center" },
  photo: { width: "100%", height: "100%" },
  imageText: { fontSize: 11, letterSpacing: 2, color: "#6E2D3A", fontWeight: "800" },
  item: { fontSize: 16, fontWeight: "700", color: "#171713", marginTop: 12 },
  meta: { fontSize: 12, lineHeight: 17, color: "#746E65", marginTop: 5 },
  deleteText: { color: "#9C283D", fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 5 },
  empty: { padding: 28, marginTop: 24, borderWidth: 1, borderStyle: "dashed", borderColor: "#BEB5A8", borderRadius: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyCopy: { color: "#6B665F", lineHeight: 20, marginTop: 8 },
});
