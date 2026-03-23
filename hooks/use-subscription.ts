import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { getUserInfo } from "@/lib/_core/auth";

// ─── RevenueCat Configuration ─────────────────────────────────────────────────
// SDK public key (offering ID = ofrnga01c25df3f)
export const RC_API_KEY_IOS = "ofrnga01c25df3f";
export const RC_API_KEY_ANDROID = "ofrnga01c25df3f";

// ─── Entitlements (lookup_key dans RevenueCat) ────────────────────────────────
export const ENTITLEMENT_JEWELRY = "jewelry_access";   // Jewelry Mensuel
export const ENTITLEMENT_PREMIUM = "premium_access";   // Premium Mensuel / Annuel
export const ENTITLEMENT_LIFETIME = "lifetime_access"; // Premium à vie (achat unique)

// ─── Store identifiers des produits ──────────────────────────────────────────
export const PRODUCT_JEWELRY_MONTHLY = "ecrin.jewelry.monthly";
export const PRODUCT_PREMIUM_MONTHLY = "ecrin.premium.monthly";
export const PRODUCT_PREMIUM_YEARLY = "ecrin.premium.yearly";
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

let purchasesInitialized = false;

// ─── Accès Développeur (Lifetime Premium) ────────────────────────────────────
// WARNING: This only works in development builds (__DEV__). In production builds,
// this function returns false immediately since __DEV__ is false.
// Configured via EXPO_PUBLIC_DEV_PREMIUM_EMAIL environment variable.
const DEV_USER_EMAIL: string | null = __DEV__ ? (process.env.EXPO_PUBLIC_DEV_PREMIUM_EMAIL ?? null) : null;

async function isDeveloper(): Promise<boolean> {
  // Only allow developer access in development builds
  if (!__DEV__ || !DEV_USER_EMAIL) return false;

  try {
    const user = await getUserInfo();
    if (!user) return false;
    return user.email?.toLowerCase() === DEV_USER_EMAIL.toLowerCase();
  } catch {
    return false;
  }
}

async function initRevenueCat() {
  if (purchasesInitialized || Platform.OS === "web") return;
  try {
    const Purchases = (await import("react-native-purchases")).default;
    const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
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
  purchaseLifetime: () => Promise<boolean>;
  purchaseCredits: (pack: "50" | "100" | "250" | "500") => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  incrementTryOnUsage: () => void;
} {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [activeEntitlements, setActiveEntitlements] = useState<string[]>([]);
  const [credits, setCredits] = useState(0);
  const [monthlyTryOnsUsed, setMonthlyTryOnsUsed] = useState(0);

  const loadCustomerInfo = useCallback(async () => {
    // Vérifier l'accès développeur en premier
    const devAccess = await isDeveloper();
    if (devAccess) {
      setTier("lifetime");
      setActiveEntitlements([ENTITLEMENT_LIFETIME, ENTITLEMENT_PREMIUM]);
      setIsLoading(false);
      console.log("[Subscription] 🎉 Accès développeur détecté - Premium à vie activé !");
      return;
    }

    if (Platform.OS === "web") {
      setTier("free");
      setIsLoading(false);
      return;
    }
    try {
      await initRevenueCat();
      const Purchases = (await import("react-native-purchases")).default;
      const info = await Purchases.getCustomerInfo();
      const entitlements = Object.keys(info.entitlements.active);
      setActiveEntitlements(entitlements);

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
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomerInfo();
  }, [loadCustomerInfo]);

  // ─── Achats abonnements ──────────────────────────────────────────────────
  const purchaseByStoreId = useCallback(async (storeId: string): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    try {
      const Purchases = (await import("react-native-purchases")).default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === storeId
      );
      if (!pkg) {
        console.warn("[RevenueCat] Package not found:", storeId);
        return false;
      }
      await Purchases.purchasePackage(pkg);
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
        : tier === "premium" ? PREMIUM_MONTHLY_LIMIT
          : FREE_TRYON_LIMIT,
    purchaseJewelry,
    purchasePremiumMonthly,
    purchasePremiumYearly,
    purchaseLifetime,
    purchaseCredits,
    restorePurchases,
    incrementTryOnUsage,
  };
}
