import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export function clients(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");
  if (!url || !anon || !service || !authorization) throw new Error("UNAUTHORIZED");

  return {
    user: createClient(url, anon, { global: { headers: { Authorization: authorization } } }),
    admin: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}
