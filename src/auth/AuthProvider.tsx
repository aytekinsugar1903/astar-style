import { AppState } from "react-native";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthValue = { session: Session | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    const appListener = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => { authListener.subscription.unsubscribe(); appListener.remove(); };
  }, []);

  const value = useMemo(() => ({
    session,
    loading,
    signOut: async () => { if (isSupabaseConfigured) await supabase.auth.signOut(); },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
