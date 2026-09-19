import { useEffect, useMemo, useState } from "react";
import { Image, PanResponder, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Position = { x: number; y: number };
type Piece = { id: string; name: string | null; image_path: string; cutout_image_path: string | null; url?: string };
const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

function Movable({ piece, position, onMove, onRemove }: { piece: Piece; position: Position; onMove: (point: Position) => void; onRemove: () => void }) {
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => setDelta({ x: gesture.dx, y: gesture.dy }),
    onPanResponderRelease: (_, gesture) => { setDelta({ x: 0, y: 0 }); onMove({ x: clamp(position.x + gesture.dx, 230), y: clamp(position.y + gesture.dy, 340) }); },
  }), [position.x, position.y, onMove]);
  return <View style={[s.piece, { left: clamp(position.x + delta.x, 230), top: clamp(position.y + delta.y, 340) }]} {...responder.panHandlers}>
    {piece.url ? <Image source={{ uri: piece.url }} style={s.pieceImage} resizeMode="contain" /> : <Text style={s.pieceName}>{piece.name}</Text>}
    <Pressable onPress={onRemove} accessibilityRole="button" style={s.remove}><Text style={s.removeText}>×</Text></Pressable>
  </View>;
}

export default function BoardScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<Piece[]>(isSupabaseConfigured ? [] : [{ id: "demo-top", name: "Blazer", image_path: "", cutout_image_path: null }, { id: "demo-bottom", name: "Trousers", image_path: "", cutout_image_path: null }, { id: "demo-shoes", name: "Shoes", image_path: "", cutout_image_path: null }]);
  const [placed, setPlaced] = useState<Record<string, Position>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!isSupabaseConfigured || !session) return;
    let active = true;
    void Promise.all([
      supabase.from("wardrobe_items").select("id,name,image_path,cutout_image_path").order("created_at", { ascending: false }).limit(80),
      supabase.from("dressing_sessions").select("canvas_state").eq("user_id", session.user.id).maybeSingle(),
    ]).then(async ([wardrobe, saved]) => {
      if (!active) return;
      if (wardrobe.error || saved.error) { setMessage(wardrobe.error?.message ?? saved.error?.message ?? ""); return; }
      const hydrated = await Promise.all((wardrobe.data ?? []).map(async piece => {
        const signed = await supabase.storage.from("user-photos").createSignedUrl(piece.cutout_image_path ?? piece.image_path, 3600);
        return { ...piece, url: signed.data?.signedUrl };
      }));
      if (!active) return;
      setItems(hydrated);
      const state = saved.data?.canvas_state;
      if (state && typeof state === "object" && !Array.isArray(state) && state.board && typeof state.board === "object" && !Array.isArray(state.board)) {
        const restored: Record<string, Position> = {};
        for (const [id, value] of Object.entries(state.board)) if (value && typeof value === "object" && !Array.isArray(value) && typeof value.x === "number" && typeof value.y === "number" && hydrated.some(piece => piece.id === id)) restored[id] = { x: clamp(value.x, 230), y: clamp(value.y, 340) };
        setPlaced(restored);
      }
    });
    return () => { active = false; };
  }, [session]);

  async function persist(next: Record<string, Position>) {
    setPlaced(next);
    if (!session || !isSupabaseConfigured) return;
    const existing = await supabase.from("dressing_sessions").select("canvas_state").eq("user_id", session.user.id).maybeSingle();
    if (existing.error) { setMessage(existing.error.message); return; }
    const current = existing.data?.canvas_state;
    const previous = current && typeof current === "object" && !Array.isArray(current) ? current : {};
    const saved = await supabase.from("dressing_sessions").upsert({ user_id: session.user.id, canvas_state: { ...previous, board: next }, updated_at: new Date().toISOString() });
    if (saved.error) setMessage(saved.error.message);
  }
  function add(id: string) { if (placed[id]) return; void persist({ ...placed, [id]: { x: 15 + (Object.keys(placed).length % 3) * 75, y: 20 + Math.floor(Object.keys(placed).length / 3) * 85 } }); }
  async function save() {
    if (!Object.keys(placed).length) return;
    if (!isSupabaseConfigured) { setMessage(t("boardSaved")); return; }
    if (!session) { router.push("/sign-in"); return; }
    setBusy(true);
    const created = await supabase.from("outfits").insert({ user_id: session.user.id, title: t("boardSavedTitle"), occasion: null, context: { board: placed } }).select("id").single();
    if (created.error) { setMessage(created.error.message); setBusy(false); return; }
    const attached = await supabase.from("outfit_items").insert(Object.keys(placed).map(id => ({ outfit_id: created.data.id, wardrobe_item_id: id })));
    if (attached.error) { await supabase.from("outfits").delete().eq("id", created.data.id); setMessage(attached.error.message); }
    else { setMessage(t("boardSaved")); router.push("/outfits"); }
    setBusy(false);
  }
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={() => router.back()}><Text style={s.back}>{t("back")}</Text></Pressable>
    <Text style={s.title}>{t("boardTitle")}</Text><Text style={s.copy}>{t("boardCopy")}</Text>
    <View style={s.canvas}>{items.filter(piece => placed[piece.id]).map(piece => <Movable key={piece.id} piece={piece} position={placed[piece.id]} onMove={point => void persist({ ...placed, [piece.id]: point })} onRemove={() => { const next = { ...placed }; delete next[piece.id]; void persist(next); }} />)}</View>
    {!!message && <Text style={s.message}>{message}</Text>}
    <Pressable onPress={() => void save()} disabled={busy || !Object.keys(placed).length} style={s.save} accessibilityRole="button"><Text style={s.saveText}>{t("boardSave")}</Text></Pressable>
    <Text style={s.label}>{t("wardrobeDrawer")}</Text><View style={s.drawer}>{items.map(piece => <Pressable key={piece.id} onPress={() => add(piece.id)} style={s.card} accessibilityRole="button">
      {piece.url && <Image source={{ uri: piece.url }} style={s.thumb} resizeMode="contain" />}<Text numberOfLines={2} style={s.pieceName}>{piece.name ?? t("unnamedItem")}</Text>
    </Pressable>)}</View>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#F5F1E8" }, page: { padding: 22, paddingBottom: 60, maxWidth: 720, width: "100%", alignSelf: "center" }, back: { color: "#6E2D3A", fontWeight: "700", marginTop: 12 }, title: { color: "#171713", fontSize: 35, marginTop: 25, fontWeight: "700" }, copy: { color: "#666158", lineHeight: 20, marginTop: 10 }, canvas: { marginTop: 20, width: 320, height: 440, maxWidth: "100%", alignSelf: "center", borderRadius: 22, borderWidth: 1, borderColor: "#D6CEC0", backgroundColor: "#FFF" }, piece: { position: "absolute", width: 90, height: 100, borderRadius: 12, backgroundColor: "#F4EFE8" }, pieceImage: { width: 90, height: 100 }, pieceName: { fontSize: 11, color: "#332D27", padding: 7 }, remove: { position: "absolute", top: 0, right: 0, backgroundColor: "#6E2D3A", borderRadius: 12, width: 22, height: 22, alignItems: "center" }, removeText: { color: "white", fontWeight: "800" }, message: { color: "#6E2D3A", marginTop: 8 }, save: { backgroundColor: "#171713", padding: 15, borderRadius: 999, alignItems: "center", marginTop: 18 }, saveText: { color: "white", fontWeight: "700" }, label: { fontSize: 19, marginTop: 24, marginBottom: 12, fontWeight: "700" }, drawer: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, card: { padding: 6, backgroundColor: "white", width: 94, borderRadius: 12 }, thumb: { width: 82, height: 82 }, });
