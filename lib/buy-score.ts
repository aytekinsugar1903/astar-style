export type BuyScoreInput = {
  wardrobeMatch: number;
  outfitCount: number;
  similarOwned: number;
  expectedUse: "low" | "medium" | "high";
};

export type BuyScoreResult = {
  score: number;
  verdict: "strong_match" | "consider" | "low_value";
  reasons: string[];
};

export function calculateBuyScore(input: BuyScoreInput): BuyScoreResult {
  const match = Math.max(0, Math.min(100, input.wardrobeMatch));
  const outfitPoints = Math.min(input.outfitCount, 12) * 2.5;
  const usePoints = input.expectedUse === "high" ? 20 : input.expectedUse === "medium" ? 10 : 0;
  const duplicatePenalty = Math.min(input.similarOwned, 3) * 15;
  const score = Math.round(Math.max(0, Math.min(100, match * 0.5 + outfitPoints + usePoints - duplicatePenalty)));
  return {
    score,
    verdict: score >= 75 ? "strong_match" : score >= 50 ? "consider" : "low_value",
    reasons: [
      `${input.outfitCount} mevcut kombinle eşleşiyor`,
      input.similarOwned ? `Dolabında ${input.similarOwned} benzer parça var` : "Dolabında belirgin bir benzeri yok",
      `Tahmini kullanım: ${input.expectedUse}`,
    ],
  };
}
