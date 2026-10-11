import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://dxnfjwtlysfbasverfiw.supabase.co";
const publishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_9pSN28HNM__cPGgCFd5Q9g_YF2pnOw7";
const forceDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

export const isSupabaseConfigured = !forceDemoMode && Boolean(url && publishableKey);

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    ...(Platform.OS === "web" ? {} : { storage: AsyncStorage }),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

