import { clients } from "../_shared/clients.ts";
import { corsHeaders, json } from "../_shared/http.ts";

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user || auth.user.app_metadata?.role !== "admin") return json({ error: "FORBIDDEN" }, 403);
    const { requestId, reply } = await req.json();
    if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId) || typeof reply !== "string" || !reply.trim() || reply.length > 2000) return json({ error: "INVALID_REPLY" }, 400);
    const updated = await admin.from("stylist_requests").update({ stylist_reply: reply.trim(), status: "answered", replied_at: new Date().toISOString() }).eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
    if (updated.error) throw updated.error;
    if (!updated.data) return json({ error: "NOT_FOUND" }, 404);
    return json({ answered: true });
  } catch (error) { console.error("stylist_reply_failed", error); return json({ error: "INTERNAL_ERROR" }, 500); }
});

