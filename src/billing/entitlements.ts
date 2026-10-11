import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type MembershipPlan = "free" | "premium";
export type FeatureKey =
  | "outfit_generation"
  | "virtual_try_on"
  | "advanced_style_analysis"
  | "event_stylist"
  | "personal_shopping";

export const planLimits: Record<MembershipPlan, Record<FeatureKey, number | "unlimited">> = {
  free: {
    outfit_generation: 6,
    virtual_try_on: 1,
    advanced_style_analysis: 0,
    event_stylist: 1,
    personal_shopping: 0,
  },
  premium: {
    outfit_generation: "unlimited",
    virtual_try_on: "unlimited",
    advanced_style_analysis: "unlimited",
    event_stylist: "unlimited",
    personal_shopping: "unlimited",
  },
};

export async function loadMembership(userId?: string): Promise<MembershipPlan> {
  if (!isSupabaseConfigured || !userId) return "free";
  const { data, error } = await supabase.from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data || data.plan !== "premium" || !["active","trialing"].includes(data.status)) return "free";
  if (data.current_period_end && new Date(data.current_period_end).getTime() <= Date.now()) return "free";
  return "premium";
}

export function hasFeature(plan: MembershipPlan, feature: FeatureKey) {
  return planLimits[plan][feature] !== 0;
}

