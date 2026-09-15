import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { mockProducts } from "@/catalog/mock-products";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ProductDetailScreen(){
  const {id}=useLocalSearchParams<{id:string}>();
  const router=useRouter();
  const {session}=useAuth();
  const product=mockProducts.find(p=>p.id===id);

  async function openMerchant(){
    if(!product) return;
    if(isSupabaseConfigured){
      const {data}=await supabase.from("products").select("id").eq("external_id",product.id).eq("source","demo").maybeSingle();
      if(data) await supabase.from("affiliate_clicks").insert({user_id:session?.user.id??null,product_id:data.id});
    }
    await Linking.openURL(product.affiliateUrl??product.productUrl);
  }

  if(!product) return <SafeAreaView style={s.safe}><Text style={s.notFound}>Ürün bulunamadı.</Text></SafeAreaView>;
  return <SafeAreaView style={s.safe}><View style={s.page}>
    <Pressable onPress={()=>router.back()}><Text style={s.back}>← Ürünlere dön</Text></Pressable>
    <View style={[s.visual,{backgroundColor:product.color==="Siyah"?"#222":product.color==="Bordo"?"#6E2D3A":"#E7DFD0"}]}><Text style={s.visualText}>ASTRA STYLE</Text></View>
    <Text style={s.brand}>{product.brand}</Text><Text style={s.title}>{product.name}</Text>
    <Text style={s.meta}>{product.category} · {product.color} · %{product.styleScore} stil uyumu</Text>
    <Text style={s.price}>{product.price.toLocaleString("tr-TR")} TL</Text>
    <Text style={s.status}>{product.inStock?"Stokta":"Şu anda stokta değil"} · Demo ürün</Text>
    <Pressable disabled={!product.inStock} style={[s.button,!product.inStock&&{opacity:.4}]} onPress={openMerchant}><Text style={s.buttonText}>Satın alma sayfasına git →</Text></Pressable>
    <Text style={s.note}>Gerçek katalogda bu bağlantı resmî affiliate URL’si olacak. Satın alma mağazanın güvenli sayfasında tamamlanır.</Text>
  </View></SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,width:"100%",maxWidth:620,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 visual:{height:300,borderRadius:28,marginTop:24,alignItems:"center",justifyContent:"center"},visualText:{color:"#FFF",fontWeight:"800",letterSpacing:2},
 brand:{fontSize:12,color:"#746E65",letterSpacing:1.3,marginTop:25,textTransform:"uppercase"},title:{fontSize:32,fontWeight:"600",color:"#171713",marginTop:8},
 meta:{color:"#706A62",marginTop:10},price:{fontSize:25,fontWeight:"800",marginTop:20},status:{color:"#6E2D3A",fontWeight:"700",marginTop:8},
 button:{backgroundColor:"#171713",borderRadius:999,padding:17,alignItems:"center",marginTop:24},buttonText:{color:"#FFF",fontWeight:"800"},note:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:16},notFound:{margin:"auto"}
});
