import {useAppStyles,useTheme} from '@/studio/theme';
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, Image, Linking } from "react-native";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/auth/AuthProvider";
import { localizeFacet, localizeProduct } from "@/catalog/localize";
import { productColor } from "@/catalog/color";
import { mockProducts } from "@/catalog/mock-products";
import { loadCatalog, loadStylePreferences } from "@/catalog/repository";
import type { CatalogProduct } from "@/catalog/types";
import { isSupabaseConfigured } from "@/lib/supabase";
import { track } from "@/analytics/track";

import {useImportedCatalog,catalogProduct} from '@/catalog/imported';
import {photoCatalog} from '@/catalog/photo-catalog';
import {shoeBrands,brandKey,isShoe} from '@/catalog/shoe-brands';
const ALL = "Tümü";

export default function ProductsScreen() {const s=useAppStyles(baseStyles);

  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string; budget?: string; category?:string; brand?:string }>();
  const { session } = useAuth();
  const { locale, t } = useI18n();
  const initialQuery = typeof params.query === "string" ? params.query : "";
  const initialBudget = typeof params.budget === "string" ? params.budget : "";
  const imported=useImportedCatalog();
  const shoeScope=params.category==='shoes';
  const brandFilter=typeof params.brand==='string'?params.brand:'';
  const selectedFirm=shoeBrands.find(b=>brandKey(b.name)===brandKey(brandFilter));
  const [query, setQuery] = useState(initialQuery);
  const [budget, setBudget] = useState(initialBudget);
  const [category, setCategory] = useState(ALL);
  const [color, setColor] = useState(ALL);
  const [style, setStyle] = useState(ALL);
  const [audience, setAudience] = useState(ALL);
  const [stockOnly, setStockOnly] = useState(false);
  const [baseCatalog, setCatalog] = useState<CatalogProduct[]>([...photoCatalog,...mockProducts]);
  const [visibleCount,setVisibleCount]=useState(40);
  const [catalogMessage, setCatalogMessage] = useState("");

  useEffect(() => {
    if (initialQuery || initialBudget) void track("outfit_product_search_opened");
  }, [initialBudget, initialQuery]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void loadStylePreferences(session?.user.id)
      .then(async (preferences) => {
        if (active && preferences.audience !== "unisex") setAudience(preferences.audience);
        return loadCatalog(preferences);
      })
      .then((items) => { if (active && items.length) setCatalog(items); })
      .catch(() => { if (active) setCatalogMessage(t("catalogFallback")); });
    return () => { active = false; };
  }, [session?.user.id, t]);

  const catalog=useMemo(()=>[...imported.products.filter(product=>product.sourceId!=="livostyle-open").map(catalogProduct),...baseCatalog],[imported.products,baseCatalog]);
  useEffect(()=>{setCategory(ALL);setQuery(initialQuery);setColor(ALL);setStyle(ALL);setAudience(ALL);setBudget(initialBudget);setStockOnly(false);},[shoeScope,brandFilter,initialQuery,initialBudget]);
  const categories = useMemo(() => [ALL, ...new Set(catalog.map((item) => item.category))], [catalog]);
  const colors = useMemo(() => [ALL, ...new Set(catalog.flatMap(item=>item.variants?.map(v=>v.color)??[item.color]).filter(Boolean))], [catalog]);
  const styles = useMemo(() => [ALL, ...new Set(catalog.flatMap((item) => item.styleTags))], [catalog]);

  const products = useMemo(() => {
    const max = Number(budget) || Infinity;
    const localeTag = locale === "tr" ? "tr-TR" : "en-US";
    const normalizedQuery = query.toLocaleLowerCase(localeTag);
    return catalog.filter((product) => {
      if(shoeScope&&(!isShoe(product)||product.source==='demo'))return false;
      if(brandFilter&&brandKey(product.brand)!==brandKey(brandFilter))return false;
      const localized = localizeProduct(product, locale);
      const searchable = [product.name, product.brand, product.category, localized.name, localized.category, localized.color, ...localized.styleTags]
        .join(" ").toLocaleLowerCase(localeTag);
      const audienceMatch = audience === ALL || product.audience === "unisex" || product.audience === audience;
      const variantMatch=product.variants?product.variants.some(v=>(color===ALL||v.color===color)&&(!stockOnly||v.inStock===true)&&(budget===''||(v.price!==undefined&&v.price<=max))):((budget===''||(product.priceKnown!==false&&product.price<=max))&&(color===ALL||product.color===color)&&(!stockOnly||product.inStock));
      return variantMatch && audienceMatch
        && (category === ALL || product.category === category)
        && (style === ALL || product.styleTags.includes(style))
        && searchable.includes(normalizedQuery);
    }).sort((a, b) => b.styleScore - a.styleScore);
  }, [audience, budget, catalog, category, color, locale, query, stockOnly, style,shoeScope,brandFilter]);

  useEffect(()=>setVisibleCount(40),[query,budget,category,color,style,audience,stockOnly]);
  function clearFilters() {
    setQuery(""); setBudget(""); setCategory(ALL); setColor(ALL); setStyle(ALL); setAudience(ALL); setStockOnly(false);
  }

  const localeTag = locale === "tr" ? "tr-TR" : "en-US";
  const facet = (label:string, values:string[], selected:string, setter:(value:string)=>void) => (
    <View style={s.facet}>
      <Text style={s.facetLabel}>{label}</Text>
      <View style={s.filters}>{values.map((value) => (
        <Pressable key={value} onPress={() => setter(value)} style={[s.filter, selected === value && s.filterOn]} accessibilityRole="button" accessibilityState={{ selected:selected===value }}>
          <Text style={[s.filterText, selected === value && s.filterTextOn]}>{localizeFacet(value, locale)}</Text>
        </Pressable>
      ))}</View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page}>
        <Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={s.back}>{t("back")}</Text></Pressable>
        <Text style={s.title}>{brandFilter||t("productSearchTitle")}</Text>{shoeScope&&<Pressable accessibilityRole="button" onPress={()=>router.push("/shoe-brands")}><Text style={s.savedText}>{t("shoeChooseFirm")} →</Text></Pressable>}
<Text style={s.copy}>{t("productSearchCopy")}</Text><Pressable onPress={()=>router.push("/catalog-import")}><Text style={s.savedText}>{t("catalogImportTitle")}</Text></Pressable>
        {(initialQuery || initialBudget) && <View style={s.context}><Text style={s.contextText}>{t("outfitShoppingContext")}</Text></View>}
        {isSupabaseConfigured && <Pressable style={s.saved} onPress={() => router.push("/favorites")} accessibilityRole="button"><Text style={s.savedText}>{t("seeSaved")}</Text></Pressable>}
        <TextInput style={s.input} placeholder={t("productSearchPlaceholder")} value={query} onChangeText={setQuery} accessibilityLabel={t("productSearchTitle")} />
        <TextInput style={s.input} placeholder={t("maxBudgetPlaceholder")} keyboardType="numeric" value={budget} onChangeText={setBudget} accessibilityLabel={t("maxBudgetPlaceholder")} />
        <View style={s.facet}>
          <Text style={s.facetLabel}>{t("filterAudience")}</Text>
          <View style={s.filters}>
            {([[ALL,"audienceAll"],["women","audienceWomen"],["men","audienceMen"],["unisex","audienceUnisex"]] as const).map(([value,key]) => (
              <Pressable key={value} onPress={() => setAudience(value)} style={[s.filter,audience===value&&s.filterOn]} accessibilityRole="button" accessibilityState={{selected:audience===value}}>
                <Text style={[s.filterText,audience===value&&s.filterTextOn]}>{t(key)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {facet(t("filterCategory"), categories, category, value=>{if(isShoe({category:value})){router.push("/shoe-brands");return;}setCategory(value);})}
        {facet(t("filterColor"), colors, color, setColor)}
        {facet(t("filterStyle"), styles, style, setStyle)}
        <View style={s.filterActions}>
          <Pressable style={[s.stock,stockOnly&&s.stockOn]} onPress={()=>setStockOnly(!stockOnly)} accessibilityRole="checkbox" accessibilityState={{checked:stockOnly}}><Text style={[s.stockText,stockOnly&&s.filterTextOn]}>{t("stockOnly")}</Text></Pressable>
          <Pressable onPress={clearFilters} accessibilityRole="button"><Text style={s.reset}>{t("resetFilters")}</Text></Pressable>
        </View>
        {!!catalogMessage && <Text style={s.catalogMessage} accessibilityLiveRegion="polite">{catalogMessage}</Text>}
        <Text style={s.count}>{t("productCount", { count: products.length })}</Text>
        {products.slice(0,visibleCount).map((product) => {
          const localized = localizeProduct(product, locale);
          return (
            <Pressable key={product.id} style={s.card} onPress={() => router.push({ pathname:"/product/[id]",params:{id:product.id} })} accessibilityRole="button">
              <View style={[s.swatch,{backgroundColor:productColor(product.color)}]}>{(product.imageUrl||product.photoSource)&&<Image source={product.imageUrl?{uri:product.imageUrl}:product.photoSource!} resizeMode="contain" style={{width:"100%",height:"100%"}}/>}</View>
              <View style={s.info}><Text style={s.brand}>{localized.brand}</Text><Text style={s.name}>{localized.name}</Text><Text style={s.meta}>{localized.category} · {localized.color}</Text><Text style={s.price}>{product.priceKnown===false?t("catalogPriceUnknown"):product.price.toLocaleString(localeTag)+" "+product.currency}</Text></View>
              {product.styleScoreKnown!==false&&<View style={s.score}><Text style={s.scoreNumber}>%{product.styleScore}</Text><Text style={s.scoreLabel}>{t("match")}</Text></View>}
            </Pressable>
          );
        })}
        {products.length>visibleCount&&<Pressable style={s.saved} onPress={()=>setVisibleCount(n=>n+40)}><Text style={s.savedText}>{t("catalogMore")}</Text></Pressable>}
        {!products.length && <Text style={s.empty}>{t(shoeScope&&brandFilter?"shoeModelsEmpty":"noProducts")}</Text>}
        {selectedFirm&&<Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(selectedFirm.url).catch(()=>setCatalogMessage(t("shoeLinkError")))}><Text style={s.savedText}>{t("shoeOfficialModels")} ↗</Text></Pressable>}<Text style={s.notice}>{t("catalogMixedNotice")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:760,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},title:{fontSize:40,fontWeight:"600",marginTop:26,color:"#171713"},copy:{color:"#6B665F",marginTop:8,marginBottom:12},
 context:{backgroundColor:"#E9DDD0",borderRadius:14,padding:12,marginTop:14,marginBottom:4},contextText:{color:"#6E2D3A",fontWeight:"700",fontSize:13},saved:{alignSelf:"flex-start",paddingVertical:8,marginBottom:10},savedText:{color:"#6E2D3A",fontWeight:"800"},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#DED6C9",borderRadius:14,padding:14,fontSize:15,marginBottom:10},
 facet:{marginTop:12},facetLabel:{fontSize:11,fontWeight:"800",letterSpacing:1.1,color:"#6E2D3A",marginBottom:7},filters:{flexDirection:"row",flexWrap:"wrap",gap:7},filter:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#D1C8BA",borderRadius:999,paddingVertical:8,paddingHorizontal:12},filterOn:{backgroundColor:"#171713"},filterText:{fontWeight:"600",fontSize:12},filterTextOn:{color:"#FFF"},
 filterActions:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginTop:16},stock:{borderWidth:1,borderColor:"#6E2D3A",borderRadius:999,paddingVertical:9,paddingHorizontal:13},stockOn:{backgroundColor:"#6E2D3A"},stockText:{color:"#6E2D3A",fontWeight:"800"},reset:{color:"#6E2D3A",fontWeight:"800",padding:8},
 catalogMessage:{color:"#6E2D3A",fontSize:12,marginTop:8},count:{fontSize:12,color:"#777168",marginVertical:14},card:{backgroundColor:"#FFF",borderRadius:20,padding:12,marginBottom:11,flexDirection:"row",alignItems:"center",gap:13},swatch:{width:72,height:92,borderRadius:14,borderWidth:1,borderColor:"#DDD5C9"},info:{flex:1},brand:{fontSize:11,color:"#7B746B",textTransform:"uppercase",letterSpacing:1},name:{fontSize:17,fontWeight:"700",marginTop:5,color:"#171713"},meta:{fontSize:12,color:"#716B63",marginTop:4},price:{fontSize:15,fontWeight:"800",marginTop:9},score:{alignItems:"center"},scoreNumber:{color:"#6E2D3A",fontWeight:"900"},scoreLabel:{fontSize:10,color:"#817A72"},empty:{padding:30,textAlign:"center"},notice:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:20},
});


const baseStyles=s;
