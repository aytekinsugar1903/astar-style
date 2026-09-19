import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  raw_image_path?: string;
  cutout_image_path?: string | null;
  wear_count?: number;
  purchase_price?: number | null;
  purchase_currency?: string;
  processing_status?: string;
  matched_metadata?: unknown;
  imageUrl?: string;
};

const demoItems: Item[] = [
  { id: "1", name: "Siyah gece elbisesi", category: "dress", colors: ["Siyah"], image_path: "" },
  { id: "2", name: "Krem blazer", category: "jacket", colors: ["Krem"], image_path: "" },
];

const categoryKeys: Record<string, TranslationKey> = {
  dress: "categoryDress",
  pants: "categoryPants",
  trousers: "categoryPants",
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
const editableCategories = ["dress", "trousers", "skirt", "shirt", "tshirt", "jacket", "shoes", "bag", "accessory", "other"] as const;
type EditableCategory = typeof editableCategories[number];
const similarCount = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) && "similar_to" in value && Array.isArray(value.similar_to) ? value.similar_to.length : 0;

export default function WardrobeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const [items, setItems] = useState<Item[]>(isSupabaseConfigured ? [] : demoItems);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingBatch, setPendingBatch] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const pending = pendingBatch[0] ?? null;
  const [pendingName, setPendingName] = useState("");
  const [pendingPrice, setPendingPrice] = useState("");
  const [pendingCategory, setPendingCategory] = useState<EditableCategory>("other");
  const [pendingColor, setPendingColor] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editCategory, setEditCategory] = useState<EditableCategory>("other");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !session) return;

    const { data, error } = await supabase
      .from("wardrobe_items")
      .select("id,name,category,colors,image_path,raw_image_path,cutout_image_path,wear_count,purchase_price,purchase_currency,processing_status,matched_metadata")
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

  async function pickImage(source: "camera" | "library") {
    if (!isSupabaseConfigured) {
      setMessage(t("demoGarmentAdded"));
      setItems((value) => [{ id: String(Date.now()), name: "Yeni parça", category: "other", colors: [], image_path: "" }, ...value]);
      return;
    }
    if (!session) { router.replace("/sign-in"); return; }

    const permission = source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setMessage(t(source === "camera" ? "cameraPermissionWardrobe" : "galleryPermissionWardrobe")); return; }
    const options: ImagePicker.ImagePickerOptions = source === "library"
      ? { mediaTypes: ["images"], quality: .9, allowsMultipleSelection: true, selectionLimit: 30 }
      : { mediaTypes: ["images"], quality: .9, allowsEditing: true };
    const picked = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (picked.canceled) return;
    const valid = picked.assets.filter(asset => (asset.width ?? 0) >= 720 && (asset.height ?? 0) >= 720);
    if (!valid.length) { setMessage(t("captureTooSmall")); return; }
    setPendingBatch(current => {
      const seen = new Set(current.map(asset => asset.assetId ?? asset.uri));
      return [...current, ...valid.filter(asset => !seen.has(asset.assetId ?? asset.uri))].slice(0, 30);
    });
    setPendingName(""); setPendingPrice(""); setMessage(t("batchQueued", { count: valid.length }));
  }

  function addItem() {
    if (Platform.OS === "web") { void pickImage("library"); return; }
    Alert.alert(t("addGarment"), t("captureGuide"), [
      { text: t("takePhoto"), onPress: () => { void pickImage("camera"); } },
      { text: t("chooseGallery"), onPress: () => { void pickImage("library"); } },
      { text: t("cancel"), style: "cancel" },
    ]);
  }

  async function confirmPending() {
    if (!pending || !session) return;

    setBusy(true);
    setMessage(t("secureUploading"));
    let uploadedPath: string | null = null;
    let saved = false;

    try {
      uploadedPath = await uploadWardrobeImage(session.user.id, pending.uri, pending.mimeType ?? "image/jpeg");
      const price = Number(pendingPrice);

      const { data: item, error } = await supabase.from("wardrobe_items").insert({
        user_id: session.user.id,
        name: pendingName.trim() || "Yeni kıyafet",
        category: pendingCategory,
        colors: pendingColor.trim() ? [pendingColor.trim().slice(0, 32)] : [],
        metadata_confirmed: pendingCategory !== "other" || Boolean(pendingColor.trim()),
        image_path: uploadedPath,
        raw_image_path: uploadedPath,
        capture_quality: { width: pending.width, height: pending.height, passed: true },
        purchase_price: pendingPrice.trim() && Number.isFinite(price) && price >= 0 ? price : null,
        purchase_currency: "TRY",
        processing_status: "enriching",
      }).select("id").single();
      if (error) throw error;
      saved = true;

      const classified = pendingCategory === "other" && !pendingColor.trim()
        ? await supabase.functions.invoke("classify-garment", { body: { wardrobeItemId: item.id, locale } })
        : { error: null };
      const segmented = await supabase.functions.invoke("background-remove", { body: { wardrobeItemId: item.id } });
      const enriched = await supabase.functions.invoke("enrich-garment", { body: { wardrobeItemId: item.id, locale } });

      void track("wardrobe_item_added", { wardrobe_item_id: item.id });
      if (classified.error) {
        const errorMessage = t(await functionErrorKey(classified.error, "garment_classification"));
        setMessage(`${t("garmentAnalysisPending")} ${errorMessage}`);
      } else if (segmented.data?.transparent) {
        setMessage(enriched.error ? t("garmentAnalysisPending") : t("garmentPipelineReady"));
      } else {
        setMessage(t("garmentNeedsCutout"));
      }
      setPendingBatch(current => current.slice(1)); setPendingName(""); setPendingPrice(""); setPendingColor(""); setPendingCategory("other");
      await load();
    } catch (error) {
      if (uploadedPath && !saved) await supabase.storage.from("user-photos").remove([uploadedPath]);
      setMessage(error instanceof Error ? error.message : t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function splitPending() {
    if (!pending || !session) return;
    setBusy(true);
    let temporaryPath: string | null = null;
    try {
      temporaryPath = await uploadWardrobeImage(session.user.id, pending.uri, pending.mimeType ?? "image/jpeg", "incoming");
      const result = await supabase.functions.invoke("split-garments", { body: { imagePath: temporaryPath } });
      if (result.error) throw result.error;
      setPendingBatch(current => current.slice(1));
      const added = result.data?.added ?? [];
      const duplicates = added.filter((entry: { similarTo: string[] }) => entry.similarTo.length).length;
      setMessage(t("batchSplitDone", { count: added.length, duplicates }));
      await load();
    } catch (error) {
      if (temporaryPath) await supabase.storage.from("user-photos").remove([temporaryPath]);
      setMessage(t("batchSplitUnavailable"));
    } finally { setBusy(false); }
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
      const paths = [...new Set([item.image_path, item.raw_image_path, item.cutout_image_path].filter((path): path is string => Boolean(path)))];
      const deleted = await supabase.from("wardrobe_items").delete().eq("id", item.id).eq("user_id", session.user.id);
      if (deleted.error) throw deleted.error;

      setItems((value) => value.filter((entry) => entry.id !== item.id));
      void track("wardrobe_item_deleted", { wardrobe_item_id: item.id });
      const removed = await supabase.storage.from("user-photos").remove(paths);
      setMessage(removed.error ? t("garmentDeleteFailed") : t("garmentDeleted"));
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

  async function saveItemEdit() {
    if (!editingId || !session) return;
    setBusy(true);
    const { error } = await supabase.from("wardrobe_items").update({
      name: editName.trim().slice(0, 100) || null,
      category: editCategory,
      colors: editColor.trim() ? [editColor.trim().slice(0, 32)] : [],
      metadata_confirmed: true,
      processing_status: "ready",
    }).eq("id", editingId).eq("user_id", session.user.id);
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setEditingId(null);
    await load();
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
        {pending && <View style={s.pendingCard}>
          <Image source={{ uri: pending.uri }} style={s.pendingImage} resizeMode="contain" />
          <Text style={s.pendingTitle}>{t("confirmWardrobeCard")} · {t("batchRemaining", { count: pendingBatch.length })}</Text>
          <Text style={s.pendingCopy}>{t("capturePassed", { width: pending.width ?? 0, height: pending.height ?? 0 })}</Text>
          <TextInput style={s.input} value={pendingName} onChangeText={setPendingName} placeholder={t("garmentNameOptional")} accessibilityLabel={t("garmentNameOptional")} />
          <Text style={s.pendingCopy}>{t("batchCategory")}</Text>
          <View style={s.categories}>{editableCategories.map(key => <Pressable key={key} style={[s.categoryChip, pendingCategory === key && s.categorySelected]} onPress={() => setPendingCategory(key)} accessibilityRole="button"><Text style={s.categoryText}>{categoryName(key)}</Text></Pressable>)}</View>
          <TextInput style={s.input} value={pendingColor} onChangeText={setPendingColor} placeholder={t("batchColor")} accessibilityLabel={t("batchColor")} />
          <TextInput style={s.input} value={pendingPrice} onChangeText={setPendingPrice} placeholder={t("purchasePriceOptional")} keyboardType="numeric" accessibilityLabel={t("purchasePriceOptional")} />
          <Pressable style={[s.confirm, busy && s.disabled]} onPress={() => void confirmPending()} disabled={busy}><Text style={s.confirmText}>{t("addToWardrobe")}</Text></Pressable>
          <Pressable style={[s.room, busy && s.disabled]} onPress={() => void splitPending()} disabled={busy} accessibilityRole="button"><Text style={s.roomText}>{t("batchSplit")}</Text></Pressable>
          <Pressable onPress={() => setPendingBatch(current => current.slice(1))} disabled={busy}><Text style={s.cancelPending}>{t("batchSkip")}</Text></Pressable>
          <Pressable onPress={() => void pickImage("library")} disabled={busy}><Text style={s.cancelPending}>{t("batchAddMore")}</Text></Pressable>
        </View>}
        <View style={s.grid}>
          {items.map((item) => {
            const name = itemName(item);
            return (
              <View key={item.id} style={s.card}>
                <View style={s.image}>
                  {item.imageUrl
                    ? <Image source={{ uri: item.imageUrl }} style={s.photo} resizeMode="cover" accessibilityLabel={name} />
                    : <Text style={s.imageText}>WEYRA</Text>}
                </View>
                <Text style={s.item}>{name}</Text>
                <Text style={s.meta}>
                  {categoryName(item.category)} · {item.colors.length ? item.colors.map(colorName).join(", ") : t("colorPending")}
                </Text>
                {similarCount(item.matched_metadata) > 0 && <Text style={s.wear}>{t("batchSimilar", { count: similarCount(item.matched_metadata) })}</Text>}
                <Text style={s.wear}>
                  {t("wearCount", { count: item.wear_count ?? 0 })}
                  {item.purchase_price != null && (item.wear_count ?? 0) > 0 ? " · " + t("costPerWear", { amount: (Number(item.purchase_price) / (item.wear_count ?? 1)).toFixed(0), currency: item.purchase_currency ?? "TRY" }) : ""}
                </Text>
                {isSupabaseConfigured && <Pressable onPress={() => { setEditingId(item.id); setEditName(item.name ?? ""); setEditColor(item.colors[0] ?? ""); setEditCategory(editableCategories.includes(item.category as EditableCategory) ? item.category as EditableCategory : "other"); }} accessibilityRole="button"><Text style={s.deleteText}>{t("batchEdit")}</Text></Pressable>}
                {editingId === item.id && <View>
                  <TextInput style={s.input} value={editName} onChangeText={setEditName} placeholder={t("garmentNameOptional")} />
                  <View style={s.categories}>{editableCategories.map(key => <Pressable key={key} style={[s.categoryChip, editCategory === key && s.categorySelected]} onPress={() => setEditCategory(key)}><Text style={s.categoryText}>{categoryName(key)}</Text></Pressable>)}</View>
                  <TextInput style={s.input} value={editColor} onChangeText={setEditColor} placeholder={t("batchColor")} />
                  <Pressable onPress={() => void saveItemEdit()} disabled={busy} style={s.confirm}><Text style={s.confirmText}>{t("batchSave")}</Text></Pressable>
                </View>}
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
        <Pressable style={s.room} onPress={() => router.push("/dressing-room")} accessibilityRole="button"><Text style={s.roomText}>{t("openDressingRoom")}</Text></Pressable>
        <Pressable style={s.room} onPress={() => router.push("/board")} accessibilityRole="button"><Text style={s.roomText}>{t("boardTitle")}</Text></Pressable>
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
  pendingCard: { backgroundColor: "#FFF", borderRadius: 22, padding: 16, marginTop: 18, borderWidth: 1, borderColor: "#D7CCBE" },
  pendingImage: { height: 220, width: "100%", backgroundColor: "#EEE8DE", borderRadius: 16 },
  pendingTitle: { fontSize: 20, fontWeight: "800", marginTop: 14, color: "#171713" },
  pendingCopy: { color: "#6B665F", marginTop: 6 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  categoryChip: { borderWidth: 1, borderColor: "#C9BFB0", padding: 8, borderRadius: 999 },
  categorySelected: { borderColor: "#6E2D3A", backgroundColor: "#F3E9EA" },
  categoryText: { fontSize: 12, color: "#29231E" },
  input: { backgroundColor: "#FAF8F4", borderWidth: 1, borderColor: "#DCD3C5", borderRadius: 13, padding: 13, marginTop: 10 },
  confirm: { backgroundColor: "#171713", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 12 },
  confirmText: { color: "#FFF", fontWeight: "800" }, cancelPending: { color: "#6E2D3A", fontWeight: "700", textAlign: "center", padding: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22 },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 10, flexGrow: 1, flexBasis: 145, maxWidth: 230 },
  image: { height: 150, borderRadius: 14, overflow: "hidden", backgroundColor: "#D9D0C2", alignItems: "center", justifyContent: "center" },
  wear: { fontSize: 11, color: "#6E2D3A", fontWeight: "700", marginTop: 7 },
  room: { borderWidth: 1, borderColor: "#171713", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 24 },
  roomText: { color: "#171713", fontWeight: "800" },
  photo: { width: "100%", height: "100%" },
  imageText: { fontSize: 11, letterSpacing: 2, color: "#6E2D3A", fontWeight: "800" },
  item: { fontSize: 16, fontWeight: "700", color: "#171713", marginTop: 12 },
  meta: { fontSize: 12, lineHeight: 17, color: "#746E65", marginTop: 5 },
  deleteText: { color: "#9C283D", fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 5 },
  empty: { padding: 28, marginTop: 24, borderWidth: 1, borderStyle: "dashed", borderColor: "#BEB5A8", borderRadius: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyCopy: { color: "#6B665F", lineHeight: 20, marginTop: 8 },
});
