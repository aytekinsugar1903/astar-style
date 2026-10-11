import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"METHOD_NOT_ALLOWED"},405);
 try{
  const{user,admin}=clients(req);const{data:auth}=await user.auth.getUser();if(!auth.user)return json({error:"UNAUTHORIZED"},401);
  const body=await req.json();const id=String(body.wardrobeItemId??"");if(!id)return json({error:"INVALID_ITEM"},400);
  const{data:item,error}=await user.from("wardrobe_items").select("id,image_path,raw_image_path").eq("id",id).single();if(error||!item)return json({error:"NOT_FOUND"},404);
  const provider=Deno.env.get("BACKGROUND_REMOVAL_PROVIDER")??"mock";
  if(provider==="mock"){
   const{error:updateError}=await admin.from("wardrobe_items").update({cutout_image_path:null,processing_status:"needs_review"}).eq("id",id).eq("user_id",auth.user.id);
   if(updateError)throw updateError;
   return json({provider:"mock",transparent:false,estimatedCostUsd:0,status:"needs_review"});
  }
  if(provider==="vision"){
   const endpoint=Deno.env.get("WARDROBE_VISION_ENDPOINT"),token=Deno.env.get("WARDROBE_VISION_TOKEN");
   if(!endpoint||!token||Deno.env.get("VISION_PROCESSING_ENABLED")!=="true")return json({error:"VISION_PROVIDER_NOT_CONFIGURED"},503);
   const endpointUrl=new URL(endpoint);if(endpointUrl.protocol!=="https:")return json({error:"INVALID_PROVIDER_ENDPOINT"},503);
   const{data:signed,error:signedError}=await admin.storage.from("user-photos").createSignedUrl(item.raw_image_path??item.image_path,120);if(signedError||!signed?.signedUrl)throw new Error("SIGNED_URL_FAILED");
   const response=await fetch(endpointUrl,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${token}`},body:JSON.stringify({image_url:signed.signedUrl,max_parts:1}),signal:AbortSignal.timeout(90_000)});
   if(!response.ok)throw new Error("SEGMENTATION_FAILED");
   const result=await response.json();const part=result.parts?.[0];
   if(!part||typeof part.png_base64!=="string"||part.png_base64.length>12_000_000||typeof part.hash!=="string"||!/^[0-9a-f]{16}$/.test(part.hash))throw new Error("INVALID_SEGMENTATION_RESPONSE");
   const bytes=Uint8Array.from(atob(part.png_base64),char=>char.charCodeAt(0));
   if(bytes.byteLength>8_000_000||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw new Error("INVALID_PNG");
   const path=`${auth.user.id}/cutouts/${id}.png`;
   const uploaded=await admin.storage.from("user-photos").upload(path,bytes,{contentType:"image/png",upsert:true});if(uploaded.error)throw uploaded.error;
   const existing=await user.from("wardrobe_items").select("id,matched_metadata").neq("id",id).limit(500);
   if(existing.error)throw existing.error;
   const similar=(existing.data??[]).filter(entry=>{const value=entry.matched_metadata;if(!value||typeof value!=="object"||Array.isArray(value)||typeof value.image_hash!=="string"||!/^[0-9a-f]{16}$/.test(value.image_hash))return false;let difference=BigInt(`0x${value.image_hash}`)^BigInt(`0x${part.hash}`);let count=0;while(difference){difference&=difference-1n;count++;}return count<=6;}).map(entry=>entry.id);
   const{error:updateError}=await admin.from("wardrobe_items").update({cutout_image_path:path,matched_metadata:{image_hash:part.hash,similar_to:similar,source:"self_hosted_segmentation",verified:false},processing_status:"enriching"}).eq("id",id).eq("user_id",auth.user.id);
   if(updateError){await admin.storage.from("user-photos").remove([path]);throw updateError;}
   return json({provider:"vision",transparent:true,similar_to:similar,estimatedCostUsd:0,status:"enriching"});
  }
  if(provider!=="birefnet")return json({error:"BACKGROUND_PROVIDER_NOT_CONFIGURED"},503);
  if(Deno.env.get("EXTERNAL_PROVIDERS_ENABLED")!=="true")return json({error:"EXTERNAL_PROVIDER_DISABLED"},503);
  const endpoint=Deno.env.get("BIREFNET_ENDPOINT"),token=Deno.env.get("BIREFNET_TOKEN");if(!endpoint||!token)return json({error:"BIREFNET_NOT_CONFIGURED"},503);
  const endpointUrl=new URL(endpoint);if(endpointUrl.protocol!=="https:")return json({error:"INVALID_PROVIDER_ENDPOINT"},503);
  const{data:signed,error:signedError}=await admin.storage.from("user-photos").createSignedUrl(item.raw_image_path??item.image_path,120);if(signedError||!signed?.signedUrl)throw new Error("SIGNED_URL_FAILED");
  const response=await fetch(endpointUrl,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${token}`},body:JSON.stringify({image_url:signed.signedUrl,format:"png"}),signal:AbortSignal.timeout(45_000)});
  if(!response.ok)throw new Error("SEGMENTATION_FAILED");const result=await response.json();if(typeof result.output_url!=="string")throw new Error("INVALID_SEGMENTATION_RESPONSE");
  const outputUrl=new URL(result.output_url);if(outputUrl.protocol!=="https:"||outputUrl.hostname!==endpointUrl.hostname)throw new Error("UNTRUSTED_SEGMENTATION_URL");
  const image=await fetch(outputUrl,{signal:AbortSignal.timeout(20_000)});if(!image.ok||!image.headers.get("content-type")?.toLowerCase().startsWith("image/png"))throw new Error("SEGMENTATION_DOWNLOAD_FAILED");
  if(Number(image.headers.get("content-length")??0)>10_000_000)throw new Error("SEGMENTATION_IMAGE_TOO_LARGE");
  const bytes=await image.arrayBuffer();if(bytes.byteLength>10_000_000)throw new Error("SEGMENTATION_IMAGE_TOO_LARGE");const path=`${auth.user.id}/cutouts/${id}.png`;
  const uploaded=await admin.storage.from("user-photos").upload(path,bytes,{contentType:"image/png",upsert:true});if(uploaded.error)throw uploaded.error;
  const{error:updateError}=await admin.from("wardrobe_items").update({cutout_image_path:path,processing_status:"enriching"}).eq("id",id).eq("user_id",auth.user.id);if(updateError)throw updateError;
  return json({provider:"birefnet",transparent:true,estimatedCostUsd:Number(result.estimated_cost_usd??0),status:"enriching"});
 }catch(error){console.error("background_remove_failed",error);return json({error:"OPERATION_FAILED"},400);}
});

