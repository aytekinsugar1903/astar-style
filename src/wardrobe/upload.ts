import { supabase } from "@/lib/supabase";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export async function uploadWardrobeImage(
  userId: string,
  uri: string,
  contentType = "image/jpeg",
  folder = "",
) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Fotoğraf okunamadı.");

  const body = await response.arrayBuffer();
  const suffix = Math.random().toString(36).slice(2, 9);
  const extension = extensions[contentType] ?? "jpg";
  const path = `${userId}/${folder ? `${folder}/` : ""}${Date.now()}-${suffix}.${extension}`;

  const uploaded = await supabase.storage.from("user-photos").upload(path, body, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploaded.error) throw uploaded.error;
  return path;
}

