import assert from "node:assert/strict";
import { choose, group } from "../supabase/functions/outfit/selection.ts";
import { filterEligible } from "../supabase/functions/outfit/rules.ts";
import { TEMPLATE_COUNT, AUDIENCES, OCCASIONS, SEASONS, STYLES } from "../supabase/functions/outfit/templates.ts";

const garment = (id, category, name = id) => ({ id, category, name, colors: [], style_tags: [], seasons: [] });
const items = [garment("top", "shirt"), garment("bottom", "pants"), garment("dress", "dress"), garment("shoe", "shoes"), garment("outer", "jacket"), garment("heel", "shoes", "ince topuk"), garment("white", "dress", "beyaz elbise")];
assert.equal(TEMPLATE_COUNT, 768);
assert.equal(new Set(AUDIENCES.flatMap(a => OCCASIONS.flatMap(o => SEASONS.flatMap(s => STYLES.map(t => `${a}:${o}:${s}:${t}`))))).size, 768);
assert.ok(TEMPLATE_COUNT >= 200);
const { eligible, excluded } = filterEligible(items, { occasion: "Kır düğünü", surface: "grass", temperatureC: 20 });
assert.ok(excluded.find(item => item.id === "white")?.reasons.includes("wedding_white_dress"));
assert.ok(excluded.find(item => item.id === "heel")?.reasons.includes("grass_thin_heels"));
for (const audience of AUDIENCES) for (let seed = 0; seed < 24; seed++) {
  const selected = choose(eligible, "classic", seed, audience);
  const groups = selected.map(item => group(item.category));
  assert.equal(new Set(groups).size, groups.length);
  assert.ok(!groups.includes("dress") || (!groups.includes("top") && !groups.includes("bottom")));
  assert.ok(audience !== "men" || !groups.includes("dress"));
  assert.ok(groups.includes("shoes"));
}
assert.equal(group("pants"), "bottom");
assert.equal(group("trousers"), "bottom");
const fullCloset = ["shirt", "pants", "shoes", "jacket"].flatMap(category => Array.from({ length: 4 }, (_, index) => garment(`${category}${index}`, category)));
const variants = new Set(Array.from({ length: 256 }, (_, seed) => choose(fullCloset, "classic", seed, "men").map(item => item.id).join("|")));
assert.ok(variants.size >= 200, `expected 200 distinct outfits, received ${variants.size}`);
console.log(`Outfit templates, event exclusions, 72 audience selections, and ${variants.size} distinct full-closet looks passed.`);

