import "dotenv/config";
import { ENV } from "./server/_core/env";

(async () => {
    const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
    const body = {
      contents: [{ role: "user", parts: [{ text: "A red ball" }] }],
      generation_config: { response_modalities: ["IMAGE", "TEXT"] }
    };
    const apiUrl = `${GEMINI_API_BASE}/models/gemini-3.1-flash-image-preview:generateContent?key=${ENV.geminiApiKey}`;
    const res = await fetch(apiUrl, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    console.log(res.status, await res.text().then(t => t.substring(0, 150)));
})();
