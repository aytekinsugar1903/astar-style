import type { AiProvider } from "./types";
const styles={tr:["Minimal","Klasik","Rahat","Romantik","Sokak","Cesur"],en:["Minimal","Classic","Casual","Romantic","Street","Bold"]};
export const mockAiProvider:AiProvider={
 async analyzeGarment(){return{category:"dress",colors:["black"],styleTags:["minimal","evening"],seasons:["all"],confidence:.82};},
 async createOutfits(request){
  const english=request.locale==="en";const labels=english?styles.en:styles.tr;
  return labels.map((style,index)=>({
   title:request.occasion?`${request.occasion} · ${style} ${english?"option":"seçenek"} ${index+1}`:`${style} ${english?"look":"kombin"}`,
   explanation:english?"A distinct styling direction matched to your wardrobe, occasion, and season.":"Gardırobun, etkinlik ve mevsime göre farklı bir stil yönünde eşleştirildi.",
   wardrobeItemIds:[...request.wardrobeItemIds.slice(index%Math.max(1,request.wardrobeItemIds.length)),...request.wardrobeItemIds].filter((id,pos,all)=>all.indexOf(id)===pos).slice(0,4),
   missingPieces:[],
  }));
 },
};

