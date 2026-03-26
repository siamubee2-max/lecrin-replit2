import "dotenv/config";
import { generateImage } from "./server/_core/imageGeneration";

(async () => {
  try {
    const result = await generateImage({
      prompt: "A red ball",
    });
    console.log("SUCCESS:", result.url, result.b64Json?.length);
  } catch (err) {
    console.error("FAILED:", err);
  }
})();
