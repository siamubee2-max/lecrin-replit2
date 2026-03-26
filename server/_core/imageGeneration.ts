/**
 * Image generation helper using Google Gemini API directly.
 */
import { ENV } from "./env";
import {
  estimateImageApiCallCostUsd,
  markModelFailure,
  markModelSuccess,
  selectAvailableModels,
} from "./aiReliability";

export type GenerateImageOptions = {
  prompt: string;
  modelCandidates?: string[];
  originalImages?: {
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }[];
};

export type GenerateImageResponse = {
  url?: string;
  b64Json?: string;
  mimeType?: string;
  modelUsed?: string;
  apiCalls?: number;
  estimatedCostUsd?: number;
  modelsTried?: string[];
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_IMAGE_MODELS = [
  "gemini-3.1-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

export async function generateImage(
  options: GenerateImageOptions,
): Promise<GenerateImageResponse> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env");
  }

  // Build the `contents` array (text prompt + optional image parts)
  const parts: any[] = [{ text: options.prompt }];

  // Add original images as inlineData parts (for editing tasks)
  if (options.originalImages?.length) {
    for (const img of options.originalImages) {
      let b64 = img.b64Json;
      let mime = img.mimeType ?? "image/jpeg";

      if (!b64 && img.url) {
        try {
          const res = await fetch(img.url);
          if (res.ok) {
            const buf = await res.arrayBuffer();
            b64 = Buffer.from(buf).toString("base64");
            mime = res.headers.get("content-type") ?? mime;
          }
        } catch (e) {
          console.warn("[ImageGen] Failed to fetch image URL for Gemini input:", img.url);
        }
      }

      if (b64) {
        parts.push({
          inlineData: { mimeType: mime, data: b64 },
        });
      }
    }
  }

  const body = {
    contents: [{ role: "user", parts }],
    generation_config: { response_modalities: ["IMAGE", "TEXT"] },
  };
  const preferredModels = options.modelCandidates?.length ? options.modelCandidates : DEFAULT_IMAGE_MODELS;
  const { activeModels, skippedModels } = selectAvailableModels(preferredModels);
  const models = activeModels;
  let b64Json = "";
  let mimeType = "image/jpeg";
  let modelUsed = "";
  let lastError = "";
  let apiCalls = 0;
  const modelsTried: string[] = [];
  let estimatedCostUsd = 0;

  for (const model of models) {
    apiCalls += 1;
    modelsTried.push(model);
    estimatedCostUsd += estimateImageApiCallCostUsd(model);
    const apiUrl = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${ENV.geminiApiKey}`;
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        lastError = `AI image generation failed (${model}) (${res.status} ${res.statusText})${detail ? `: ${detail}` : ""}`;
        markModelFailure(model);
        continue;
      }

      const json = (await res.json()) as {
        candidates?: {
          content?: {
            parts?: {
              inlineData?: { data: string; mimeType: string };
              inline_data?: { data: string; mime_type: string }; // backup
              text?: string;
            }[];
          };
        }[];
      };

      const imagePart = json.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData || p.inline_data,
      );

      const inlineData = imagePart?.inlineData || imagePart?.inline_data;
      if (!inlineData?.data) {
        lastError = `Gemini returned no image in the response (${model})`;
        markModelFailure(model);
        continue;
      }
      b64Json = inlineData.data;
      mimeType = (inlineData as any).mimeType || (inlineData as any).mime_type || "image/jpeg";
      modelUsed = model;
      markModelSuccess(model);
      break;
    } catch (err: any) {
      lastError = err?.message || `Unknown error on model ${model}`;
      markModelFailure(model);
    }
  }

  if (!b64Json) {
    throw new Error(lastError || "AI image generation failed on all models");
  }

  // ── Upload to Supabase Storage to get a public URL ──────────────────────────
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
  const BUCKET = "ecrin-uploads";

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const ext = mimeType.includes("png") ? "png" : "jpg";
      const key = `tryon/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(b64Json, "base64");

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": mimeType,
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      });

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
        return {
          url: publicUrl,
          b64Json,
          mimeType,
          modelUsed,
          apiCalls,
          estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
          modelsTried: [...skippedModels, ...modelsTried],
        };
      } else {
        const errDetail = await uploadRes.text().catch(() => "");
        console.warn(`[ImageGen] Supabase upload failed (${uploadRes.status}): ${errDetail}`);
      }
    } catch (uploadErr) {
      console.warn("[ImageGen] Supabase upload error:", uploadErr);
    }
  }

  return {
    b64Json,
    mimeType,
    modelUsed,
    apiCalls,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
    modelsTried: [...skippedModels, ...modelsTried],
  };
}

