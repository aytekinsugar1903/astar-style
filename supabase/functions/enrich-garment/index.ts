import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
const normalize=(value:string)=>value.toLocaleLowerCase("tr-TR");
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
 try{
  const{user,admin}=clients(req);const{data:auth}=await user.auth.getUser();if(!auth.user)return json({error:"UNAUTHORIZED"},401);
  const body=await req.json();const id=String(body.wardrobeItemId??"");if(!id)return json({error:"INVALID_ITEM"},400);
  const[{data:item,error:itemError},{data:products,error:productsError}]=await Promise.all([
   user.from("wardrobe_items").select("id,name,category,colors").eq("id",id).single(),
   admin.from("products").select("id,name,brand,category,colors,metadata,product_offers(price,currency)").eq("active",true).limit(100),
  ]);if(itemError||!item)return json({error:"NOT_FOUND"},404);if(productsError)throw productsError;
  const words=[item.name,item.category,...(item.colors??[])].filter(Boolean).map(value=>normalize(String(value)));
  const ranked=(products??[]).map(product=>{const haystack=normalize([product.name,product.brand,product.category,...(product.colors??[])].filter(Boolean).join(" "));return{product,score:words.filter(word=>haystack.includes(word)).length};}).sort((a,b)=>b.score-a.score);
  // Text-only catalog overlap cannot establish a garment's manufacturer, fabric, or purchase price.
  const metadata={source:"text_catalog_suggestions",verified:false,requires_user_review:true,candidates:ranked.filter(entry=>entry.score>0).slice(0,3).map(entry=>({product_id:entry.product.id,product_name:entry.product.name,score:entry.score}))};
  const{error:updateError}=await admin.from("wardrobe_items").update({matched_metadata:metadata,processing_status:"needs_review"}).eq("id",id).eq("user_id",auth.user.id);if(updateError)throw updateError;
  return json({provider:"text_catalog_suggestions",estimatedCostUsd:0,matched_metadata:metadata});
 }catch(error){console.error("enrich_garment_failed",error);return json({error:"OPERATION_FAILED"},400);}
});
