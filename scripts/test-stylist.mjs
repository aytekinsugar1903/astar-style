import assert from "node:assert/strict";
import { replyToStyleQuestion } from "../src/stylist/engine.ts";
const piece = (id, category, name, colors = []) => ({ id, category, name, colors, style_tags: [] });
const closet = [piece("a", "dress", "Beyaz elbise", ["beyaz"]), piece("b", "dress", "Siyah elbise", ["siyah"]), piece("c", "shoes", "Siyah ayakkabı")];
const answer = replyToStyleQuestion("Düğüne gidiyorum, 3.000 TL bütçem var", closet, {}, "tr");
assert.equal(answer.context.budget, 3000);
assert.ok(!answer.selectedIds.includes("a"));
assert.ok(answer.selectedIds.includes("b"));
assert.match(answer.message, /Yeni ürün satın alman gerekmiyor/);
const followUp = replyToStyleQuestion("Siyah olsun", closet, answer.context, "tr");
assert.equal(followUp.context.occasion, "wedding");
assert.equal(followUp.context.budget, 3000);
console.log("Grounded conversational stylist and multi-turn context passed.");

