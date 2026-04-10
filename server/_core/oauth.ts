import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as jose from "jose";

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // Get current authenticated user - works with both cookie (web) and Bearer token (mobile)
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  // Establish session cookie from Bearer token
  // Used by iframe preview: frontend receives token via postMessage, then calls this endpoint
  // to get a proper Set-Cookie response from the backend (3000-xxx domain)
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      // Authenticate using Bearer token from Authorization header
      const user = await sdk.authenticateRequest(req);

      // Get the token from the Authorization header to set as cookie
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      // Set cookie for this domain (3000-xxx)
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // ─── Apple Sign In ───────────────────────────────────────────────────────────
  app.post("/api/auth/apple", async (req: Request, res: Response) => {
    const { identityToken, email, fullName } = req.body as {
      identityToken: string;
      email?: string | null;
      fullName?: { givenName?: string | null; familyName?: string | null } | null;
    };

    if (!identityToken) {
      res.status(400).json({ error: "identityToken is required" });
      return;
    }

    try {
      // Verify Apple's identity token using their public JWKS
      const JWKS = jose.createRemoteJWKSet(
        new URL("https://appleid.apple.com/auth/keys"),
      );

      const { payload } = await jose.jwtVerify(identityToken, JWKS, {
        issuer: "https://appleid.apple.com",
        audience: "com.ecrin.jewelry",
      });

      const appleSub = payload.sub as string;
      if (!appleSub) {
        res.status(401).json({ error: "Invalid Apple identity token: missing sub" });
        return;
      }

      const openId = `apple_${appleSub}`;

      // Build display name from Apple's fullName (only provided on first sign-in)
      const displayName =
        fullName?.givenName || fullName?.familyName
          ? [fullName.givenName, fullName.familyName].filter(Boolean).join(" ")
          : null;

      // Upsert user in DB
      await upsertUser({
        openId,
        name: displayName,
        email: (email as string) ?? null,
        loginMethod: "apple",
        lastSignedIn: new Date(),
      });

      const user = await getUserByOpenId(openId);

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: displayName || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie for web clients
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[Apple Auth] Failed:", error);
      res.status(401).json({ error: "Apple authentication failed" });
    }
  });
}
