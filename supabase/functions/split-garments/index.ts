import { clients } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/http.ts";

type Part = { png_base64: string; box: number[]; hash: string };
const hashDistance = (a: string, b: string) => {
  let bits = BigInt(`0x${a}`) ^ BigInt(`0x${b}`);
  let count = 0;
  while (bits) { bits &= bits - 1n; count++; }
  return count;
};

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const uploaded: string[] = [];
  let sourcePath = "";
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    const body = await req.json();
    sourcePath = String(body.imagePath ?? "");
    if (!/^[-a-f0-9]{36}\/incoming\/[-a-zA-Z0-9.]+$/.test(sourcePath) || !sourcePath.startsWith(`${auth.user.id}/incoming/`)) return json({ error: "INVALID_IMAGE_PATH" }, 400);
    const provider = Deno.env.get("WARDROBE_VISION_ENDPOINT");
    const token = Deno.env.get("WARDROBE_VISION_TOKEN");
    if (!provider || !token || Deno.env.get("VISION_PROCESSING_ENABLED") !== "true") return json({ error: "VISION_PROVIDER_NOT_CONFIGURED" }, 503);
    const endpoint = new URL(provider);
    if (endpoint.protocol !== "https:") return json({ error: "INVALID_PROVIDER_URL" }, 503);
    const signed = await admin.storage.from("user-photos").createSignedUrl(sourcePath, 120);
    if (signed.error || !signed.data) throw new Error("SIGNING_FAILED");
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ image_url: signed.data.signedUrl, max_parts: 12 }), signal: AbortSignal.timeout(90_000) });
    if (!response.ok) return json({ error: "IMAGE_PROCESSING_FAILED" }, 422);
    const result = await response.json();
    const parts: Part[] = result.parts;
    if (!Array.isArray(parts) || !parts.length || parts.length > 12) throw new Error("INVALID_RESULT");
    const existing = await user.from("wardrobe_items").select("id,matched_metadata").limit(500);
    if (existing.error) throw existing.error;
    const added: Array<{ id: string; similarTo: string[]; hash: string }> = [];
    try {
      for (const part of parts) {
        if (!/^[0-9a-f]{16}$/.test(part.hash) || !/^[A-Za-z0-9+/=]+$/.test(part.png_base64) || part.png_base64.length > 12_000_000) throw new Error("INVALID_PART");
        const bytes = Uint8Array.from(atob(part.png_base64), char => char.charCodeAt(0));
        if (bytes.byteLength > 8_000_000 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) throw new Error("INVALID_PNG");
        const similarTo = (existing.data ?? []).filter(entry => {
          const value = entry.matched_metadata;
          return value && typeof value === "object" && !Array.isArray(value) && typeof value.image_hash === "string" && /^[0-9a-f]{16}$/.test(value.image_hash) && hashDistance(value.image_hash, part.hash) <= 6;
        }).map(entry => entry.id);
        for (const previous of added) if (hashDistance(previous.hash, part.hash) <= 6) similarTo.push(previous.id);
        const path = `${auth.user.id}/cutouts/${crypto.randomUUID()}.png`;
        const stored = await admin.storage.from("user-photos").upload(path, bytes, { contentType: "image/png", upsert: false });
        if (stored.error) throw stored.error;
        uploaded.push(path);
        const created = await user.from("wardrobe_items").insert({ user_id: auth.user.id, image_path: path, raw_image_path: path, cutout_image_path: path, name: null, category: "other", colors: [], processing_status: "needs_review", matched_metadata: { image_hash: part.hash, similar_to: similarTo, source: "self_hosted_segmentation", verified: false, box: part.box } }).select("id").single();
        if (created.error) throw created.error;
        added.push({ id: created.data.id, similarTo, hash: part.hash });
      }
    } catch (error) {
      for (const entry of added) await user.from("wardrobe_items").delete().eq("id", entry.id);
      if (uploaded.length) await admin.storage.from("user-photos").remove(uploaded);
      throw error;
    }
    const removedSource = await admin.storage.from("user-photos").remove([sourcePath]);
    if (removedSource.error) console.error("incoming_cleanup_failed", removedSource.error.message);
    return json({ added: added.map(({ id, similarTo }) => ({ id, similarTo })), needsReview: true });
  } catch (error) {
    console.error("split_garments_failed", error instanceof Error ? error.message : "UNKNOWN_ERROR");
    return json({ error: "IMAGE_PROCESSING_FAILED" }, 400);
  }
});
