import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { track } from "@/analytics/track";
import type { TranslationKey } from "@/i18n/translations";

type FunctionErrorPayload = {
  error?: string;
};

function errorType(error: unknown) {
  if (error instanceof FunctionsHttpError) return "http";
  if (error instanceof FunctionsRelayError) return "relay";
  if (error instanceof FunctionsFetchError) return "fetch";
  return error instanceof Error ? error.name.slice(0, 60) : "unknown";
}

export async function functionErrorKey(
  error: unknown,
  area: string,
): Promise<TranslationKey> {
  void track("client_error", {
    area: area.slice(0, 60),
    error_type: errorType(error),
  });

  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json() as FunctionErrorPayload;
      if (payload.error === "RATE_LIMITED") return "rateLimitReached";
      if (payload.error === "DAILY_COST_LIMIT") return "dailyCostLimitReached";
      if (payload.error === "UNAUTHORIZED") return "sessionExpired";
    } catch {
      return "operationFailed";
    }
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return "serviceUnavailable";
  }

  return "operationFailed";
}

