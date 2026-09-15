import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    const { wardrobeItemId } = await req.json();

    const { data: item, error } = await user.from("wardrobe_items").select("id,user_id,image_path").eq("id", wardrobeItemId).single();
    if (error || !item) return json({ error: "NOT_FOUND" }, 404);

    const analysis = { category: "other", colors: [] as string[], style_tags: ["analiz-bekliyor"], seasons: ["all"], ai_confidence: 0 };
    const { error: updateError } = await admin.from("wardrobe_items").update(analysis).eq("id", item.id).eq("user_id", auth.user.id);
    if (updateError) throw updateError;

    await admin.from("ai_usage_events").insert({
      user_id: auth.user.id, operation: "garment_classification", provider: "mock",
      model: "mock-v1", success: true, latency_ms: 0, estimated_cost_usd: 0,
    });
    return json({ provider: "mock", estimatedCostUsd: 0, analysis });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
