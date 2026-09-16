import type { TryOnProvider } from "./types.ts";

export const mockTryOnProvider: TryOnProvider = {
  name: "mock",
  model: "mock-v1",
  estimatedCostUsd: 0,
  async run() {
    return { status: "succeeded" };
  },
};
