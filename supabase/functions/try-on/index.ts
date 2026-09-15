import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    const { jobId } = await req.json();

    const { data: job, error } = await user.from("try_on_jobs").select("id,user_id,status").eq("id", jobId).single();
    if (error || !job) return json({ error: "NOT_FOUND" }, 404);
    if (job.status !== "queued") return json({ id: job.id, status: job.status });

    const { error: updateError } = await admin.from("try_on_jobs").update({
      status: "succeeded", completed_at: new Date().toISOString(), estimated_cost_usd: 0,
    }).eq("id", job.id).eq("user_id", auth.user.id);
    if (updateError) throw updateError;

    await admin.from("ai_usage_events").insert({
      user_id: auth.user.id, operation: "virtual_try_on", provider: "mock",
      model: "mock-v1", success: true, latency_ms: 0, estimated_cost_usd: 0,
    });
    return json({ id: job.id, status: "succeeded", provider: "mock", estimatedCostUsd: 0, imageUrl: null });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
