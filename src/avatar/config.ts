export type BodyType = "hourglass" | "triangle" | "inverted_triangle" | "rectangle" | "oval";
export type SkinTone = "light" | "medium" | "tan" | "deep";

export type AvatarConfig = {
  heightCm: number;
  weightKg: number;
  bodyType: BodyType;
  skinTone: SkinTone;
  anchors: { shoulderY: number; waistY: number; hipY: number; footY: number; shoulderWidth: number; waistWidth: number };
};

export function buildAvatarConfig(heightCm: number, weightKg: number, bodyType: BodyType, skinTone: SkinTone): AvatarConfig {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const baseWidth = Math.max(76, Math.min(126, 86 + (bmi - 20) * 2));
  const shape = {
    hourglass: [1.04, .78], triangle: [.92, .86], inverted_triangle: [1.12, .88], rectangle: [1, .94], oval: [1, 1.04],
  }[bodyType];
  return {
    heightCm, weightKg, bodyType, skinTone,
    anchors: { shoulderY: 74, waistY: 151, hipY: 194, footY: 362, shoulderWidth: Math.round(baseWidth * shape[0]), waistWidth: Math.round(baseWidth * shape[1]) },
  };
}

