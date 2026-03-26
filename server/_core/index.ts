import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { timingSafeEqual } from "crypto";
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

  // Enable CORS with origin allowlist
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);

  // Validate CORS configuration in production
  if (process.env.NODE_ENV === "production" && ALLOWED_ORIGINS.length === 0) {
    console.warn("[Server] WARNING: ALLOWED_ORIGINS not configured for production! Only localhost will be allowed.");
  }
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      // Allow if in allowlist, or localhost only in non-production
      const isAllowed = ALLOWED_ORIGINS.includes(origin)
        || (process.env.NODE_ENV !== "production" && origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/));
      if (isAllowed) {
        res.header("Access-Control-Allow-Origin", origin);
      }
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

  app.use((req, res, next) => {
    console.log(`[Express] ${req.method} ${req.url}`);
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
      // Verify webhook authorization
      const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;
      if (webhookSecret) {
        const authHeader = req.headers.authorization;
        const expectedAuth = `Bearer ${webhookSecret}`;

        // Use timing-safe comparison to prevent timing attacks
        if (!authHeader || typeof authHeader !== "string") {
          console.warn("[RevenueCat] Webhook rejected: invalid authorization");
          res.status(401).json({ error: "Unauthorized" });
          return;
        }

        const authBuffer = Buffer.from(authHeader);
        const expectedBuffer = Buffer.from(expectedAuth);

        // Fail fast if lengths don't match, then use timing-safe comparison
        if (authBuffer.length !== expectedBuffer.length || !timingSafeEqual(authBuffer, expectedBuffer)) {
          console.warn("[RevenueCat] Webhook rejected: invalid authorization");
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      } else {
        console.error("[RevenueCat] REVENUECAT_WEBHOOK_SECRET not configured — rejecting webhook");
        res.status(503).json({ error: "Webhook not configured" });
        return;
      }

      const body = req.body instanceof Buffer ? JSON.parse(req.body.toString()) : req.body;
      const event = body?.event;
      if (!event) { res.status(400).json({ error: "Missing event" }); return; }

      const appUserId: string | undefined = event.app_user_id;
      const productId: string | undefined = event.product_id;
      const eventType: string = event.type ?? "";

      console.log(`[RevenueCat] Event: ${eventType} | User: ${appUserId} | Product: ${productId}`);

      // Map product IDs to tier + monthly limit
      const PRODUCT_MAP: Record<string, { tier: string; monthlyLimit: number }> = {
        "ecrin.jewelry.monthly": { tier: "basic", monthlyLimit: 100 },  // Essentiel 14,99€
        "ecrin.essentiel.monthly": { tier: "basic", monthlyLimit: 100 },  // alias renommé
        "ecrin.premium.monthly": { tier: "premium", monthlyLimit: 150 }, // Premium 24,99€
        "ecrin.premium.monthly.launch10": { tier: "premium", monthlyLimit: 150 },
        "ecrin.premium.yearly": { tier: "yearly", monthlyLimit: 1500 }, // Annuel 199,99€
        "ecrin.premium.yearly.launch50": { tier: "yearly", monthlyLimit: 10000 }, // Offre fondateur
        "ecrin.premium.yearly.launch25": { tier: "yearly", monthlyLimit: 1500 },
        "ecrin.premium.yearly.launch10": { tier: "yearly", monthlyLimit: 1500 },
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
      onError: ({ error, type, path, input, ctx, req }) => {
        console.error(`[tRPC] Error on ${path}:`, error.message);
        console.error(error.cause);
      },
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
