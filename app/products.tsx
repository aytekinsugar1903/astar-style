import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useI18n } from "@/i18n/I18nProvider";
import type { TranslationKey } from "@/i18n/translations";
import { localizeProduct } from "@/catalog/localize";
import { mockProducts } from "@/catalog/mock-products";
import { track } from "@/analytics/track";

const filters: ReadonlyArray<readonly [string, TranslationKey]> = [
  ["Tümü", "colorAll"],
  ["Siyah", "colorBlack"],
  ["Krem", "colorCream"],
  ["Bordo", "colorBurgundy"],
];

export default function ProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; budget?: string }>();
  const { locale, t } = useI18n();
  const initialQuery = typeof params.query === "string" ? params.query : "";
  const initialBudget = typeof params.budget === "string" ? params.budget : "";
  const [query, setQuery] = useState(initialQuery);
  const [color, setColor] = useState("Tümü");
  const [budget, setBudget] = useState(initialBudget);

  useEffect(() => {
    if (initialQuery || initialBudget) void track("outfit_product_search_opened");
  }, [initialBudget, initialQuery]);

  const products = useMemo(() => {
    const max = Number(budget) || Infinity;
    const localeTag = locale === "tr" ? "tr-TR" : "en-US";
    const normalizedQuery = query.toLocaleLowerCase(localeTag);

    return mockProducts.filter((product) => {
      const localized = localizeProduct(product, locale);
      const searchable = [
        product.name, product.brand, product.category,
        localized.name, localized.category, localized.color,
      ].join(" ").toLocaleLowerCase(localeTag);
      return product.price <= max
        && (color === "Tümü" || product.color === color)
        && searchable.includes(normalizedQuery);
    }).sort((a, b) => b.styleScore - a.styleScore);
  }, [budget, color, locale, query]);

  const localeTag = locale === "tr" ? "tr-TR" : "en-US";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
        <Text style={s.title}>{t("productSearchTitle")}</Text>
        <Text style={s.copy}>{t("productSearchCopy")}</Text>
        {(initialQuery || initialBudget) && (
          <View style={s.context}>
            <Text style={s.contextText}>{t("outfitShoppingContext")}</Text>
          </View>
        )}
        <Pressable style={s.saved} onPress={() => router.push("/favorites")} accessibilityRole="button">
          <Text style={s.savedText}>{t("seeSaved")}</Text>
        </Pressable>
        <TextInput
          style={s.input}
          placeholder={t("productSearchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          accessibilityLabel={t("productSearchTitle")}
        />
        <TextInput
          style={s.input}
          placeholder={t("maxBudgetPlaceholder")}
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
          accessibilityLabel={t("maxBudgetPlaceholder")}
        />
        <View style={s.filters}>
          {filters.map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setColor(value)}
              style={[s.filter, color === value && s.filterOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: color === value }}
            >
              <Text style={[s.filterText, color === value && s.filterTextOn]}>{t(label)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.count}>{t("productCount", { count: products.length })}</Text>
        {products.map((product) => {
          const localized = localizeProduct(product, locale);
          return (
            <Pressable
              key={product.id}
              style={s.card}
              onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
              accessibilityRole="button"
            >
              <View style={[s.swatch, { backgroundColor: product.color === "Siyah" ? "#222" : product.color === "Bordo" ? "#6E2D3A" : "#E7DFD0" }]} />
              <View style={s.info}>
                <Text style={s.brand}>{localized.brand}</Text>
                <Text style={s.name}>{localized.name}</Text>
                <Text style={s.meta}>{localized.category} · {localized.color}</Text>
                <Text style={s.price}>{product.price.toLocaleString(localeTag)} TL</Text>
              </View>
              <View style={s.score}>
                <Text style={s.scoreNumber}>%{product.styleScore}</Text>
                <Text style={s.scoreLabel}>{t("match")}</Text>
              </View>
            </Pressable>
          );
        })}
        {products.length === 0 && <Text style={s.empty}>{t("noProducts")}</Text>}
        <Text style={s.notice}>{t("demoCatalogNotice")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:760,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 title:{fontSize:40,fontWeight:"600",marginTop:26,color:"#171713"},copy:{color:"#6B665F",marginTop:8,marginBottom:12},saved:{alignSelf:"flex-start",paddingVertical:8,marginBottom:10},savedText:{color:"#6E2D3A",fontWeight:"800"},context:{backgroundColor:"#E9DDD0",borderRadius:14,padding:12,marginTop:14,marginBottom:4},contextText:{color:"#6E2D3A",fontWeight:"700",fontSize:13},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#DED6C9",borderRadius:14,padding:14,fontSize:15,marginBottom:10},
 filters:{flexDirection:"row",flexWrap:"wrap",gap:8,marginVertical:8},filter:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#D1C8BA",borderRadius:999,paddingVertical:9,paddingHorizontal:13},filterOn:{backgroundColor:"#171713"},filterText:{fontWeight:"600"},filterTextOn:{color:"#FFF"},
 count:{fontSize:12,color:"#777168",marginVertical:14},card:{backgroundColor:"#FFF",borderRadius:20,padding:12,marginBottom:11,flexDirection:"row",alignItems:"center",gap:13},swatch:{width:72,height:92,borderRadius:14},info:{flex:1},brand:{fontSize:11,color:"#7B746B",textTransform:"uppercase",letterSpacing:1},name:{fontSize:17,fontWeight:"700",marginTop:5,color:"#171713"},meta:{fontSize:12,color:"#716B63",marginTop:4},price:{fontSize:15,fontWeight:"800",marginTop:9},score:{alignItems:"center"},scoreNumber:{color:"#6E2D3A",fontWeight:"900"},scoreLabel:{fontSize:10,color:"#817A72"},empty:{padding:30,textAlign:"center"},notice:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:20},
});
