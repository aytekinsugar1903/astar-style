import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { track } from "@/analytics/track";

type SavedProduct = {
  id: string;
  external_id: string;
  name: string;
  brand: string | null;
  category: string;
  colors: string[];
  price?: number;
  currency?: string;
  inStock?: boolean | null;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      router.replace("/sign-in");
      return;
    }

    const favorites = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", session.user.id);

    if (favorites.error) {
      setMessage(favorites.error.message);
      return;
    }

    const productIds = (favorites.data ?? []).map((item) => item.product_id);
    if (!productIds.length) {
      setProducts([]);
      return;
    }

    const [catalog, offers] = await Promise.all([
      supabase.from("products")
        .select("id,external_id,name,brand,category,colors")
        .in("id", productIds)
        .eq("active", true),
      supabase.from("product_offers")
        .select("product_id,price,currency,in_stock")
        .in("product_id", productIds)
        .order("price", { ascending: true }),
    ]);

    const error = catalog.error ?? offers.error;
    if (error) {
      setMessage(error.message);
      return;
    }

    const firstOffer = new Map<string, { price: number; currency: string; in_stock: boolean | null }>();
    for (const offer of offers.data ?? []) {
      if (!firstOffer.has(offer.product_id)) {
        firstOffer.set(offer.product_id, offer);
      }
    }

    setProducts((catalog.data ?? []).map((product) => {
      const offer = firstOffer.get(product.id);
      return {
        ...product,
        price: offer?.price,
        currency: offer?.currency,
        inStock: offer?.in_stock,
      };
    }));
  }, [router, session]);

  useEffect(() => { void load(); }, [load]);

  async function remove(product: SavedProduct) {
    if (!session) return;
    setBusyId(product.id);
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", session.user.id)
      .eq("product_id", product.id);

    if (error) setMessage(error.message);
    else {
      setProducts((value) => value.filter((item) => item.id !== product.id));
      void track("product_unsaved", { product_id: product.id });
    }
    setBusyId(null);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()}><Text style={s.back}>← Geri</Text></Pressable>
        <Text style={s.title}>Kaydettiklerim</Text>
        <Text style={s.copy}>Beğendiğin ürünleri daha sonra karşılaştırmak için burada tut.</Text>
        {!!message && <Text style={s.message}>{message}</Text>}

        {products.map((product) => (
          <View key={product.id} style={s.card}>
            <Pressable
              style={s.product}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.external_id } })}
            >
              <View style={[s.swatch, { backgroundColor: product.colors[0] === "Siyah" ? "#222" : product.colors[0] === "Bordo" ? "#6E2D3A" : "#E7DFD0" }]} />
              <View style={s.info}>
                <Text style={s.brand}>{product.brand ?? "ASTRA STYLE"}</Text>
                <Text style={s.name}>{product.name}</Text>
                <Text style={s.meta}>{product.category} · {product.colors.join(", ")}</Text>
                <Text style={s.price}>
                  {product.price === undefined ? "Fiyat bilgisi yok" : `${product.price.toLocaleString("tr-TR")} ${product.currency}`}
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => { void remove(product); }}
              disabled={busyId === product.id}
              accessibilityRole="button"
              accessibilityLabel={`${product.name} kayıtlardan kaldır`}
            >
              <Text style={s.remove}>{busyId === product.id ? "Kaldırılıyor…" : "Kayıtlardan kaldır"}</Text>
            </Pressable>
          </View>
        ))}

        {!products.length && !message && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Henüz ürün kaydetmedin</Text>
            <Text style={s.emptyCopy}>Ürün detayında “Kaydet” düğmesine dokunarak listenı oluşturabilirsin.</Text>
            <Pressable style={s.button} onPress={() => router.push("/products")}>
              <Text style={s.buttonText}>Ürünleri keşfet →</Text>
            </Pressable>
          </View>
        )}

        <Text style={s.notice}>Şu an demo katalog kullanılıyor. Gerçek ürünler yalnızca resmî API veya affiliate feed ile eklenecek.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F1E8" },
  page: { padding: 22, paddingBottom: 50, width: "100%", maxWidth: 720, alignSelf: "center" },
  back: { color: "#6E2D3A", fontWeight: "700", marginTop: 12 },
  title: { fontSize: 40, fontWeight: "600", color: "#171713", marginTop: 26 },
  copy: { color: "#6B665F", lineHeight: 21, marginTop: 8, marginBottom: 20 },
  message: { color: "#6E2D3A", marginBottom: 14 },
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 12, marginBottom: 12 },
  product: { flexDirection: "row", alignItems: "center", gap: 13 },
  swatch: { width: 72, height: 92, borderRadius: 14 },
  info: { flex: 1 },
  brand: { fontSize: 11, color: "#7B746B", textTransform: "uppercase", letterSpacing: 1 },
  name: { fontSize: 17, fontWeight: "700", marginTop: 5, color: "#171713" },
  meta: { fontSize: 12, color: "#716B63", marginTop: 4 },
  price: { fontSize: 15, fontWeight: "800", marginTop: 9 },
  remove: { color: "#9C283D", fontSize: 12, fontWeight: "800", textAlign: "right", marginTop: 12, paddingVertical: 5 },
  empty: { borderWidth: 1, borderStyle: "dashed", borderColor: "#BEB5A8", borderRadius: 22, padding: 26 },
  emptyTitle: { fontSize: 21, fontWeight: "700", color: "#171713" },
  emptyCopy: { color: "#6B665F", lineHeight: 20, marginTop: 8 },
  button: { backgroundColor: "#171713", borderRadius: 999, padding: 15, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#FFF", fontWeight: "800" },
  notice: { fontSize: 11, lineHeight: 17, color: "#777168", textAlign: "center", marginTop: 20 },
});
