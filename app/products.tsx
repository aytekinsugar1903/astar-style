import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { mockProducts } from "@/catalog/mock-products";

const filters = ["Tümü","Siyah","Krem","Bordo"];

export default function ProductsScreen() {
  const router=useRouter();
  const [query,setQuery]=useState("");
  const [color,setColor]=useState("Tümü");
  const [budget,setBudget]=useState("");
  const products=useMemo(()=>{
    const max=Number(budget)||Infinity;
    return mockProducts.filter(p=>
      p.price<=max && (color==="Tümü"||p.color===color) &&
      (p.name+" "+p.brand+" "+p.category).toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))
    ).sort((a,b)=>b.styleScore-a.styleScore);
  },[budget,color,query]);

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <Pressable onPress={()=>router.back()}><Text style={s.back}>← Geri</Text></Pressable>
    <Text style={s.title}>Ürün ara</Text><Text style={s.copy}>Bütçene ve stil profiline göre sıralandı.</Text>
    <TextInput style={s.input} placeholder="Elbise, ceket, ayakkabı…" value={query} onChangeText={setQuery}/>
    <TextInput style={s.input} placeholder="En yüksek bütçe (TL)" keyboardType="numeric" value={budget} onChangeText={setBudget}/>
    <View style={s.filters}>{filters.map(x=><Pressable key={x} onPress={()=>setColor(x)} style={[s.filter,color===x&&s.filterOn]}><Text style={[s.filterText,color===x&&s.filterTextOn]}>{x}</Text></Pressable>)}</View>
    <Text style={s.count}>{products.length} ürün · stil uyumuna göre</Text>
    {products.map(p=><Pressable key={p.id} style={s.card} onPress={()=>router.push({pathname:"/product/[id]",params:{id:p.id}})}>
      <View style={[s.swatch,{backgroundColor:p.color==="Siyah"?"#222":p.color==="Bordo"?"#6E2D3A":"#E7DFD0"}]}/>
      <View style={s.info}><Text style={s.brand}>{p.brand}</Text><Text style={s.name}>{p.name}</Text><Text style={s.meta}>{p.category} · {p.color}</Text><Text style={s.price}>{p.price.toLocaleString("tr-TR")} TL</Text></View>
      <View style={s.score}><Text style={s.scoreNumber}>%{p.styleScore}</Text><Text style={s.scoreLabel}>uyum</Text></View>
    </Pressable>)}
    {products.length===0&&<Text style={s.empty}>Filtrelerine uyan demo ürün bulunamadı.</Text>}
    <Text style={s.notice}>Demo katalog · Gerçek ürünler yalnızca resmî API veya affiliate feed ile eklenecek.</Text>
  </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F1E8"},page:{padding:22,paddingBottom:50,width:"100%",maxWidth:760,alignSelf:"center"},back:{color:"#6E2D3A",fontWeight:"700",marginTop:12},
 title:{fontSize:40,fontWeight:"600",marginTop:26,color:"#171713"},copy:{color:"#6B665F",marginTop:8,marginBottom:20},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#DED6C9",borderRadius:14,padding:14,fontSize:15,marginBottom:10},
 filters:{flexDirection:"row",flexWrap:"wrap",gap:8,marginVertical:8},filter:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#D1C8BA",borderRadius:999,paddingVertical:9,paddingHorizontal:13},filterOn:{backgroundColor:"#171713"},filterText:{fontWeight:"600"},filterTextOn:{color:"#FFF"},
 count:{fontSize:12,color:"#777168",marginVertical:14},card:{backgroundColor:"#FFF",borderRadius:20,padding:12,marginBottom:11,flexDirection:"row",alignItems:"center",gap:13},swatch:{width:72,height:92,borderRadius:14},info:{flex:1},brand:{fontSize:11,color:"#7B746B",textTransform:"uppercase",letterSpacing:1},name:{fontSize:17,fontWeight:"700",marginTop:5,color:"#171713"},meta:{fontSize:12,color:"#716B63",marginTop:4},price:{fontSize:15,fontWeight:"800",marginTop:9},score:{alignItems:"center"},scoreNumber:{color:"#6E2D3A",fontWeight:"900"},scoreLabel:{fontSize:10,color:"#817A72"},empty:{padding:30,textAlign:"center"},notice:{fontSize:11,lineHeight:17,color:"#777168",textAlign:"center",marginTop:20}
});
