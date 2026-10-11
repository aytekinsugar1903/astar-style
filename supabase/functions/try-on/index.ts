import { corsHeaders, json } from "../_shared/http.ts";
import { clients } from "../_shared/clients.ts";
import { finishUsage, limitPayload, reserveUsage, usageLimits } from "../_shared/usage.ts";
import { createFashnProvider } from "./providers/fashn.ts";
import { mockTryOnProvider } from "./providers/mock.ts";
import type { TryOnProvider } from "./providers/types.ts";

function provider(): TryOnProvider {
  const name = Deno.env.get("TRY_ON_PROVIDER") ?? "mock";
  if (name === "mock") return mockTryOnProvider;
  if (name !== "fashn") throw new Error("TRY_ON_PROVIDER_NOT_CONFIGURED");
  if (Deno.env.get("PAID_PROVIDERS_ENABLED") !== "true") throw new Error("PAID_PROVIDER_DISABLED");
  const apiKey = Deno.env.get("FASHN_API_KEY");
  const estimatedCostUsd = Number(Deno.env.get("FASHN_ESTIMATED_COST_USD"));
  if (!apiKey || !Number.isFinite(estimatedCostUsd) || estimatedCostUsd <= 0) throw new Error("FASHN_NOT_CONFIGURED");
  return createFashnProvider(apiKey, estimatedCostUsd);
}

function extension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/jpeg") return "jpg";
  throw new Error("INVALID_RESULT_CONTENT_TYPE");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  let jobId: string | undefined;
  try {
    const { user, admin } = clients(req);
    const { data: auth } = await user.auth.getUser();
    if (!auth.user) return json({ error: "UNAUTHORIZED" }, 401);
    ({ jobId } = await req.json());
    if (!jobId) return json({ error: "INVALID_JOB" }, 400);

    const { data: job, error } = await user.from("try_on_jobs")
      .select("id,user_id,status,person_image_path,garment_image_path")
      .eq("id", jobId).single();
    if (error || !job) return json({ error: "NOT_FOUND" }, 404);
    if (job.status !== "queued") return json({ id: job.id, status: job.status });

    const source = provider();
    const startedAt = Date.now();
    const config = { ...usageLimits.tryOn, provider: source.name, model: source.model, estimatedCostUsd: source.estimatedCostUsd };
    const reservation = await reserveUsage(admin, auth.user.id, config);
    if (!reservation.allowed) return json(limitPayload(reservation), 429);

    try {
      const { data: person, error: personError } = await admin.storage.from("user-photos").createSignedUrl(job.person_image_path, 180);
      const { data: garment, error: garmentError } = await admin.storage.from("user-photos").createSignedUrl(job.garment_image_path, 180);
      if (personError || garmentError || !person?.signedUrl || !garment?.signedUrl) throw new Error("SIGNED_URL_FAILED");

      const { error: processingError } = await admin.from("try_on_jobs").update({
        provider: source.name, status: "processing", estimated_cost_usd: source.estimatedCostUsd,
      }).eq("id", job.id).eq("user_id", auth.user.id);
      if (processingError) throw processingError;

      const result = await source.run({ personImageUrl: person.signedUrl, garmentImageUrl: garment.signedUrl });
      if (result.status === "failed") {
        await admin.from("try_on_jobs").update({
          status: "failed", error_code: (result.errorCode ?? "PROVIDER_FAILED").slice(0, 120), completed_at: new Date().toISOString(),
        }).eq("id", job.id).eq("user_id", auth.user.id);
        await finishUsage(admin, reservation.event_id!, startedAt, false);
        return json({ id: job.id, status: "failed", error: result.errorCode ?? "PROVIDER_FAILED" }, 502);
      }

      let resultPath: string | null = null;
      if (result.imageUrl) {
        const resultUrl = new URL(result.imageUrl);
        if (resultUrl.protocol !== "https:") throw new Error("INVALID_RESULT_URL");
        const image = await fetch(resultUrl);
        if (!image.ok) throw new Error("RESULT_DOWNLOAD_FAILED");
        const contentType = image.headers.get("content-type")?.split(";")[0] ?? "";
        const bytes = new Uint8Array(await image.arrayBuffer());
        if (!bytes.length || bytes.length > 12_582_912) throw new Error("INVALID_RESULT_SIZE");
        resultPath = `${auth.user.id}/${job.id}.${extension(contentType)}`;
        const uploaded = await admin.storage.from("try-on-results").upload(resultPath, bytes, {
          contentType, cacheControl: "3600", upsert: false,
        });
        if (uploaded.error) throw uploaded.error;
      }

      const { error: updateError } = await admin.from("try_on_jobs").update({
        status: "succeeded", result_image_path: resultPath, error_code: null,
        completed_at: new Date().toISOString(), estimated_cost_usd: source.estimatedCostUsd,
      }).eq("id", job.id).eq("user_id", auth.user.id);
      if (updateError) throw updateError;
      await finishUsage(admin, reservation.event_id!, startedAt, true);
      return json({ id: job.id, status: "succeeded", provider: source.name, estimatedCostUsd: source.estimatedCostUsd, imagePath: resultPath });
    } catch (error) {
      if (reservation.event_id) await finishUsage(admin, reservation.event_id, startedAt, false);
      await admin.from("try_on_jobs").update({
        status: "failed", error_code: error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN_ERROR",
        completed_at: new Date().toISOString(),
      }).eq("id", job.id).eq("user_id", auth.user.id);
      throw error;
    }
  } catch (error) {
    console.error("try_on_failed", { jobId, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" });
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const safe = ["PAID_PROVIDER_DISABLED","FASHN_NOT_CONFIGURED","TRY_ON_PROVIDER_NOT_CONFIGURED"].includes(message) ? message : "OPERATION_FAILED";
    return json({ error: safe }, safe === "OPERATION_FAILED" ? 400 : 503);
  }
});

