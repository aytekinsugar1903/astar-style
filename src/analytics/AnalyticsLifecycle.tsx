import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { usePathname } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { track } from "@/analytics/track";

export function AnalyticsLifecycle() {
  const { session } = useAuth();
  const pathname = usePathname();
  const active = useRef(AppState.currentState === "active");
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!session) return;

    startedAt.current = Date.now();
    active.current = AppState.currentState === "active";
    void track("session_start");

    const subscription = AppState.addEventListener("change", (nextState) => {
      const nextActive = nextState === "active";

      if (nextActive && !active.current) {
        startedAt.current = Date.now();
        void track("session_start");
      } else if (!nextActive && active.current) {
        const durationSeconds = Math.min(
          86_400,
          Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)),
        );
        void track("session_end", { duration_seconds: durationSeconds });
      }

      active.current = nextActive;
    });

    return () => subscription.remove();
  }, [session?.user.id]);

  useEffect(() => {
    if (!session || !pathname) return;
    void track("screen_view", { screen: pathname.slice(0, 100) });
  }, [pathname, session?.user.id]);

  return null;
}
