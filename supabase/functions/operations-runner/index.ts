import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

const JOBS = new Set(["daily_health", "weekly_insights"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const { user, admin } = clients(req);
  const { data: auth } = await user.auth.getUser();
  if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
  if (auth.user.app_metadata?.role !== "admin") return json({ error: "FORBIDDEN" }, 403);

  const { jobName = "daily_health" } = await req.json().catch(() => ({}));
  if (!JOBS.has(jobName)) return json({ error: "INVALID_JOB" }, 400);
  const startedAt = new Date();
  const { data: run, error: runError } = await admin.from("automation_runs")
    .insert({ job_name: jobName, status: "running" }).select("id").single();
  if (runError) return json({ error: "RUN_LOG_FAILED" }, 500);

  try {
    const since = new Date(startedAt.getTime() - (jobName === "weekly_insights" ? 7 : 1) * 86_400_000).toISOString();
    const [products, offers, clicks, tryOns, outfits, usage] = await Promise.all([
      admin.from("products").select("*", { count: "exact", head: true }).eq("active", true),
      admin.from("product_offers").select("*", { count: "exact", head: true }),
      admin.from("affiliate_clicks").select("*", { count: "exact", head: true }).gte("created_at", since),
      admin.from("try_on_jobs").select("*", { count: "exact", head: true }).gte("created_at", since),
      admin.from("outfits").select("*", { count: "exact", head: true }).gte("created_at", since),
      admin.from("ai_usage_events").select("estimated_cost_usd,success").gte("created_at", since).limit(10000),
    ]);
    for (const result of [products, offers, clicks, tryOns, outfits, usage]) if (result.error) throw result.error;
    const rows = usage.data ?? [];
    const metrics = {
      window_started_at: since,
      active_products: products.count ?? 0,
      product_offers: offers.count ?? 0,
      affiliate_clicks: clicks.count ?? 0,
      try_on_count: tryOns.count ?? 0,
      outfits_created: outfits.count ?? 0,
      ai_calls: rows.length,
      failed_ai_calls: rows.filter((row) => !row.success).length,
      estimated_ai_cost_usd: rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0),
    };
    const completedAt = new Date().toISOString();
    const { error } = await admin.from("automation_runs").update({
      status: "succeeded", metrics, completed_at: completedAt,
    }).eq("id", run.id);
    if (error) throw error;
    return json({ id: run.id, jobName, status: "succeeded", metrics });
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN_ERROR";
    await admin.from("automation_runs").update({
      status: "failed", error_code: code, completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    console.error("operations_runner_failed", { jobName, code });
    return json({ error: "OPERATION_FAILED" }, 500);
  }
});

