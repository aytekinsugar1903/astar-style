import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    const { wardrobeItemId } = await req.json();

    const { data: item, error } = await user.from("wardrobe_items").select("id,user_id,image_path").eq("id", wardrobeItemId).single();
    if (error || !item) return json({ error: "NOT_FOUND" }, 404);

    const startedAt = Date.now();
    const reservation = await reserveUsage(admin, auth.user.id, usageLimits.garmentClassification);
    if (!reservation.allowed) return json(limitPayload(reservation), 429);

    try {
      const analysis = { category: "other", colors: [] as string[], style_tags: ["analiz-bekliyor"], seasons: ["all"], ai_confidence: 0 };
      const { error: updateError } = await admin.from("wardrobe_items").update(analysis).eq("id", item.id).eq("user_id", auth.user.id);
      if (updateError) throw updateError;
      await finishUsage(admin, reservation.event_id!, startedAt, true);
      return json({ provider: "mock", estimatedCostUsd: 0, analysis });
    } catch (error) {
      if (reservation.event_id) await finishUsage(admin, reservation.event_id, startedAt, false);
      throw error;
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
