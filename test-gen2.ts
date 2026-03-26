import "dotenv/config";
import { ENV } from "./server/_core/env";

(async () => {
    const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
    const body = {
      instances: [{ prompt: "A red ball" }],
      parameters: { sampleCount: 1 }
    };
    for (const model of ["imagen-3.0-generate-001", "imagen-3.0-generate-002", "imagen-3.0-generate-001:generateImages"]) {
      const url = model.includes(":") 
        ? `${GEMINI_API_BASE}/models/${model}?key=${ENV.geminiApiKey}` 
        : `${GEMINI_API_BASE}/models/${model}:predict?key=${ENV.geminiApiKey}`;
      const res = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      console.log(model, res.status, await res.text().then(t => t.substring(0, 150)));
    }
})();
