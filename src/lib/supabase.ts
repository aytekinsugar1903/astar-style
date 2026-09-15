import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.warn("Supabase environment variables are missing; the UI can run in demo mode.");
}

export const supabase = createClient(url ?? "https://example.supabase.co", publishableKey ?? "demo-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
