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
