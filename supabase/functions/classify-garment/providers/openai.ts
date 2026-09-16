import type { GarmentAnalysis, GarmentAnalysisProvider } from "./types.ts";

const CATEGORIES = new Set(["dress","trousers","skirt","shirt","tshirt","jacket","shoes","bag","accessory","other"]);

function outputText(body: any): string {
  if (typeof body?.output_text === "string") return body.output_text;
  for (const item of body?.output ?? []) {
    for (const content of item?.content ?? []) if (content?.type === "output_text" && typeof content.text === "string") return content.text;
  }
  throw new Error("OPENAI_EMPTY_OUTPUT");
}

function validate(value: any): GarmentAnalysis {
  const category = CATEGORIES.has(value?.category) ? value.category : "other";
  const list = (input: unknown, max: number) => Array.isArray(input)
    ? input.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim().slice(0, 40)).slice(0, max)
    : [];
  const confidence = Math.max(0, Math.min(1, Number(value?.ai_confidence) || 0));
  return { category, colors: list(value?.colors, 6), style_tags: list(value?.style_tags, 8), seasons: list(value?.seasons, 4), ai_confidence: confidence };
}

export function createOpenAiGarmentProvider(apiKey: string, model: string, estimatedCostUsd: number): GarmentAnalysisProvider {
  return {
    name: "openai",
    model,
    estimatedCostUsd,
    async analyze(imageUrl) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          max_output_tokens: 350,
          input: [{
            role: "user",
            content: [
              { type: "input_text", text: "Analyze this garment. Return only a JSON object with category, colors, style_tags, seasons, ai_confidence. category must be one of dress,trousers,skirt,shirt,tshirt,jacket,shoes,bag,accessory,other. Use short Turkish color/style labels. seasons may contain spring,summer,autumn,winter,all." },
              { type: "input_image", image_url: imageUrl, detail: "low" },
            ],
          }],
        }),
      });
      if (!response.ok) throw new Error(`OPENAI_HTTP_${response.status}`);
      const body = await response.json();
      const raw = outputText(body).replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`\s*$/, "");
      return validate(JSON.parse(raw));
    },
  };
}
