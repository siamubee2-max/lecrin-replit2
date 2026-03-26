// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // Textes FR avec apostrophes (l'utilisateur, d'accord, etc.) — évite des centaines d'échappements JSX
      "react/no-unescaped-entities": "off",
    },
  },
]);
