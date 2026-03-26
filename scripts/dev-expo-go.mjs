#!/usr/bin/env node
/**
 * Expo Go sur téléphone : lance l’API + Metro en LAN avec
 * EXPO_PUBLIC_API_BASE_URL=http://<IP_LAN>:<PORT> (pas besoin d’éditer .env).
 */
import { spawn } from "node:child_process";
import os from "node:os";

function getLanIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      const fam = net.family;
      if (fam !== "IPv4" && fam !== 4) continue;
      if (net.internal) continue;
      return net.address;
    }
  }
  return "127.0.0.1";
}

const ip = getLanIPv4();
const apiPort = process.env.PORT || "3000";
const apiUrl = `http://${ip}:${apiPort}`;
const expoPort = process.env.EXPO_PORT || "8081";

console.log("");
console.log("[dev-expo-go] IP LAN      :", ip);
console.log("[dev-expo-go] API (tRPC)  :", apiUrl);
console.log("[dev-expo-go] Metro       :", `http://${ip}:${expoPort}`);
console.log("[dev-expo-go] Même Wi‑Fi que le téléphone, puis scan du QR dans Expo Go.");
console.log("");

const env = {
  ...process.env,
  NODE_ENV: "development",
  EXPO_PUBLIC_API_BASE_URL: apiUrl,
};
// Certains environnements (CI, agents) définissent CI=true → Metro désactive le reload.
delete env.CI;

const child = spawn(
  "npx",
  [
    "concurrently",
    "-k",
    "-n",
    "api,metro",
    "-c",
    "blue,magenta",
    "cross-env NODE_ENV=development tsx watch server/_core/index.ts",
    `cross-env EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --clear --lan -p ${expoPort}`,
  ],
  { env, stdio: "inherit", cwd: process.cwd() },
);

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
