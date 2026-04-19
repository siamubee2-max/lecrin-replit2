import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

// ─── RevenueCat Configuration ─────────────────────────────────────────────────
// ⚠️ BUILD 19 BUG CORRIGÉ : "ofrnga01c25df3f" était un OFFERING ID, pas une
// API key SDK. `Purchases.configure()` rejetait silencieusement la valeur →
// `getOfferings()` retournait null → les boutons de paywall ne faisaient rien
// (rejet 2.1(b) sur iPad M3).
//
// ACTION REQUISE AVANT BUILD 20 :
// 1. Aller sur https://app.revenuecat.com/projects/<project>/api-keys
// 2. Copier la "Public app-specific API key" iOS  → format "appl_xxxxxxxxxxxxx"
// 3. Copier la "Public app-specific API key" Android → format "goog_xxxxxxxxx"
// 4. Les mettre dans le .env :
//      EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxx
//      EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxx
// 5. L'offering ID "ofrnga01c25df3f" reste utilisable côté RevenueCat dashboard
//    mais ne sert PAS à initialiser le SDK.
export const RC_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "appl_REPLACE_ME_PUBLIC_IOS_KEY";
export const RC_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "goog_REPLACE_ME_PUBLIC_ANDROID_KEY";

// ─── Entitlements (lookup_key dans RevenueCat) ────────────────────────────────
export const ENTITLEMENT_JEWELRY = "jewelry_access";   // Jewelry Mensuel
export const ENTITLEMENT_PREMIUM = "premium_access";   // Premium Mensuel / Annuel

// ─── Store identifiers des produits ──────────────────────────────────────────
export const PRODUCT_JEWELRY_MONTHLY = "ecrin.jewelry.monthly";
export const PRODUCT_PREMIUM_MONTHLY = "ecrin.premium.monthly";
export const PRODUCT_PREMIUM_YEARLY  = "ecrin.premium.yearly";
export const PRODUCT_CREDITS_50      = "ecrin.credits.50";
export const PRODUCT_CREDITS_100     = "ecrin.credits.100";
export const PRODUCT_CREDITS_250     = "ecrin.credits.250";
export const PRODUCT_CREDITS_500     = "ecrin.credits.500";

// ─── Résultat d'achat (utilisé par PaywallModal pour message d'erreur clair) ──
export type PurchaseResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "user_cancelled"
        | "package_not_found"
        | "no_current_offering"
        | "offerings_unreachable"
        | "purchase_error"
        | "unsupported_platform";
      message?: string;
      storeId?: string;
    };

// ─── Tiers ────────────────────────────────────────────────────────────────────
// free       → aucun abonnement actif
// jewelry    → jewelry_access actif (essayage bijoux uniquement)
// premium    → premium_access actif (essayage complet + tenue complète)
export type SubscriptionTier = "free" | "jewelry" | "premium";

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
let purchasesInitPromise: Promise<void> | null = null;

async function initRevenueCat() {
  if (Platform.OS === "web") return;
  if (purchasesInitialized) return;
  // Évite double init concurrent (paywall + écran settings ouvrent le hook en parallèle)
  if (purchasesInitPromise) return purchasesInitPromise;

  purchasesInitPromise = (async () => {
    try {
      const Purchases = (await import("react-native-purchases")).default;
      const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;

      // Garde-fou : refuse explicitement le placeholder pour éviter un init silent
      if (apiKey.startsWith("appl_REPLACE_ME") || apiKey.startsWith("goog_REPLACE_ME")) {
        throw new Error(
          "[RevenueCat] EXPO_PUBLIC_REVENUECAT_IOS_KEY/ANDROID_KEY non configurée. " +
          "Voir hooks/use-subscription.ts pour la procédure."
        );
      }

      // Verbose logs uniquement en dev
      if (__DEV__) {
        await Purchases.setLogLevel((await import("react-native-purchases")).LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({ apiKey });
      // Pre-fetch des offerings pour que le 1er rendu de la paywall ait déjà la liste en cache
      try { await Purchases.getOfferings(); } catch {}
      purchasesInitialized = true;
    } catch (e) {
      console.error("[RevenueCat] Init failed:", e);
      throw e;
    } finally {
      purchasesInitPromise = null;
    }
  })();

  return purchasesInitPromise;
}

// Pré-init exposé pour appel au démarrage de l'app (dans app/_layout.tsx)
export function preInitRevenueCat() {
  initRevenueCat().catch(() => {});
}

export function useSubscription(): SubscriptionState & {
  purchaseJewelry: () => Promise<boolean>;
  purchasePremiumMonthly: () => Promise<boolean>;
  purchasePremiumYearly: () => Promise<boolean>;
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

      if (entitlements.includes(ENTITLEMENT_PREMIUM)) {
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
  // Retourne un PurchaseResult explicite plutôt qu'un simple boolean pour que
  // la paywall puisse afficher un message d'erreur clair au réviseur Apple.
  const purchaseByStoreId = useCallback(async (storeId: string): Promise<PurchaseResult> => {
    if (Platform.OS === "web") return { ok: false, reason: "unsupported_platform" };
    try {
      await initRevenueCat();
      const Purchases = (await import("react-native-purchases")).default;

      // 1) Pre-check : le SDK répond-il ?
      let offerings;
      try {
        offerings = await Purchases.getOfferings();
      } catch (err) {
        console.error("[RevenueCat] getOfferings failed:", err);
        return { ok: false, reason: "offerings_unreachable", message: String(err) };
      }

      // 2) Pre-check : offering actif présent ?
      if (!offerings.current) {
        console.error("[RevenueCat] No current offering configured on dashboard");
        return { ok: false, reason: "no_current_offering" };
      }

      // 3) Résolution du package — on essaie par identifier d'abord puis par product id
      let pkg = offerings.current.availablePackages.find(
        (p) => p.product.identifier === storeId
      );
      if (!pkg) {
        pkg = offerings.current.availablePackages.find(
          (p) => p.identifier === storeId
        );
      }
      if (!pkg) {
        console.error(
          "[RevenueCat] Package not found in current offering:",
          storeId,
          "available=",
          offerings.current.availablePackages.map((p) => p.product.identifier)
        );
        return { ok: false, reason: "package_not_found", storeId };
      }

      // 4) Achat réel
      await Purchases.purchasePackage(pkg);
      await loadCustomerInfo();
      return { ok: true };
    } catch (e: any) {
      if (e?.userCancelled) return { ok: false, reason: "user_cancelled" };
      console.error("[RevenueCat] purchase failed:", e);
      return { ok: false, reason: "purchase_error", message: e?.message ?? String(e) };
    }
  }, [loadCustomerInfo]);

  // Adaptateur boolean pour les callers historiques (PaywallModal)
  const purchaseByStoreIdBool = useCallback(
    async (storeId: string) => (await purchaseByStoreId(storeId)).ok,
    [purchaseByStoreId]
  );

  const purchaseJewelry = useCallback(() =>
    purchaseByStoreIdBool(PRODUCT_JEWELRY_MONTHLY), [purchaseByStoreIdBool]);

  const purchasePremiumMonthly = useCallback(() =>
    purchaseByStoreIdBool(PRODUCT_PREMIUM_MONTHLY), [purchaseByStoreIdBool]);

  const purchasePremiumYearly = useCallback(() =>
    purchaseByStoreIdBool(PRODUCT_PREMIUM_YEARLY), [purchaseByStoreIdBool]);

  // ─── Achats crédits consommables ─────────────────────────────────────────
  const purchaseCredits = useCallback(async (pack: "50" | "100" | "250" | "500"): Promise<boolean> => {
    const storeIdMap = {
      "50":  PRODUCT_CREDITS_50,
      "100": PRODUCT_CREDITS_100,
      "250": PRODUCT_CREDITS_250,
      "500": PRODUCT_CREDITS_500,
    };
    const success = await purchaseByStoreIdBool(storeIdMap[pack]);
    if (success) {
      setCredits((prev) => prev + parseInt(pack, 10));
    }
    return success;
  }, [purchaseByStoreIdBool]);

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
  const hasJewelryAccess = tier === "jewelry" || tier === "premium";
  const hasPremiumAccess = tier === "premium";

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
    monthlyTryOnsLimit: tier === "jewelry" ? JEWELRY_TRYON_LIMIT
      : tier === "premium" ? PREMIUM_MONTHLY_LIMIT
      : FREE_TRYON_LIMIT,
    purchaseJewelry,
    purchasePremiumMonthly,
    purchasePremiumYearly,
    purchaseCredits,
    restorePurchases,
    incrementTryOnUsage,
  };
}
