export type GarmentAnalysis = {
  category: "dress" | "trousers" | "skirt" | "shirt" | "tshirt" | "jacket" | "shoes" | "bag" | "accessory" | "other";
  colors: string[];
  style_tags: string[];
  seasons: string[];
  ai_confidence: number;
};

export interface GarmentAnalysisProvider {
  readonly name: string;
  readonly model: string;
  readonly estimatedCostUsd: number;
  analyze(imageUrl: string): Promise<GarmentAnalysis>;
}
