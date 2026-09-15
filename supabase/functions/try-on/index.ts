import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";

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

    const startedAt = Date.now();
    const reservation = await reserveUsage(admin, auth.user.id, usageLimits.tryOn);
    if (!reservation.allowed) return json(limitPayload(reservation), 429);

    try {
      const { error: updateError } = await admin.from("try_on_jobs").update({
        status: "succeeded", completed_at: new Date().toISOString(), estimated_cost_usd: 0,
      }).eq("id", job.id).eq("user_id", auth.user.id);
      if (updateError) throw updateError;
      await finishUsage(admin, reservation.event_id!, startedAt, true);
      return json({ id: job.id, status: "succeeded", provider: "mock", estimatedCostUsd: 0, imageUrl: null });
    } catch (error) {
      if (reservation.event_id) await finishUsage(admin, reservation.event_id, startedAt, false);
      throw error;
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
