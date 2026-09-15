import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    if (auth.user.app_metadata?.role !== "admin") return json({ error: "FORBIDDEN" }, 403);

    const [profiles, products, tryOns, clicks, usage] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("products").select("*", { count: "exact", head: true }),
      admin.from("try_on_jobs").select("*", { count: "exact", head: true }),
      admin.from("affiliate_clicks").select("*", { count: "exact", head: true }),
      admin.from("ai_usage_events").select("estimated_cost_usd,success,operation"),
    ]);
    const events = usage.data ?? [];
    const aiCostUsd = events.reduce((total, row) => total + Number(row.estimated_cost_usd), 0);
    const failedAiCalls = events.filter((row) => !row.success).length;

    return json({
      users: profiles.count ?? 0,
      products: products.count ?? 0,
      tryOnCount: tryOns.count ?? 0,
      affiliateClicks: clicks.count ?? 0,
      aiCostUsd,
      failedAiCalls,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
