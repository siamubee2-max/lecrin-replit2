import "dotenv/config";
import { ENV } from "./server/_core/env";

(async () => {
    const KIE_API_BASE = "https://api.kie.ai/v1/images/generations";
    const body = {
      model: "nano-banana-2",
      prompt: "A red ball",
      n: 1
    };
    const res = await fetch(KIE_API_BASE, {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ENV.geminiApiKey}` }, body: JSON.stringify(body),
    });
    console.log(res.status, await res.text().then(t => t.substring(0, 150)));
})();
