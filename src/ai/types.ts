export type GarmentCategory =
  | "dress" | "trousers" | "skirt" | "shirt" | "tshirt"
  | "jacket" | "shoes" | "bag" | "accessory" | "other";

export interface GarmentAnalysis {
  category: GarmentCategory;
  colors: string[];
  styleTags: string[];
  seasons: string[];
  confidence: number;
}

export interface OutfitRequest {
  locale: "tr" | "en";
  occasion?: string;
  budget?: number;
  currency?: string;
  wardrobeItemIds: string[];
}

export interface OutfitSuggestion {
  title: string;
  explanation: string;
  wardrobeItemIds: string[];
  missingPieces: Array<{ query: string; maxPrice?: number }>;
}

export interface AiProvider {
  analyzeGarment(imageUrl: string): Promise<GarmentAnalysis>;
  createOutfits(request: OutfitRequest): Promise<OutfitSuggestion[]>;
}

export interface TryOnProvider {
  createTryOn(input: { personImageUrl: string; garmentImageUrl: string }): Promise<{ jobId: string }>;
  getResult(jobId: string): Promise<{ status: "queued" | "processing" | "succeeded" | "failed"; imageUrl?: string }>;
}
