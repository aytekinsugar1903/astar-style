export type WardrobeItem = { id: string; name: string | null; category: string; colors: string[] | null; style_tags: string[] | null; seasons: string[] | null };
export const group = (category: string) => ({ shirt: "top", tshirt: "top", "t-shirt": "top", jacket: "outer", trousers: "bottom", pants: "bottom", skirt: "bottom", dress: "dress", shoes: "shoes", bag: "bag", accessory: "accessory" }[category] ?? "other");
const overlap = (values: string[] | null, preferences: string[]) => {
  const wanted = new Set(preferences.map(value => value.toLocaleLowerCase("tr-TR")));
  return (values ?? []).filter(value => wanted.has(value.toLocaleLowerCase("tr-TR"))).length;
};
export function choose(items: WardrobeItem[], style: string, seed: number, audience: "women" | "men" | "unisex") {
  const ranked = [...items].sort((a, b) => overlap(b.style_tags, [style]) - overlap(a.style_tags, [style]));
  let variation = Math.abs(Math.trunc(seed));
  // Mixed-radix selection cycles independently through every garment category.
  const first = (key: string) => {
    const candidates = ranked.filter(item => group(item.category) === key);
    if (!candidates.length) return undefined;
    const item = candidates[variation % candidates.length];
    variation = Math.floor(variation / candidates.length);
    return item;
  };
  const picked: WardrobeItem[] = [];
  const hasSeparates = ranked.some(item => group(item.category) === "top") && ranked.some(item => group(item.category) === "bottom");
  const hasDress = audience !== "men" && ranked.some(item => group(item.category) === "dress");
  if (hasDress && (!hasSeparates || seed % 2 === 0)) picked.push(first("dress")!);
  else for (const key of ["top", "bottom"]) { const item = first(key); if (item) picked.push(item); }
  for (const key of ["shoes", "outer", "bag", "accessory"]) {
    const item = first(key);
    if (item && picked.length < 5) picked.push(item);
  }
  return picked;
}

