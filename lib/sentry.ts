/**
 * Sentry — Monitoring des erreurs Écrin Virtuel
 *
 * Initialise Sentry pour le monitoring des erreurs iOS/Android/web.
 *
 * Variables d'environnement requises :
 *   EXPO_PUBLIC_SENTRY_DSN  — DSN Sentry (ex: https://xxx@sentry.io/yyy)
 */

import * as SentryRN from "@sentry/react-native";
import { Platform } from "react-native";

let _initialized = false;

export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn("[Sentry] EXPO_PUBLIC_SENTRY_DSN not set — error monitoring disabled");
    return;
  }
  if (_initialized) return;

  SentryRN.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    attachScreenshot: true,
    attachViewHierarchy: true,
    integrations: [
      SentryRN.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: false,
      }),
    ],
    beforeSend(event) {
      // Filtrer les erreurs non critiques en production
      if (!__DEV__ && event.level === "info") return null;
      return event;
    },
  });

  _initialized = true;
  console.log(`[Sentry] Initialized (platform: ${Platform.OS}, env: ${__DEV__ ? "dev" : "prod"})`);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function setSentryUser(userId: string, email?: string): void {
  if (!_initialized) return;
  SentryRN.setUser({ id: userId, email });
}

export function clearSentryUser(): void {
  if (!_initialized) return;
  SentryRN.setUser(null);
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!_initialized) {
    console.error("[Sentry] Error (not initialized):", error);
    return;
  }
  SentryRN.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    SentryRN.captureException(error);
  });
}

export function captureMessage(message: string, level: SentryRN.SeverityLevel = "info"): void {
  if (!_initialized) return;
  SentryRN.captureMessage(message, level);
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  if (!_initialized) return;
  SentryRN.addBreadcrumb({ message, category, data, level: "info" });
}

export function setSentryTag(key: string, value: string): void {
  if (!_initialized) return;
  SentryRN.setTag(key, value);
}

// ─── Wrapper HOC pour les écrans ─────────────────────────────────────────────

export const withSentryProfiler = SentryRN.withProfiler;
export const SentryErrorBoundary = SentryRN.ErrorBoundary;
