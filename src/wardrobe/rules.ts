export type OccasionContext = {
  occasion: string;
  temperatureC?: number;
  surface?: "indoor" | "grass" | "cobblestone" | "sand";
  timeOfDay?: "day" | "evening";
};

export type RuleItem = {
  id: string;
  name?: string | null;
  category: string;
  colors?: string[] | null;
  style_tags?: string[] | null;
  seasons?: string[] | null;
};

const normalized = (values: Array<string | null | undefined>) =>
  values.filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");

export function wardrobeRuleReasons(item: RuleItem, context: OccasionContext) {
  const reasons: string[] = [];
  const words = normalized([item.name, item.category, ...(item.colors ?? []), ...(item.style_tags ?? [])]);
  const occasion = context.occasion.toLocaleLowerCase("tr-TR");

  if ((occasion.includes("düğün") || occasion.includes("wedding")) && item.category === "dress" && /beyaz|white/.test(words)) {
    reasons.push("wedding_white_dress");
  }
  if (context.surface === "grass" && /ince topuk|stiletto|thin heel/.test(words)) reasons.push("grass_thin_heels");
  if (context.surface === "sand" && /topuk|heel|stiletto/.test(words)) reasons.push("sand_heels");
  if (typeof context.temperatureC === "number") {
    if (context.temperatureC >= 27 && /kış|winter|yün|wool/.test(words)) reasons.push("too_warm");
    if (context.temperatureC <= 10 && /yaz|summer|sandalet|sandal/.test(words)) reasons.push("too_cold");
  }
  return reasons;
}

export function eligibleWardrobe<T extends RuleItem>(items: T[], context: OccasionContext) {
  const excluded = items.flatMap((item) => {
    const reasons = wardrobeRuleReasons(item, context);
    return reasons.length ? [{ id: item.id, reasons }] : [];
  });
  const excludedIds = new Set(excluded.map((item) => item.id));
  return { eligible: items.filter((item) => !excludedIds.has(item.id)), excluded };
}

