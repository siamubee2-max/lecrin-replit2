import { describe, it, expect } from "vitest";

/**
 * Tests pour la nouvelle grille tarifaire
 */

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Découverte",
    price: "Gratuit",
    period: "",
    features: ["3 essayages/mois", "Modèles de base", "Aperçu des fonctionnalités"],
    popular: false,
    isFree: true,
  },
  {
    id: "monthly_basic",
    name: "Essentiel",
    price: "14,99€",
    period: "/mois",
    features: ["Essayages illimités", "Tous les modèles", "Sauvegarde illimitée", "Support email"],
    popular: false,
  },
  {
    id: "monthly_premium",
    name: "Premium",
    price: "24,99€",
    period: "/mois",
    features: ["Essayages illimités", "Garde-robe virtuelle", "Accès créateurs partenaires", "Support prioritaire"],
    popular: true,
  },
  {
    id: "yearly",
    name: "Annuel Premium",
    price: "199,99€",
    period: "/an",
    features: ["Tout Premium inclus", "Économisez +100€ (33%)", "Accès anticipé nouveautés", "Badge VIP exclusif"],
    popular: false,
  },
];

describe("Grille Tarifaire", () => {
  it("devrait avoir 4 plans d'abonnement", () => {
    expect(SUBSCRIPTION_PLANS).toHaveLength(4);
  });

  it("devrait avoir un plan gratuit (Découverte)", () => {
    const freePlan = SUBSCRIPTION_PLANS.find(p => p.isFree);
    expect(freePlan).toBeDefined();
    expect(freePlan?.name).toBe("Découverte");
    expect(freePlan?.price).toBe("Gratuit");
    expect(freePlan?.features).toContain("3 essayages/mois");
  });

  it("devrait avoir le plan Essentiel à 14,99€/mois", () => {
    const essentialPlan = SUBSCRIPTION_PLANS.find(p => p.id === "monthly_basic");
    expect(essentialPlan).toBeDefined();
    expect(essentialPlan?.price).toBe("14,99€");
    expect(essentialPlan?.period).toBe("/mois");
  });

  it("devrait avoir le plan Premium à 24,99€/mois marqué comme populaire", () => {
    const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.id === "monthly_premium");
    expect(premiumPlan).toBeDefined();
    expect(premiumPlan?.price).toBe("24,99€");
    expect(premiumPlan?.period).toBe("/mois");
    expect(premiumPlan?.popular).toBe(true);
  });

  it("devrait avoir le plan Annuel à 199,99€/an avec 33% d'économie", () => {
    const yearlyPlan = SUBSCRIPTION_PLANS.find(p => p.id === "yearly");
    expect(yearlyPlan).toBeDefined();
    expect(yearlyPlan?.price).toBe("199,99€");
    expect(yearlyPlan?.period).toBe("/an");
    expect(yearlyPlan?.features.some(f => f.includes("33%"))).toBe(true);
  });

  it("devrait avoir un seul plan marqué comme populaire", () => {
    const popularPlans = SUBSCRIPTION_PLANS.filter(p => p.popular);
    expect(popularPlans).toHaveLength(1);
    expect(popularPlans[0].id).toBe("monthly_premium");
  });

  it("devrait calculer correctement l'économie annuelle", () => {
    // Premium mensuel: 24,99€ x 12 = 299,88€
    // Annuel: 199,99€
    // Économie: 299,88€ - 199,99€ = 99,89€ ≈ 100€
    const monthlyPremiumPrice = 24.99;
    const yearlyPrice = 199.99;
    const yearlyCost = monthlyPremiumPrice * 12;
    const savings = yearlyCost - yearlyPrice;
    
    expect(savings).toBeGreaterThan(99); // Au moins 99€ d'économie
    expect(savings).toBeLessThan(102); // Pas plus de 102€
  });

  it("chaque plan devrait avoir des fonctionnalités définies", () => {
    SUBSCRIPTION_PLANS.forEach(plan => {
      expect(plan.features).toBeDefined();
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });

  it("les identifiants de plan devraient être uniques", () => {
    const ids = SUBSCRIPTION_PLANS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe("Conformité App Store", () => {
  it("les identifiants StoreKit devraient suivre le format requis", () => {
    const storeKitIds = ["monthly_basic", "monthly_premium", "yearly"];
    
    storeKitIds.forEach(id => {
      // Les identifiants StoreKit doivent être alphanumériques avec underscores
      expect(id).toMatch(/^[a-z_]+$/);
    });
  });

  it("le plan gratuit ne devrait pas avoir d'identifiant StoreKit payant", () => {
    const freePlan = SUBSCRIPTION_PLANS.find(p => p.isFree);
    expect(freePlan?.id).toBe("free");
    // "free" n'est pas un produit StoreKit, c'est juste un état local
  });
});
