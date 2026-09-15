import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);

    const body = await req.json();
    const locale = body.locale === "en" ? "en" : "tr";
    const fallbackOccasion = locale === "en" ? "Everyday" : "Günlük";
    const occasion = String(body.occasion ?? fallbackOccasion).slice(0, 80);
    const budget = Math.max(0, Number(body.budget ?? 0));

    const { data: wardrobe, error } = await user
      .from("wardrobe_items")
      .select("id,name,category,colors,style_tags,seasons")
      .limit(30);
    if (error) throw error;

    const startedAt = Date.now();
    const reservation = await reserveUsage(admin, auth.user.id, usageLimits.outfit);
    if (!reservation.allowed) return json(limitPayload(reservation), 429);

    try {
      const selected = (wardrobe ?? []).slice(0, 3);
      const english = locale === "en";
      const response = {
        provider: "mock",
        estimatedCostUsd: 0,
        suggestion: {
          title: english ? `Balanced look for ${occasion}` : `${occasion} için dengeli görünüm`,
          explanation: budget
            ? english
              ? `Your wardrobe was prioritized, and missing pieces will stay within a total budget of ${budget} TRY.`
              : `Gardırobundaki parçalar önceliklendirildi; eksikler için toplam ${budget} TL sınırı korunacak.`
            : english
              ? "Pieces in your wardrobe were matched by color, occasion, and seasonal fit."
              : "Gardırobundaki parçalar renk, kullanım alanı ve mevsim uyumuna göre eşleştirildi.",
          wardrobeItemIds: selected.map((item) => item.id),
          missingPieces: selected.length < 2
            ? [{ query: english ? "complementary shoes" : "tamamlayıcı ayakkabı", maxPrice: budget || undefined }]
            : [],
        },
      };
      await finishUsage(admin, reservation.event_id!, startedAt, true);
      return json(response);
    } catch (error) {
      if (reservation.event_id) await finishUsage(admin, reservation.event_id, startedAt, false);
      throw error;
    }
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, 400);
  }
});
