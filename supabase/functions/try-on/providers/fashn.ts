import type { TryOnProvider, TryOnResult } from "./types.ts";

const API_BASE = "https://api.fashn.ai/v1";
const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 20;

type FashnPayload = {
  id?: string;
  status?: "starting" | "in_queue" | "processing" | "completed" | "failed";
  output?: string[];
  error?: { name?: string; message?: string } | string | null;
};

async function payload(response: Response): Promise<FashnPayload> {
  const body = await response.json().catch(() => ({})) as FashnPayload;
  if (!response.ok) throw new Error(`FASHN_HTTP_${response.status}`);
  return body;
}

export function createFashnProvider(apiKey: string, estimatedCostUsd: number): TryOnProvider {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` };
  return {
    name: "fashn",
    model: "tryon-v1.6",
    estimatedCostUsd,
    async run(input): Promise<TryOnResult> {
      const started = await payload(await fetch(`${API_BASE}/run`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model_name: "tryon-v1.6",
          inputs: {
            model_image: input.personImageUrl,
            garment_image: input.garmentImageUrl,
            category: "auto",
            mode: "balanced",
            num_samples: 1,
            output_format: "jpeg",
            moderation_level: "conservative",
          },
        }),
      }));
      if (!started.id) throw new Error("FASHN_MISSING_JOB_ID");

      for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        const status = await payload(await fetch(`${API_BASE}/status/${encodeURIComponent(started.id)}`, { headers }));
        if (status.status === "completed") {
          const imageUrl = status.output?.[0];
          if (!imageUrl) return { status: "failed", providerJobId: started.id, errorCode: "FASHN_EMPTY_OUTPUT" };
          return { status: "succeeded", providerJobId: started.id, imageUrl };
        }
        if (status.status === "failed") {
          const code = typeof status.error === "object" && status.error?.name ? status.error.name : "FASHN_FAILED";
          return { status: "failed", providerJobId: started.id, errorCode: code };
        }
      }
      return { status: "failed", providerJobId: started.id, errorCode: "FASHN_TIMEOUT" };
    },
  };
}

