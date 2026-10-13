import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const envKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Development-only fallback. Release builds must not call this project.
const devUrl = "https://dxnfjwtlysfbasverfiw.supabase.co";
const devKey = "sb_publishable_9pSN28HNM__cPGgCFd5Q9g_YF2pnOw7";
const releaseBuild = typeof __DEV__ === "boolean" ? !__DEV__ : process.env.NODE_ENV === "production";
// Play/production stays local unless demo mode is explicitly turned off.
export const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === "true" || (process.env.EXPO_PUBLIC_DEMO_MODE !== "false" && releaseBuild);
const url = envUrl || (isDemoMode ? "" : devUrl);
const publishableKey = envKey || (isDemoMode ? "" : devKey);

export const isSupabaseConfigured = !isDemoMode && Boolean(url && publishableKey);

export const supabase = createClient<Database>(isSupabaseConfigured ? url : "http://127.0.0.1:9", isSupabaseConfigured ? publishableKey : "offline-demo", {
  auth: {
    ...(Platform.OS === "web" ? {} : { storage: AsyncStorage }),
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
    detectSessionInUrl: isSupabaseConfigured && Platform.OS === "web",
  },
});

