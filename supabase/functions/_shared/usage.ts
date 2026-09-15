type UsageConfig = {
  operation: string;
  provider: string;
  model: string;
  estimatedCostUsd: number;
  windowSeconds: number;
  maxRequests: number;
  dailyCostLimitUsd: number;
};

type UsageReservation = {
  allowed: boolean;
  event_id?: string;
  reason?: "RATE_LIMITED" | "DAILY_COST_LIMIT";
  retry_after_seconds?: number;
  remaining?: number;
};

export const usageLimits = {
  garmentClassification: {
    operation: "garment_classification", provider: "mock", model: "mock-v1",
    estimatedCostUsd: 0, windowSeconds: 3600, maxRequests: 30, dailyCostLimitUsd: 1,
  },
  outfit: {
    operation: "outfit_generation", provider: "mock", model: "mock-v1",
    estimatedCostUsd: 0, windowSeconds: 3600, maxRequests: 20, dailyCostLimitUsd: 1,
  },
  tryOn: {
    operation: "virtual_try_on", provider: "mock", model: "mock-v1",
    estimatedCostUsd: 0, windowSeconds: 3600, maxRequests: 5, dailyCostLimitUsd: 2,
  },
} satisfies Record<string, UsageConfig>;

export async function reserveUsage(admin: any, userId: string, config: UsageConfig): Promise<UsageReservation> {
  const { data, error } = await admin.rpc("reserve_ai_usage", {
    p_user_id: userId,
    p_operation: config.operation,
    p_provider: config.provider,
    p_model: config.model,
    p_estimated_cost_usd: config.estimatedCostUsd,
    p_window_seconds: config.windowSeconds,
    p_max_requests: config.maxRequests,
    p_daily_cost_limit_usd: config.dailyCostLimitUsd,
  });
  if (error) throw error;
  return data as UsageReservation;
}

export async function finishUsage(admin: any, eventId: string, startedAt: number, success: boolean) {
  const { error } = await admin
    .from("ai_usage_events")
    .update({ success, latency_ms: Math.max(0, Date.now() - startedAt) })
    .eq("id", eventId);
  if (error) throw error;
}

export function limitPayload(reservation: UsageReservation) {
  return {
    error: reservation.reason ?? "RATE_LIMITED",
    retryAfterSeconds: reservation.retry_after_seconds ?? 3600,
  };
}
