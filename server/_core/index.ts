import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { seedMoniattitude, seedBodyParts } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // RevenueCat webhook needs raw body for signature verification
  app.use("/api/webhooks/revenuecat", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ============================================
  // REVENUECAT WEBHOOK
  // ============================================
  app.post("/api/webhooks/revenuecat", async (req, res) => {
    try {
      const body = req.body instanceof Buffer ? JSON.parse(req.body.toString()) : req.body;
      const event = body?.event;
      if (!event) { res.status(400).json({ error: "Missing event" }); return; }

      const appUserId: string | undefined = event.app_user_id;
      const productId: string | undefined = event.product_id;
      const eventType: string = event.type ?? "";

      console.log(`[RevenueCat] Event: ${eventType} | User: ${appUserId} | Product: ${productId}`);

      // Map product IDs to tier + monthly limit
      const PRODUCT_MAP: Record<string, { tier: string; monthlyLimit: number }> = {
        "ecrin.jewelry.monthly":   { tier: "basic", monthlyLimit: 100 },  // Essentiel 14,99€
        "ecrin.essentiel.monthly": { tier: "basic", monthlyLimit: 100 },  // alias renommé
        "ecrin.premium.monthly":   { tier: "premium", monthlyLimit: 150 }, // Premium 24,99€
        "ecrin.premium.yearly":    { tier: "yearly", monthlyLimit: 1500 }, // Annuel 199,99€
      };

      if (appUserId) {
        if (["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"].includes(eventType)) {
          const mapping = productId ? PRODUCT_MAP[productId] : undefined;
          if (mapping) {
            // Store subscription info in DB if user exists
            try {
              const { getDb } = await import("../db.js");
              const drizzleDb = await getDb();
              if (drizzleDb) {
                const { sql } = await import("drizzle-orm");
                await drizzleDb.execute(
                  sql`INSERT INTO user_subscriptions (user_id, tier, monthly_limit, updated_at)
                   VALUES (${appUserId}, ${mapping.tier}, ${mapping.monthlyLimit}, NOW())
                   ON DUPLICATE KEY UPDATE tier = ${mapping.tier}, monthly_limit = ${mapping.monthlyLimit}, updated_at = NOW()`
                );
                console.log(`[RevenueCat] Updated subscription for user ${appUserId}: ${mapping.tier} (${mapping.monthlyLimit}/month)`);
              }
            } catch (dbErr) {
              console.warn("[RevenueCat] DB update skipped:", dbErr);
            }
          }
        } else if (["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"].includes(eventType)) {
          try {
            const { getDb } = await import("../db.js");
            const drizzleDb = await getDb();
            if (drizzleDb) {
              const { sql } = await import("drizzle-orm");
              await drizzleDb.execute(
                sql`UPDATE user_subscriptions SET tier = 'free', monthly_limit = 3, updated_at = NOW() WHERE user_id = ${appUserId}`
              );
              console.log(`[RevenueCat] Reverted subscription for user ${appUserId} to free`);
            }
          } catch (dbErr) {
            console.warn("[RevenueCat] DB revert skipped:", dbErr);
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[RevenueCat] Webhook error:", err);
      res.status(500).json({ error: "Internal error" });
    }
  });

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`[api] server listening on port ${port}`);
    
    // Seed initial data
    try {
      await seedMoniattitude();
      await seedBodyParts();
    } catch (error) {
      console.warn("[Database] Seed failed (database may not be available):", error);
    }
  });
}

startServer().catch(console.error);
