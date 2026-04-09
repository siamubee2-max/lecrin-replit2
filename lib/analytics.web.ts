/**
 * PostHog Analytics stub for web.
 *
 * posthog-react-native does not support web (no .web variant for ./surveys),
 * so this stub provides no-op implementations to unblock the web build.
 * Analytics on web can be implemented later with a web-compatible SDK.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export function getPostHog(): null {
  return null;
}

export async function initPostHog(): Promise<void> {
  // no-op on web
}

export function identifyUser(_userId: string, _props?: Record<string, unknown>): void {
  // no-op on web
}

export function resetUser(): void {
  // no-op on web
}

export function trackOnboardingStep(_step: number, _name: string): void {
  // no-op on web
}

export function trackOnboardingCompleted(): void {
  // no-op on web
}

export function trackDailyLookViewed(_props?: {
  source?: "home" | "occasion" | "direct";
  occasion?: string;
}): void {
  // no-op on web
}

export function trackTryOnStarted(_props: {
  mode: "single" | "outfit";
  jewelryType?: string;
  modelType?: string;
}): void {
  // no-op on web
}

export function trackTryOnCompleted(_props: {
  mode: "single" | "outfit";
  jewelryType?: string;
  durationMs?: number;
  success: boolean;
  isGuided?: boolean;
}): void {
  // no-op on web
}

export function trackGuidedTryOnCompleted(_props: {
  mode: "single" | "outfit";
  totalSteps: number;
}): void {
  // no-op on web
}

export function trackTryOnShared(_props: {
  destination: "story" | "community" | "native" | "download";
  hasSnapshot?: boolean;
}): void {
  // no-op on web
}

export function trackTryOnSaved(): void {
  // no-op on web
}

export function trackLookSaved(_props: {
  mode: "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";
  target: "ecrin" | "dressing";
  isGuided: boolean;
  aiCostUsd?: number;
}): void {
  // no-op on web
}

export function trackBoutiqueItemViewed(_props: {
  itemId: string | number;
  itemName: string;
  brandName?: string;
  price?: number;
}): void {
  // no-op on web
}

export function trackBoutiqueTryOnTapped(_props: {
  itemId: string | number;
  itemName: string;
}): void {
  // no-op on web
}

export function trackPaywallShown(_trigger: string): void {
  // no-op on web
}

export function trackPaywallDismissed(_trigger: string): void {
  // no-op on web
}

export function trackSubscriptionPurchased(_props: {
  productId: string;
  tier: "jewelry" | "premium";
  period: "monthly" | "yearly";
  price?: number;
}): void {
  // no-op on web
}

export function trackCreditsPurchased(_props: {
  productId: string;
  credits: number;
  price?: number;
}): void {
  // no-op on web
}

export function trackSubscriptionRestored(_tier: string): void {
  // no-op on web
}

export function trackPostCreated(_props: {
  hasSnapshot: boolean;
  snapshotFrame?: string;
  hasOverlayText?: boolean;
}): void {
  // no-op on web
}

export function trackPostLiked(_postId: string | number): void {
  // no-op on web
}

export function trackPostShared(_props: {
  postId: string | number;
  destination: "story" | "native";
}): void {
  // no-op on web
}

export function trackChallengeJoined(
  _challengeId: string | number,
  _challengeTitle: string,
): void {
  // no-op on web
}

export function trackSnapshotEditorOpened(_frame?: string): void {
  // no-op on web
}

export function trackSnapshotApplied(_props: {
  frame: string;
  effect?: string;
  decor?: string;
  hasText?: boolean;
}): void {
  // no-op on web
}

export function trackScreenViewed(
  _screenName: string,
  _props?: Record<string, unknown>,
): void {
  // no-op on web
}

export function trackTryOnGenerationObserved(_props: {
  type: "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";
  success: boolean;
  durationMs: number;
  errorMessage?: string;
}): void {
  // no-op on web
}

export function trackAbAssignment(_props: {
  experiment: "homeCards" | "homeCta" | "dailyLookDetail";
  variant: "A" | "B";
}): void {
  // no-op on web
}

export function trackAbConversion(_props: {
  experiment: "homeCards" | "homeCta" | "dailyLookDetail";
  variant: "A" | "B";
}): void {
  // no-op on web
}

export function trackTryOnQualityFeedback(_props: {
  mode: "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";
  vote: "positive" | "negative";
  qualityScore?: number;
  isGuided?: boolean;
}): void {
  // no-op on web
}

export function trackEmergencyLookUsed(_props: {
  reason: string;
  source: "home" | "daily-look";
}): void {
  // no-op on web
}

export function trackWardrobeRecommendationApplied(_props: {
  type: string;
  source: "home" | "daily-look";
}): void {
  // no-op on web
}

export function trackLaunchOfferCampaignSeen(_props: {
  campaignKey:
    | "yearly_50_first_100"
    | "yearly_30_next_100"
    | "yearly_20_next_100"
    | "yearly_10_next_100"
    | "monthly_10_next_100";
  remaining?: number;
  source?: string;
}): void {
  // no-op on web
}

export function trackLaunchOfferClaimed(_props: {
  campaignKey:
    | "yearly_50_first_100"
    | "yearly_30_next_100"
    | "yearly_20_next_100"
    | "yearly_10_next_100"
    | "monthly_10_next_100";
  source?: string;
}): void {
  // no-op on web
}

export function trackLaunchOfferExhausted(_props?: {
  source?: string;
}): void {
  // no-op on web
}

export function trackLaunchOfferPurchaseSuccess(_props: {
  campaignKey:
    | "yearly_50_first_100"
    | "yearly_30_next_100"
    | "yearly_20_next_100"
    | "yearly_10_next_100"
    | "monthly_10_next_100";
  storeId: string;
  source?: string;
}): void {
  // no-op on web
}

export function trackLaunchOfferPurchaseFailed(_props: {
  campaignKey:
    | "yearly_50_first_100"
    | "yearly_30_next_100"
    | "yearly_20_next_100"
    | "yearly_10_next_100"
    | "monthly_10_next_100";
  storeId?: string;
  reason:
    | "claim_unavailable"
    | "store_product_missing"
    | "purchase_failed"
    | "unexpected_error";
  source?: string;
}): void {
  // no-op on web
}
