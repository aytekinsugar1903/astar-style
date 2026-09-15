import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";

type WardrobeItem = {
  id: string;
  name: string | null;
  category: string;
  colors: string[] | null;
  style_tags: string[] | null;
  seasons: string[] | null;
};

function overlap(values: string[] | null, preferences: string[]) {
  const wanted = new Set(preferences.map((value) => value.toLocaleLowerCase()));
  return (values ?? []).filter((value) => wanted.has(value.toLocaleLowerCase())).length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);

    const body = await req.json();
    const locale = body.locale === "en" ? "en" : "tr";
    const english = locale === "en";
    const fallbackOccasion = english ? "Everyday" : "Günlük";
    const occasion = String(body.occasion ?? fallbackOccasion).trim().slice(0, 80) || fallbackOccasion;
    const budget = Math.max(0, Math.min(1_000_000, Number(body.budget ?? 0)));

    const [{ data: wardrobe, error: wardrobeError }, { data: styleProfile, error: profileError }, { data: favoriteOutfits, error: favoritesError }] = await Promise.all([
      user.from("wardrobe_items").select("id,name,category,colors,style_tags,seasons").limit(30),
      user.from("style_profiles").select("preferred_colors,style_tags").maybeSingle(),
      user.from("outfits").select("occasion").eq("is_favorite", true).order("created_at", { ascending: false }).limit(10),
    ]);
    if (wardrobeError) throw wardrobeError;
    if (profileError) throw profileError;
    if (favoritesError) throw favoritesError;

    const startedAt = Date.now();
    const reservation = await reserveUsage(admin, auth.user.id, usageLimits.outfit);
    if (!reservation.allowed) return json(limitPayload(reservation), 429);

    try {
      const preferredColors = styleProfile?.preferred_colors ?? [];
      const preferredTags = styleProfile?.style_tags ?? [];
      const ranked = ([...(wardrobe ?? [])] as WardrobeItem[]).sort((a, b) => {
        const score = (item: WardrobeItem) =>
          overlap(item.colors, preferredColors) * 2 + overlap(item.style_tags, preferredTags) * 3;
        return score(b) - score(a);
      });
      const selected = ranked.slice(0, 3);
      const learnedFromFavorites = (favoriteOutfits ?? []).some((item) =>
        item.occasion?.toLocaleLowerCase() === occasion.toLocaleLowerCase()
      );
      const title = english ? `Balanced look for ${occasion}` : `${occasion} için dengeli görünüm`;
      const budgetCopy = budget
        ? english
          ? `Your wardrobe was prioritized, and missing pieces will stay within a total budget of ${budget} TRY.`
          : `Gardırobundaki parçalar önceliklendirildi; eksikler için toplam ${budget} TL sınırı korunacak.`
        : english
          ? "Pieces in your wardrobe were matched by color, occasion, and seasonal fit."
          : "Gardırobundaki parçalar renk, kullanım alanı ve mevsim uyumuna göre eşleştirildi.";
      const learningCopy = learnedFromFavorites
        ? english ? " Outfits you previously liked also influenced this suggestion." : " Daha önce beğendiğin kombinler de bu öneriyi etkiledi."
        : "";
      const explanation = budgetCopy + learningCopy;

      const { data: savedOutfit, error: outfitError } = await user
        .from("outfits")
        .insert({ user_id: auth.user.id, title, occasion, explanation })
        .select("id")
        .single();
      if (outfitError) throw outfitError;

      if (selected.length) {
        const { error: itemsError } = await user.from("outfit_items").insert(
          selected.map((item) => ({ outfit_id: savedOutfit.id, wardrobe_item_id: item.id }))
        );
        if (itemsError) {
          await user.from("outfits").delete().eq("id", savedOutfit.id);
          throw itemsError;
        }
      }

      const response = {
        provider: "mock",
        estimatedCostUsd: 0,
        outfitId: savedOutfit.id,
        suggestion: {
          title,
          explanation,
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
    console.error("outfit_failed", error);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
