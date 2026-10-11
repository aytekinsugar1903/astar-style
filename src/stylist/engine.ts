export type ClosetPiece = { id: string; name: string | null; category: string; colors: string[]; style_tags: string[] };
export type StyleContext = { occasion?: string; budget?: number };
export type StylistAnswer = { message: string; selectedIds: string[]; missingQueries: string[]; context: StyleContext };

export function replyToStyleQuestion(question: string, closet: ClosetPiece[], previous: StyleContext, locale: "tr" | "en"): StylistAnswer {
  const text = question.toLocaleLowerCase("tr-TR");
  const amount = text.match(/(?:\b|^)(\d{1,3}(?:[., ]\d{3})+|\d{2,6})\s*(?:tl|₺|try|lira|budget)/i)?.[1];
  const budget = amount ? Number(amount.replace(/[., ]/g, "")) : previous.budget;
  const occasion = /düğün|wedding/.test(text) ? "wedding" : /mülakat|iş görüşmesi|interview/.test(text) ? "interview" : /tatil|holiday/.test(text) ? "holiday" : /akşam|dinner/.test(text) ? "dinner" : /mezuniyet|graduation/.test(text) ? "graduation" : /parti|party/.test(text) ? "party" : previous.occasion ?? "everyday";
  const groups = (category: string) => category === "dress" ? "dress" : ["shirt", "tshirt"].includes(category) ? "top" : ["trousers", "pants", "skirt"].includes(category) ? "bottom" : category;
  const eligible = closet.filter(item => !(occasion === "wedding" && item.category === "dress" && /beyaz|white/i.test([item.name, ...item.colors].join(" "))));
  const preference = /siyah|black/.test(text) ? /siyah|black/ : /mavi|blue/.test(text) ? /mavi|blue|lacivert|navy/ : /krem|cream/.test(text) ? /krem|cream/ : null;
  const sorted = [...eligible].sort((a, b) => Number(Boolean(preference?.test([b.name, ...b.colors].join(" ")))) - Number(Boolean(preference?.test([a.name, ...a.colors].join(" ")))));
  const selected: ClosetPiece[] = [];
  const take = (group: string) => { const item = sorted.find(entry => groups(entry.category) === group); if (item) selected.push(item); return !!item; };
  if (!take("dress")) { take("top"); take("bottom"); }
  take("shoes");
  if (/soğuk|cold|kış|winter/.test(text) || occasion === "interview") take("jacket");
  const selectedGroups = new Set(selected.map(item => groups(item.category)));
  const missing = selectedGroups.has("dress") ? ["shoes"] : ["top", "bottom", "shoes"];
  const missingGroups = missing.filter(group => !selectedGroups.has(group));
  const queries = missingGroups.map(group => ({ top: "gömlek", bottom: "pantolon", shoes: "ayakkabı" }[group] ?? group));
  const names = selected.map(item => item.name ?? item.category).join(", ");
  const money = budget ? locale === "tr" ? `${budget.toLocaleString("tr-TR")} TL` : `${budget.toLocaleString("en-US")} TRY` : "";
  const message = locale === "tr"
    ? `${names ? `Önce dolabından: ${names}.` : "Dolabında bu isteğe uygun kayıtlı parça bulamadım."} ${queries.length ? `Eksik parçalar: ${queries.join(", ")}.` : "Yeni ürün satın alman gerekmiyor."}${money ? ` Toplam bütçe: ${money}; gerçek ürün fiyatları bağlanmadan harcama hesabı veremem.` : " Bütçeni TL olarak yazarsan eksik parçalara pay ayırabilirim."} Fotoğraf denemesi gerçek beden uyumunu garanti etmez.`
    : `${names ? `Start with your closet: ${names}.` : "No matching pieces found in your saved wardrobe."} ${queries.length ? `Missing: ${queries.join(", ")}.` : "No new purchase needed."}${money ? ` Total budget: ${money}; live prices are needed for a spending estimate.` : " Tell me your budget in TRY to plan missing pieces."} A photo preview cannot guarantee fit.`;
  return { message, selectedIds: selected.map(item => item.id), missingQueries: queries, context: { occasion, budget } };
}

