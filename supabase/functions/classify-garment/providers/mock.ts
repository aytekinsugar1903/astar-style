import type { GarmentAnalysisProvider } from "./types.ts";

export const mockGarmentProvider: GarmentAnalysisProvider = {
  name: "mock",
  model: "mock-v1",
  estimatedCostUsd: 0,
  async analyze() {
    return { category: "other", colors: [], style_tags: ["analiz-bekliyor"], seasons: ["all"], ai_confidence: 0 };
  },
};

