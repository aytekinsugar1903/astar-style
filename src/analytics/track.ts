import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export async function track(eventName:string,properties:Record<string,unknown>={}){
  if(!isSupabaseConfigured)return;
  const {data}=await supabase.auth.getUser();
  if(!data.user)return;
  await supabase.from("analytics_events").insert({
    user_id:data.user.id,
    event_name:eventName.slice(0,80),
    properties,
  });
}
