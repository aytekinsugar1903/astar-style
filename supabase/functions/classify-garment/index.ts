import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";
import { mockGarmentProvider } from "./providers/mock.ts";
import { createOpenAiGarmentProvider } from "./providers/openai.ts";
import type { GarmentAnalysisProvider } from "./providers/types.ts";

function provider(): GarmentAnalysisProvider {
  const name = Deno.env.get("GARMENT_ANALYSIS_PROVIDER") ?? "mock";
  if (name === "mock") return mockGarmentProvider;
  if (name !== "openai") throw new Error("GARMENT_PROVIDER_NOT_CONFIGURED");
  if (Deno.env.get("PAID_PROVIDERS_ENABLED") !== "true") throw new Error("PAID_PROVIDER_DISABLED");
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_VISION_MODEL");
  const estimatedCostUsd = Number(Deno.env.get("OPENAI_VISION_ESTIMATED_COST_USD"));
  if (!apiKey || !model || !Number.isFinite(estimatedCostUsd) || estimatedCostUsd <= 0) throw new Error("OPENAI_NOT_CONFIGURED");
  return createOpenAiGarmentProvider(apiKey, model, estimatedCostUsd);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    const { wardrobeItemId } = await req.json();
    if (!wardrobeItemId) return json({ error: "INVALID_ITEM" }, 400);

    const { data: item, error } = await user.from("wardrobe_items").select("id,user_id,image_path").eq("id", wardrobeItemId).single();
    if (error || !item) return json({ error: "NOT_FOUND" }, 404);

    const source = provider();
    const startedAt = Date.now();
    const config = { ...usageLimits.garmentClassification, provider: source.name, model: source.model, estimatedCostUsd: source.estimatedCostUsd };
    const reservation = await reserveUsage(admin, auth.user.id, config);
    if (!reservation.allowed) return json(limitPayload(reservation), 429);

    try {
      const { data: signed, error: signedError } = await admin.storage.from("user-photos").createSignedUrl(item.image_path, 120);
      if (signedError || !signed?.signedUrl) throw new Error("SIGNED_URL_FAILED");
      const analysis = await source.analyze(signed.signedUrl);
      const { error: updateError } = await admin.from("wardrobe_items").update(analysis).eq("id", item.id).eq("user_id", auth.user.id);
      if (updateError) throw updateError;
      await finishUsage(admin, reservation.event_id!, startedAt, true);
      return json({ provider: source.name, estimatedCostUsd: source.estimatedCostUsd, analysis });
    } catch (error) {
      if (reservation.event_id) await finishUsage(admin, reservation.event_id, startedAt, false);
      throw error;
    }
  } catch (error) {
    console.error("garment_analysis_failed", error instanceof Error ? error.message : "UNKNOWN_ERROR");
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const safe = ["PAID_PROVIDER_DISABLED","OPENAI_NOT_CONFIGURED","GARMENT_PROVIDER_NOT_CONFIGURED"].includes(message) ? message : "OPERATION_FAILED";
    return json({ error: safe }, safe === "OPERATION_FAILED" ? 400 : 503);
  }
});

