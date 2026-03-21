import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

// RevenueCat API key (iOS/Android)
export const RC_API_KEY_IOS = "ofrnga01c25df3f";
export const RC_API_KEY_ANDROID = "ofrnga01c25df3f";

export type SubscriptionTier = "free" | "premium" | "premium_plus";

export type SubscriptionState = {
  tier: SubscriptionTier;
  isLoading: boolean;
  isPremium: boolean;
  isPremiumPlus: boolean;
  activeEntitlements: string[];
  canUseVirtualTryOn: boolean;
  canUseOutfitBuilder: boolean;
  canUseSnapshot: boolean;
  canUseUnlimitedTryOns: boolean;
  monthlyTryOnsUsed: number;
  monthlyTryOnsLimit: number;
};

const FREE_TRYON_LIMIT = 3;

let purchasesInitialized = false;

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
  purchasePremium: () => Promise<boolean>;
  purchasePremiumPlus: () => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  incrementTryOnUsage: () => void;
} {
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [activeEntitlements, setActiveEntitlements] = useState<string[]>([]);
  const [monthlyTryOnsUsed, setMonthlyTryOnsUsed] = useState(0);

  const loadCustomerInfo = useCallback(async () => {
    if (Platform.OS === "web") {
      // Sur le web, simuler un état premium pour la démo
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

      if (entitlements.includes("premium_plus")) {
        setTier("premium_plus");
      } else if (entitlements.includes("premium")) {
        setTier("premium");
      } else {
        setTier("free");
      }
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

  const purchasePremium = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    try {
      const Purchases = (await import("react-native-purchases")).default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.identifier === "premium_monthly" || p.packageType === "MONTHLY"
      );
      if (!pkg) return false;
      await Purchases.purchasePackage(pkg);
      await loadCustomerInfo();
      return true;
    } catch (e: any) {
      if (!e.userCancelled) console.warn("[RevenueCat] purchasePremium failed:", e);
      return false;
    }
  }, [loadCustomerInfo]);

  const purchasePremiumPlus = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    try {
      const Purchases = (await import("react-native-purchases")).default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.identifier === "premium_plus_monthly" || p.packageType === "ANNUAL"
      );
      if (!pkg) return false;
      await Purchases.purchasePackage(pkg);
      await loadCustomerInfo();
      return true;
    } catch (e: any) {
      if (!e.userCancelled) console.warn("[RevenueCat] purchasePremiumPlus failed:", e);
      return false;
    }
  }, [loadCustomerInfo]);

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

  const isPremium = tier === "premium" || tier === "premium_plus";
  const isPremiumPlus = tier === "premium_plus";

  return {
    tier,
    isLoading,
    isPremium,
    isPremiumPlus,
    activeEntitlements,
    canUseVirtualTryOn: isPremium || monthlyTryOnsUsed < FREE_TRYON_LIMIT,
    canUseOutfitBuilder: isPremium,
    canUseSnapshot: true, // Snapshot de base gratuit, effets premium
    canUseUnlimitedTryOns: isPremium,
    monthlyTryOnsUsed,
    monthlyTryOnsLimit: FREE_TRYON_LIMIT,
    purchasePremium,
    purchasePremiumPlus,
    restorePurchases,
    incrementTryOnUsage,
  };
}
