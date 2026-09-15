import { supabase } from "@/lib/supabase";

export async function uploadWardrobeImage(userId: string, uri: string) {
  const response = await fetch(uri);
  const body = await response.arrayBuffer();
  const suffix = Math.random().toString(36).slice(2, 9);
  const path = `${userId}/${Date.now()}-${suffix}.jpg`;
  const uploaded = await supabase.storage.from("user-photos").upload(path, body, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;
  return path;
}
