import { supabase } from "@/lib/supabase";

export async function queueTryOn(input:{userId:string;personImagePath:string;garmentImagePath:string}){
  const {data,error}=await supabase.from("try_on_jobs").insert({
    user_id:input.userId,
    provider:"mock",
    status:"queued",
    person_image_path:input.personImagePath,
    garment_image_path:input.garmentImagePath,
    estimated_cost_usd:0,
  }).select("id,status").single();
  if(error) throw error;

  const processed=await supabase.functions.invoke("try-on",{body:{jobId:data.id}});
  if(processed.error) throw processed.error;
  return processed.data as {id:string;status:string};
}
