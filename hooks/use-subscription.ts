import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getUserInfo } from "@/lib/_core/auth";
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";

// ─── RevenueCat Configuration ─────────────────────────────────────────────────
// SDK public keys — must start with appl_ (iOS) and goog_ (Android)
// Set EXPO_PUBLIC_RC_API_KEY_IOS and EXPO_PUBLIC_RC_API_KEY_ANDROID in your .env
export const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? "";
export const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? "";

// ─── Entitlements (lookup_key dans RevenueCat) ────────────────────────────────
export const ENTITLEMENT_JEWELRY = "jewelry_access";   // Jewelry Mensuel
export const ENTITLEMENT_PREMIUM = "premium_access";   // Premium Mensuel / Annuel
export const ENTITLEMENT_LIFETIME = "lifetime_access"; // Premium à vie (achat unique)

// ─── Store identifiers des produits ──────────────────────────────────────────
export const PRODUCT_JEWELRY_MONTHLY = "ecrin.jewelry.monthly";
export const PRODUCT_PREMIUM_MONTHLY = "ecrin.premium.monthly";
export const PRODUCT_PREMIUM_YEARLY = "ecrin.premium.yearly";
export const PRODUCT_PREMIUM_YEARLY_50 = process.env.EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_50 ?? "ecrin.premium.yearly.launch50";
export const PRODUCT_PREMIUM_YEARLY_25 = process.env.EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_25 ?? "ecrin.premium.yearly.launch25";
export const PRODUCT_PREMIUM_YEARLY_10 = process.env.EXPO_PUBLIC_RC_PRODUCT_PREMIUM_YEARLY_10 ?? "ecrin.premium.yearly.launch10";
export const PRODUCT_PREMIUM_MONTHLY_10 = process.env.EXPO_PUBLIC_RC_PRODUCT_PREMIUM_MONTHLY_10 ?? "ecrin.premium.monthly.launch10";
export const PRODUCT_LIFETIME = "ecrin.lifetime.premium"; // Premium à vie
export const PRODUCT_CREDITS_50 = "ecrin.credits.50";
export const PRODUCT_CREDITS_100 = "ecrin.credits.100";
export const PRODUCT_CREDITS_250 = "ecrin.credits.250";
export const PRODUCT_CREDITS_500 = "ecrin.credits.500";

// ─── Tiers ────────────────────────────────────────────────────────────────────
// free       → aucun abonnement actif
// jewelry    → jewelry_access actif (essayage bijoux uniquement)
// premium    → premium_access actif (essayage complet + tenue complète)
// lifetime   → lifetime_access actif (premium à vie, achat unique)
export type SubscriptionTier = "free" | "jewelry" | "premium" | "lifetime";

export type SubscriptionState = {
  tier: SubscriptionTier;
  isLoading: boolean;
  hasJewelryAccess: boolean;   // jewelry_access OU premium_access
  hasPremiumAccess: boolean;   // premium_access uniquement
  activeEntitlements: string[];
  credits: number;             // crédits consommables disponibles
  // Permissions granulaires
  canUseVirtualTryOn: boolean;       // bijoux : jewelry ou premium ; vêtements : premium uniquement
  canUseJewelryTryOn: boolean;
  canUseClothingTryOn: boolean;
  canUseOutfitBuilder: boolean;      // Mode Tenue Complète → premium uniquement
  canUseSnapshotPremium: boolean;    // Effets Snapshot premium → premium uniquement
  canUseUnlimitedTryOns: boolean;
  monthlyTryOnsUsed: number;
  monthlyTryOnsLimit: number;
};

const FREE_TRYON_LIMIT = 3;          // essayages gratuits/mois (bijoux uniquement)
const JEWELRY_TRYON_LIMIT = 100;     // essayages Jewelry/mois
const PREMIUM_MONTHLY_LIMIT = 150;   // essayages Premium mensuel/mois
const PREMIUM_YEARLY_LIMIT = 1500;   // essayages Premium annuel/an
const PREMIUM_FOUNDER_YEARLY_LIMIT = 10000; // offre fondateur (-50% annuel)

let purchasesInitialized = false;

// Detect Expo Go environment (native store is unavailable there)
// Constants.appOwnership can be null in Expo SDK 50+ with new config system
// so we also check executionEnvironment as a fallback
const isExpoGo =
  Constants.appOwnership === "expo" ||
  (Constants.executionEnvironment as string) === "storeClient";

// ─── Accès Premium à vie par email ───────────────────────────────────────────
// - EXPO_PUBLIC_LIFETIME_PREMIUM_EMAILS: liste prioritaire
// - fallback: EXPO_PUBLIC_DEV_PREMIUM_EMAILS / EXPO_PUBLIC_DEV_PREMIUM_EMAIL
const LIFETIME_EMAILS: Set<string> = (() => {
  const lifetime = process.env.EXPO_PUBLIC_LIFETIME_PREMIUM_EMAILS ?? "";
  const multi = process.env.EXPO_PUBLIC_DEV_PREMIUM_EMAILS ?? "";
  const single = process.env.EXPO_PUBLIC_DEV_PREMIUM_EMAIL ?? "";
  const raw = lifetime || multi || single;
  return new Set(
    raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
})();

async function isDeveloper(): Promise<boolean> {
  if (LIFETIME_EMAILS.size === 0) return false;

  try {
    // Supabase Auth (flow actuel)
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.toLowerCase() ?? "";
      if (email && LIFETIME_EMAILS.has(email)) return true;
    }

    // Fallback ancien flow Manus
    const user = await getUserInfo();
    if (!user) return false;
    return LIFETIME_EMAILS.has(user.email?.toLowerCase() ?? "");
  } catch {
    return false;
  }
}

async function initRevenueCat() {
  if (purchasesInitialized || Platform.OS === "web") return;

  // Skip RevenueCat in Expo Go — native store is not available
  if (isExpoGo) {
    console.log("[RevenueCat] Skipping init in Expo Go (native store unavailable). Use a development build for full IAP support.");
    return;
  }

  try {
    const Purchases = (await import("react-native-purchases")).default;
    const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
    if (!apiKey) {
      console.warn("[RevenueCat] API key not configured. Set EXPO_PUBLIC_RC_API_KEY_IOS / EXPO_PUBLIC_RC_API_KEY_ANDROID in your .env");
      return;
    }
    await Purchases.configure({ apiKey });
    purchasesInitialized = true;
  } catch (e) {
    console.warn("[RevenueCat] Init failed:", e);
  }
}

export function useSubscription(): SubscriptionState & {
  purchaseJewelry: () => Promise<boolean>;
  purchasePremiumMonthly: () => Promise<boolean>;
  purchasePremiumYearly: () => Promise<boolean>;
  purchaseStoreProduct: (storeId: string) => Promise<boolean>;
  purchaseLifetime: () => Promise<boolean>;
  purchaseCredits: (pack: "50" | "100" | "250" | "500") => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  incrementTryOnUsage: () => void;
} {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [activeEntitlements, setActiveEntitlements] = useState<string[]>([]);
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);
  const [credits, setCredits] = useState(0);
  const [monthlyTryOnsUsed, setMonthlyTryOnsUsed] = useState(0);

  // 2. Vérification privilège côté serveur (fonctionne en production)
  // Appelé seulement si l'utilisateur est connecté (le endpoint est protectedProcedure)
  const privilegedQuery = trpc.auth.isPrivileged.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  // Dès que la réponse serveur arrive et confirme l'accès privilégié,
  // on force le tier lifetime (même en prod)
  useEffect(() => {
    if (privilegedQuery.data?.privileged) {
      setTier("lifetime");
      setActiveEntitlements([ENTITLEMENT_LIFETIME, ENTITLEMENT_PREMIUM]);
      setIsLoading(false);
      console.log("[Subscription] 🌟 Accès privilégié (serveur) - Premium à vie activé !");
    }
  }, [privilegedQuery.data]);

  const loadCustomerInfo = useCallback(async () => {
    // 1. Vérification accès développeur local (dev builds uniquement)
    const devAccess = await isDeveloper();
    if (devAccess) {
      setTier("lifetime");
      setActiveEntitlements([ENTITLEMENT_LIFETIME, ENTITLEMENT_PREMIUM]);
      setActiveProductIds([]);
      setIsLoading(false);
      console.log("[Subscription] 🎉 Accès développeur (local) détecté - Premium à vie activé !");
      return;
    }

    if (Platform.OS === "web" || isExpoGo) {
      if (isExpoGo) {
        console.log("[Subscription] Running in Expo Go — defaulting to free tier (RevenueCat unavailable).");
      }
      setTier("free");
      setActiveProductIds([]);
      setIsLoading(false);
      return;
    }
    try {
      await initRevenueCat();
      const Purchases = (await import("react-native-purchases")).default;
      const info = await Purchases.getCustomerInfo();
      const entitlements = Object.keys(info.entitlements.active);
      const activeSubscriptions = Array.from(info.activeSubscriptions ?? []) as string[];
      setActiveEntitlements(entitlements);
      setActiveProductIds(activeSubscriptions);

      if (entitlements.includes(ENTITLEMENT_LIFETIME)) {
        setTier("lifetime");
      } else if (entitlements.includes(ENTITLEMENT_PREMIUM)) {
        setTier("premium");
      } else if (entitlements.includes(ENTITLEMENT_JEWELRY)) {
        setTier("jewelry");
      } else {
        setTier("free");
      }

      // Récupérer les crédits consommables depuis les non-subscriptions actives
      // Les crédits sont gérés côté serveur via webhooks RevenueCat dans un usage réel
      // Ici on lit depuis le store local (AsyncStorage) pour la démo
    } catch (e) {
      console.warn("[RevenueCat] loadCustomerInfo failed:", e);
      setTier("free");
      setActiveProductIds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomerInfo();
  }, [loadCustomerInfo]);

  // ─── Achats abonnements ──────────────────────────────────────────────────
  const purchaseByStoreId = useCallback(async (storeId: string): Promise<boolean> => {
    if (Platform.OS === "web" || isExpoGo) {
      if (isExpoGo) console.warn("[RevenueCat] Purchases not available in Expo Go. Use a development build.");
      return false;
    }
    try {
      const Purchases = (await import("react-native-purchases")).default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === storeId
      );
      if (pkg) {
        await Purchases.purchasePackage(pkg);
      } else {
        // Fallback: direct store product purchase (useful when SKU is not in current offering yet)
        const products = await Purchases.getProducts([storeId]);
        const product = products?.[0];
        if (!product) {
          console.warn("[RevenueCat] Product not found:", storeId);
          return false;
        }
        await Purchases.purchaseStoreProduct(product);
      }
      await loadCustomerInfo();
      return true;
    } catch (e: any) {
      if (!e.userCancelled) console.warn("[RevenueCat] purchase failed:", e);
      return false;
    }
  }, [loadCustomerInfo]);

  const purchaseJewelry = useCallback(() =>
    purchaseByStoreId(PRODUCT_JEWELRY_MONTHLY), [purchaseByStoreId]);

  const purchasePremiumMonthly = useCallback(() =>
    purchaseByStoreId(PRODUCT_PREMIUM_MONTHLY), [purchaseByStoreId]);

  const purchasePremiumYearly = useCallback(() =>
    purchaseByStoreId(PRODUCT_PREMIUM_YEARLY), [purchaseByStoreId]);

  const purchaseLifetime = useCallback(() =>
    purchaseByStoreId(PRODUCT_LIFETIME), [purchaseByStoreId]);

  // ─── Achats crédits consommables ─────────────────────────────────────────
  const purchaseCredits = useCallback(async (pack: "50" | "100" | "250" | "500"): Promise<boolean> => {
    const storeIdMap = {
      "50": PRODUCT_CREDITS_50,
      "100": PRODUCT_CREDITS_100,
      "250": PRODUCT_CREDITS_250,
      "500": PRODUCT_CREDITS_500,
    };
    const success = await purchaseByStoreId(storeIdMap[pack]);
    if (success) {
      setCredits((prev) => prev + parseInt(pack, 10));
    }
    return success;
  }, [purchaseByStoreId]);

  // ─── Restauration ────────────────────────────────────────────────────────
  const restorePurchases = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const Purchases = (await import("react-native-purchases")).default;
      await Purchases.restorePurchases();
      await loadCustomerInfo();
    } catch (e) {
      console.warn("[RevenueCat] restorePurchases failed:", e);
    }
  }, [loadCustomerInfo]);

  const incrementTryOnUsage = useCallback(() => {
    setMonthlyTryOnsUsed((prev) => prev + 1);
  }, []);

  // ─── Permissions dérivées ────────────────────────────────────────────────
  const hasJewelryAccess = tier === "jewelry" || tier === "premium" || tier === "lifetime";
  const hasPremiumAccess = tier === "premium" || tier === "lifetime";
  const isFounderYearly = activeProductIds.includes(PRODUCT_PREMIUM_YEARLY_50);
  const hasAnyYearlyPremium = [
    PRODUCT_PREMIUM_YEARLY,
    PRODUCT_PREMIUM_YEARLY_50,
    PRODUCT_PREMIUM_YEARLY_25,
    PRODUCT_PREMIUM_YEARLY_10,
  ].some((id) => activeProductIds.includes(id));
  const premiumLimit = isFounderYearly
    ? PREMIUM_FOUNDER_YEARLY_LIMIT
    : hasAnyYearlyPremium
      ? PREMIUM_YEARLY_LIMIT
      : PREMIUM_MONTHLY_LIMIT;

  return {
    tier,
    isLoading,
    hasJewelryAccess,
    hasPremiumAccess,
    activeEntitlements,
    credits,
    canUseJewelryTryOn: hasJewelryAccess || monthlyTryOnsUsed < FREE_TRYON_LIMIT,
    canUseClothingTryOn: hasPremiumAccess,
    canUseVirtualTryOn: hasJewelryAccess || monthlyTryOnsUsed < FREE_TRYON_LIMIT,
    canUseOutfitBuilder: hasPremiumAccess,
    canUseSnapshotPremium: hasPremiumAccess,
    canUseUnlimitedTryOns: hasJewelryAccess,
    monthlyTryOnsUsed,
    monthlyTryOnsLimit: tier === "lifetime" ? Infinity
      : tier === "jewelry" ? JEWELRY_TRYON_LIMIT
        : tier === "premium" ? premiumLimit
          : FREE_TRYON_LIMIT,
    purchaseJewelry,
    purchasePremiumMonthly,
    purchasePremiumYearly,
    purchaseStoreProduct: purchaseByStoreId,
    purchaseLifetime,
    purchaseCredits,
    restorePurchases,
    incrementTryOnUsage,
  };
}
