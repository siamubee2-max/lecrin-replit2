import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { ForbiddenError } from "../../shared/_core/errors.js";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a user openId
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {},
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: "ecrin-virtuel",
        name: options.name || "",
      },
      options,
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {},
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null,
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Verify a Supabase JWT token and return the decoded payload.
   */
  async verifySupabaseToken(
    token: string,
  ): Promise<{ sub: string; email?: string; user_metadata?: { name?: string; full_name?: string } } | null> {
    if (!ENV.supabaseJwtSecret) {
      return null;
    }

    try {
      const secret = new TextEncoder().encode(ENV.supabaseJwtSecret);
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
      });

      if (!payload.sub) {
        return null;
      }

      return payload as { sub: string; email?: string; user_metadata?: { name?: string; full_name?: string } };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let bearerToken: string | undefined;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      bearerToken = authHeader.slice("Bearer ".length).trim();
    }

    const cookies = this.parseCookies(req.headers.cookie);
    const signedInAt = new Date();

    // 1. Try Supabase JWT (Bearer token or cookie)
    const supabasePayload = await this.verifySupabaseToken(
      bearerToken ?? cookies.get(COOKIE_NAME) ?? "",
    );
    if (supabasePayload) {
      const openId = `supabase_${supabasePayload.sub}`;
      let user = await db.getUserByOpenId(openId);

      if (!user) {
        const displayName =
          supabasePayload.user_metadata?.name ||
          supabasePayload.user_metadata?.full_name ||
          supabasePayload.email?.split("@")[0] ||
          null;
        await db.upsertUser({
          openId,
          name: displayName,
          email: supabasePayload.email ?? null,
          loginMethod: "supabase",
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(openId);
      }

      if (!user) {
        throw ForbiddenError("Failed to create user");
      }

      await db.upsertUser({ openId, lastSignedIn: signedInAt });
      return user;
    }

    // 2. Try legacy JWT (session cookie or Bearer token)
    const sessionCookie = bearerToken || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (session) {
      const user = await db.getUserByOpenId(session.openId);

      if (user) {
        await db.upsertUser({ openId: user.openId, lastSignedIn: signedInAt });
        return user;
      }
    }

    throw ForbiddenError("Invalid session cookie");
  }
}

export const sdk = new SDKServer();
