/**
 * PostHog Analytics — Écrin Virtuel
 *
 * Centralise tous les événements analytics de l'application.
 * Utilise PostHog React Native SDK.
 *
 * Configuration :
 *   EXPO_PUBLIC_POSTHOG_API_KEY  — clé publique PostHog (ex: phc_xxxx)
 *   EXPO_PUBLIC_POSTHOG_HOST     — host PostHog (défaut: https://eu.i.posthog.com)
 */

import PostHog from "posthog-react-native";
import { Platform } from "react-native";

// ─── Singleton PostHog ───────────────────────────────────────────────────────

let _client: PostHog | null = null;

export function getPostHog(): PostHog | null {
  return _client;
}

export async function initPostHog(): Promise<void> {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  if (!apiKey) {
    console.warn("[PostHog] EXPO_PUBLIC_POSTHOG_API_KEY not set — analytics disabled");
    return;
  }
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
  _client = new PostHog(apiKey, {
    host,
    flushAt: 20,
    flushInterval: 30000,
    captureAppLifecycleEvents: true,
  });
  console.log(`[PostHog] Initialized (host: ${host}, platform: ${Platform.OS})`);
}

// ─── Identify ────────────────────────────────────────────────────────────────

export function identifyUser(userId: string, props?: Record<string, unknown>): void {
  _client?.identify(userId, {
    platform: Platform.OS,
    ...props,
  });
}

export function resetUser(): void {
  _client?.reset();
}

// ─── Events ──────────────────────────────────────────────────────────────────

/** Onboarding */
export function trackOnboardingStep(step: number, name: string): void {
  _client?.capture("onboarding_step_viewed", { step, name });
}

export function trackOnboardingCompleted(): void {
  _client?.capture("onboarding_completed");
}

/** Essayage virtuel */
export function trackTryOnStarted(props: {
  mode: "single" | "outfit";
  jewelryType?: string;
  modelType?: string;
}): void {
  _client?.capture("tryon_started", props);
}

export function trackTryOnCompleted(props: {
  mode: "single" | "outfit";
  jewelryType?: string;
  durationMs?: number;
  success: boolean;
}): void {
  _client?.capture("tryon_completed", props);
}

export function trackTryOnShared(props: {
  destination: "story" | "community" | "native" | "download";
  hasSnapshot?: boolean;
}): void {
  _client?.capture("tryon_shared", props);
}

export function trackTryOnSaved(): void {
  _client?.capture("tryon_saved_to_gallery");
}

/** Boutique */
export function trackBoutiqueItemViewed(props: {
  itemId: string | number;
  itemName: string;
  brandName?: string;
  price?: number;
}): void {
  _client?.capture("boutique_item_viewed", props);
}

export function trackBoutiqueTryOnTapped(props: {
  itemId: string | number;
  itemName: string;
}): void {
  _client?.capture("boutique_tryon_tapped", props);
}

/** Abonnement & Achats */
export function trackPaywallShown(trigger: string): void {
  _client?.capture("paywall_shown", { trigger });
}

export function trackPaywallDismissed(trigger: string): void {
  _client?.capture("paywall_dismissed", { trigger });
}

export function trackSubscriptionPurchased(props: {
  productId: string;
  tier: "jewelry" | "premium";
  period: "monthly" | "yearly";
  price?: number;
}): void {
  _client?.capture("subscription_purchased", props);
}

export function trackCreditsPurchased(props: {
  productId: string;
  credits: number;
  price?: number;
}): void {
  _client?.capture("credits_purchased", props);
}

export function trackSubscriptionRestored(tier: string): void {
  _client?.capture("subscription_restored", { tier });
}

/** Communauté */
export function trackPostCreated(props: {
  hasSnapshot: boolean;
  snapshotFrame?: string;
  hasOverlayText?: boolean;
}): void {
  _client?.capture("community_post_created", props);
}

export function trackPostLiked(postId: string | number): void {
  _client?.capture("community_post_liked", { postId });
}

export function trackPostShared(props: {
  postId: string | number;
  destination: "story" | "native";
}): void {
  _client?.capture("community_post_shared", props);
}

export function trackChallengeJoined(challengeId: string | number, challengeTitle: string): void {
  _client?.capture("community_challenge_joined", { challengeId: String(challengeId), challengeTitle });
}

/** Snapshot */
export function trackSnapshotEditorOpened(frame?: string): void {
  _client?.capture("snapshot_editor_opened", { frame: frame ?? null });
}

export function trackSnapshotApplied(props: {
  frame: string;
  effect?: string;
  decor?: string;
  hasText?: boolean;
}): void {
  _client?.capture("snapshot_applied", props);
}

/** Navigation */
export function trackScreenViewed(screenName: string, props?: Record<string, unknown>): void {
  _client?.capture("$screen", { $screen_name: screenName, ...props });
}
