import type { AiProvider } from "./types";

export const mockAiProvider: AiProvider = {
  async analyzeGarment() {
    return { category: "dress", colors: ["black"], styleTags: ["minimal", "evening"], seasons: ["all"], confidence: 0.82 };
  },
  async createOutfits(request) {
    const english = request.locale === "en";
    return [{
      title: request.occasion
        ? english ? `Balanced elegance for ${request.occasion}` : `${request.occasion} için sade şıklık`
        : english ? "A balanced look for today" : "Günün dengeli kombini",
      explanation: english
        ? "Pieces in your wardrobe were matched by color, occasion, and seasonal fit."
        : "Gardırobundaki parçalar renk, kullanım alanı ve mevsim uyumuna göre eşleştirildi.",
      wardrobeItemIds: request.wardrobeItemIds.slice(0, 3),
      missingPieces: [],
    }];
  },
};
