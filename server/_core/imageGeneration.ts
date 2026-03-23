/**
 * Image generation helper using internal ImageService
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "../storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResponse> {
  if (!ENV.forgeApiUrl) {
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: (options.originalImages || []).map((img) => ({
        url: img.url,
        b64_json: img.b64Json,
        mime_type: img.mimeType,
      })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`,
    );
  }

  // Parse JSON safely — the API may return non-JSON on some edge cases
  const responseText = await response.text();
  let result: Record<string, unknown>;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Image generation returned invalid JSON (status ${response.status}): ${responseText.slice(0, 200)}`,
    );
  }

  const image = result.image as Record<string, string> | undefined;
  if (!image) {
    throw new Error(
      `Image generation returned unexpected format: ${JSON.stringify(result).slice(0, 200)}`,
    );
  }
  // Handle both camelCase (b64Json) and snake_case (b64_json) field names
  const base64Data = image.b64Json || image.b64_json;
  const imageMimeType = image.mimeType || image.mime_type || "image/png";
  if (!base64Data) {
    throw new Error(
      `Image generation returned no image data: ${JSON.stringify(result).slice(0, 200)}`,
    );
  }
  const buffer = Buffer.from(base64Data, "base64");

  // Save to S3
  const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, imageMimeType);
  return {
    url,
  };
}
