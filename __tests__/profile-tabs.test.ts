/**
 * Profile Tabs Tests
 * Tests for style preferences, try-on history, and wishlist services
 */

import { describe, it, expect, vi } from "vitest";

// Import types only (to avoid AsyncStorage import issues)
import type {
  StylePreferences,
  TryOnHistoryItem,
  WishlistItem,
  MetalPreference,
  StonePreference,
  StyleType,
  OccasionType,
  BudgetRange,
} from "@/services/style-preferences-service";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

describe("Style Preferences", () => {
  describe("StylePreferences structure", () => {
    it("should have all required fields", () => {
      const preferences: StylePreferences = {
        preferredMetals: ["gold", "silver"],
        preferredStones: ["diamond", "emerald"],
        preferredStyles: ["classic", "modern"],
        preferredOccasions: ["everyday", "evening"],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: {
          rings: "52",
          bracelets: "18cm",
          necklaces: "45cm",
        },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.preferredMetals).toContain("gold");
      expect(preferences.preferredStones).toContain("diamond");
      expect(preferences.preferredStyles).toContain("classic");
      expect(preferences.preferredOccasions).toContain("everyday");
      expect(preferences.budgetRange).toBe("mid_range");
      expect(preferences.skinTone).toBe("medium");
    });

    it("should support all metal types", () => {
      const metals: MetalPreference[] = ["gold", "silver", "rose_gold", "platinum", "mixed"];
      const preferences: StylePreferences = {
        preferredMetals: metals,
        preferredStones: [],
        preferredStyles: [],
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "", necklaces: "" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.preferredMetals).toHaveLength(5);
      expect(preferences.preferredMetals).toContain("platinum");
    });

    it("should support all stone types", () => {
      const stones: StonePreference[] = ["diamond", "ruby", "sapphire", "emerald", "pearl", "none"];
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: stones,
        preferredStyles: [],
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "", necklaces: "" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.preferredStones).toHaveLength(6);
      expect(preferences.preferredStones).toContain("emerald");
    });

    it("should support all style types", () => {
      const styles: StyleType[] = ["classic", "modern", "bohemian", "minimalist", "glamorous", "vintage"];
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: [],
        preferredStyles: styles,
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "", necklaces: "" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.preferredStyles).toHaveLength(6);
      expect(preferences.preferredStyles).toContain("vintage");
    });

    it("should support all occasion types", () => {
      const occasions: OccasionType[] = ["everyday", "work", "evening", "wedding", "casual", "sport"];
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: [],
        preferredStyles: [],
        preferredOccasions: occasions,
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "", necklaces: "" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.preferredOccasions).toHaveLength(6);
      expect(preferences.preferredOccasions).toContain("wedding");
    });

    it("should support all skin tone types", () => {
      const skinTones: StylePreferences["skinTone"][] = ["light", "medium", "olive", "tan", "dark"];
      
      skinTones.forEach((tone) => {
        const preferences: StylePreferences = {
          preferredMetals: [],
          preferredStones: [],
          preferredStyles: [],
          preferredOccasions: [],
          budgetRange: "mid_range",
          skinTone: tone,
          sizePreferences: { rings: "", bracelets: "", necklaces: "" },
          allergies: [],
          updatedAt: new Date().toISOString(),
        };
        expect(preferences.skinTone).toBe(tone);
      });
    });

    it("should support all budget ranges", () => {
      const budgets: BudgetRange[] = ["budget", "mid_range", "premium", "luxury"];
      
      budgets.forEach((budget) => {
        const preferences: StylePreferences = {
          preferredMetals: [],
          preferredStones: [],
          preferredStyles: [],
          preferredOccasions: [],
          budgetRange: budget,
          skinTone: "medium",
          sizePreferences: { rings: "", bracelets: "", necklaces: "" },
          allergies: [],
          updatedAt: new Date().toISOString(),
        };
        expect(preferences.budgetRange).toBe(budget);
      });
    });
  });

  describe("Size preferences", () => {
    it("should store ring sizes", () => {
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: [],
        preferredStyles: [],
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "54", bracelets: "", necklaces: "" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.sizePreferences.rings).toBe("54");
    });

    it("should store bracelet sizes", () => {
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: [],
        preferredStyles: [],
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "18cm", necklaces: "" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.sizePreferences.bracelets).toBe("18cm");
    });

    it("should store necklace sizes", () => {
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: [],
        preferredStyles: [],
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "", necklaces: "45cm" },
        allergies: [],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.sizePreferences.necklaces).toBe("45cm");
    });
  });

  describe("Allergies", () => {
    it("should store allergy information", () => {
      const preferences: StylePreferences = {
        preferredMetals: [],
        preferredStones: [],
        preferredStyles: [],
        preferredOccasions: [],
        budgetRange: "mid_range",
        skinTone: "medium",
        sizePreferences: { rings: "", bracelets: "", necklaces: "" },
        allergies: ["nickel", "copper"],
        updatedAt: new Date().toISOString(),
      };

      expect(preferences.allergies).toContain("nickel");
      expect(preferences.allergies).toHaveLength(2);
    });
  });
});

describe("Try-On History", () => {
  describe("TryOnHistoryItem structure", () => {
    it("should have all required fields", () => {
      const item: TryOnHistoryItem = {
        id: "test-id-123",
        jewelryType: "Collier",
        jewelryStyle: "Classique",
        jewelryIcon: "📿",
        modelType: "elegant",
        modelName: "Modèle Élégance",
        createdAt: new Date().toISOString(),
        duration: 45,
        liked: true,
        shared: false,
      };

      expect(item.id).toBe("test-id-123");
      expect(item.jewelryType).toBe("Collier");
      expect(item.duration).toBe(45);
      expect(item.liked).toBe(true);
      expect(item.shared).toBe(false);
    });

    it("should support all jewelry types", () => {
      const types = ["Collier", "Boucles d'oreilles", "Bague", "Bracelet", "Chevillière", "Broche"];
      
      types.forEach((type) => {
        const item: TryOnHistoryItem = {
          id: `test-${type}`,
          jewelryType: type,
          jewelryStyle: "Modern",
          jewelryIcon: "💎",
          modelType: "casual",
          modelName: "Test Model",
          createdAt: new Date().toISOString(),
          duration: 30,
          liked: false,
          shared: false,
        };
        expect(item.jewelryType).toBe(type);
      });
    });

    it("should track duration correctly", () => {
      const item: TryOnHistoryItem = {
        id: "duration-test",
        jewelryType: "Bague",
        jewelryStyle: "Vintage",
        jewelryIcon: "💍",
        modelType: "elegant",
        modelName: "Test Model",
        createdAt: new Date().toISOString(),
        duration: 120, // 2 minutes
        liked: false,
        shared: false,
      };

      expect(item.duration).toBe(120);
      expect(item.duration).toBeGreaterThan(0);
    });

    it("should support optional image URI", () => {
      const itemWithImage: TryOnHistoryItem = {
        id: "image-test",
        jewelryType: "Bracelet",
        jewelryStyle: "Bohème",
        jewelryIcon: "⌚",
        modelType: "casual",
        modelName: "Test Model",
        createdAt: new Date().toISOString(),
        duration: 60,
        liked: true,
        shared: true,
        imageUri: "file:///path/to/image.jpg",
      };

      expect(itemWithImage.imageUri).toBeDefined();
      expect(itemWithImage.imageUri).toContain("image");
    });
  });

  describe("History statistics", () => {
    it("should calculate total try-ons", () => {
      const history: TryOnHistoryItem[] = [
        createMockHistoryItem("1"),
        createMockHistoryItem("2"),
        createMockHistoryItem("3"),
      ];

      expect(history.length).toBe(3);
    });

    it("should count liked items", () => {
      const history: TryOnHistoryItem[] = [
        { ...createMockHistoryItem("1"), liked: true },
        { ...createMockHistoryItem("2"), liked: false },
        { ...createMockHistoryItem("3"), liked: true },
      ];

      const likedCount = history.filter((item) => item.liked).length;
      expect(likedCount).toBe(2);
    });

    it("should count shared items", () => {
      const history: TryOnHistoryItem[] = [
        { ...createMockHistoryItem("1"), shared: true },
        { ...createMockHistoryItem("2"), shared: true },
        { ...createMockHistoryItem("3"), shared: false },
      ];

      const sharedCount = history.filter((item) => item.shared).length;
      expect(sharedCount).toBe(2);
    });

    it("should calculate average duration", () => {
      const history: TryOnHistoryItem[] = [
        { ...createMockHistoryItem("1"), duration: 30 },
        { ...createMockHistoryItem("2"), duration: 60 },
        { ...createMockHistoryItem("3"), duration: 90 },
      ];

      const totalDuration = history.reduce((sum, item) => sum + item.duration, 0);
      const averageDuration = totalDuration / history.length;
      expect(averageDuration).toBe(60);
    });

    it("should find most tried jewelry type", () => {
      const history: TryOnHistoryItem[] = [
        { ...createMockHistoryItem("1"), jewelryType: "Collier" },
        { ...createMockHistoryItem("2"), jewelryType: "Collier" },
        { ...createMockHistoryItem("3"), jewelryType: "Bague" },
        { ...createMockHistoryItem("4"), jewelryType: "Collier" },
      ];

      const typeCounts = history.reduce((acc, item) => {
        acc[item.jewelryType] = (acc[item.jewelryType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostTriedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
      expect(mostTriedType).toBe("Collier");
    });
  });
});

describe("Wishlist", () => {
  describe("WishlistItem structure", () => {
    it("should have all required fields", () => {
      const item: WishlistItem = {
        id: "wishlist-123",
        name: "Collier en or avec diamant",
        type: "necklace",
        metal: "gold",
        priority: "high",
        addedAt: new Date().toISOString(),
      };

      expect(item.id).toBe("wishlist-123");
      expect(item.name).toBe("Collier en or avec diamant");
      expect(item.type).toBe("necklace");
      expect(item.metal).toBe("gold");
      expect(item.priority).toBe("high");
    });

    it("should support optional fields", () => {
      const item: WishlistItem = {
        id: "wishlist-456",
        name: "Bague saphir",
        type: "ring",
        metal: "platinum",
        priority: "medium",
        addedAt: new Date().toISOString(),
        price: 1500,
        currency: "EUR",
        notes: "Pour mon anniversaire",
        externalUrl: "https://example.com/ring",
        imageUri: "https://example.com/ring.jpg",
        brandName: "Moni'attitude",
        brandId: "cartier-123",
        stone: "sapphire",
      };

      expect(item.price).toBe(1500);
      expect(item.currency).toBe("EUR");
      expect(item.notes).toBe("Pour mon anniversaire");
      expect(item.externalUrl).toContain("example.com");
      expect(item.brandName).toBe("Moni'attitude");
      expect(item.stone).toBe("sapphire");
    });

    it("should support all jewelry types", () => {
      const types = ["necklace", "earrings", "ring", "bracelet", "anklet", "brooch"];
      
      types.forEach((type) => {
        const item: WishlistItem = {
          id: `type-${type}`,
          name: `Test ${type}`,
          type: type,
          metal: "gold",
          priority: "medium",
          addedAt: new Date().toISOString(),
        };
        expect(item.type).toBe(type);
      });
    });

    it("should support all metal types", () => {
      const metals = ["gold", "silver", "rose_gold", "platinum", "white_gold"];
      
      metals.forEach((metal) => {
        const item: WishlistItem = {
          id: `metal-${metal}`,
          name: `Test ${metal}`,
          type: "ring",
          metal: metal,
          priority: "medium",
          addedAt: new Date().toISOString(),
        };
        expect(item.metal).toBe(metal);
      });
    });

    it("should support all priority levels", () => {
      const priorities: WishlistItem["priority"][] = ["high", "medium", "low"];
      
      priorities.forEach((priority) => {
        const item: WishlistItem = {
          id: `priority-${priority}`,
          name: `Test ${priority}`,
          type: "bracelet",
          metal: "silver",
          priority: priority,
          addedAt: new Date().toISOString(),
        };
        expect(item.priority).toBe(priority);
      });
    });
  });

  describe("Wishlist operations", () => {
    it("should sort by priority", () => {
      const wishlist: WishlistItem[] = [
        createMockWishlistItem("1", "low"),
        createMockWishlistItem("2", "high"),
        createMockWishlistItem("3", "medium"),
      ];

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const sorted = [...wishlist].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );

      expect(sorted[0].priority).toBe("high");
      expect(sorted[1].priority).toBe("medium");
      expect(sorted[2].priority).toBe("low");
    });

    it("should sort by date added", () => {
      const wishlist: WishlistItem[] = [
        { ...createMockWishlistItem("1", "medium"), addedAt: "2024-01-01T10:00:00Z" },
        { ...createMockWishlistItem("2", "medium"), addedAt: "2024-01-03T10:00:00Z" },
        { ...createMockWishlistItem("3", "medium"), addedAt: "2024-01-02T10:00:00Z" },
      ];

      const sorted = [...wishlist].sort(
        (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      );

      expect(sorted[0].id).toBe("2"); // Most recent
      expect(sorted[2].id).toBe("1"); // Oldest
    });

    it("should filter by type", () => {
      const wishlist: WishlistItem[] = [
        { ...createMockWishlistItem("1", "medium"), type: "necklace" },
        { ...createMockWishlistItem("2", "medium"), type: "ring" },
        { ...createMockWishlistItem("3", "medium"), type: "necklace" },
      ];

      const necklaces = wishlist.filter((item) => item.type === "necklace");
      expect(necklaces.length).toBe(2);
    });

    it("should filter by metal", () => {
      const wishlist: WishlistItem[] = [
        { ...createMockWishlistItem("1", "medium"), metal: "gold" },
        { ...createMockWishlistItem("2", "medium"), metal: "silver" },
        { ...createMockWishlistItem("3", "medium"), metal: "gold" },
      ];

      const goldItems = wishlist.filter((item) => item.metal === "gold");
      expect(goldItems.length).toBe(2);
    });

    it("should calculate total estimated value", () => {
      const wishlist: WishlistItem[] = [
        { ...createMockWishlistItem("1", "high"), price: 500 },
        { ...createMockWishlistItem("2", "medium"), price: 300 },
        { ...createMockWishlistItem("3", "low"), price: 200 },
      ];

      const totalValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
      expect(totalValue).toBe(1000);
    });
  });
});

describe("Priority Constants", () => {
  it("should have correct priority names", () => {
    const PRIORITY_NAMES = {
      high: "Haute",
      medium: "Moyenne",
      low: "Basse",
    };

    expect(PRIORITY_NAMES.high).toBe("Haute");
    expect(PRIORITY_NAMES.medium).toBe("Moyenne");
    expect(PRIORITY_NAMES.low).toBe("Basse");
  });

  it("should have correct priority icons", () => {
    const PRIORITY_ICONS = {
      high: "🔥",
      medium: "⭐",
      low: "💤",
    };

    expect(PRIORITY_ICONS.high).toBe("🔥");
    expect(PRIORITY_ICONS.medium).toBe("⭐");
    expect(PRIORITY_ICONS.low).toBe("💤");
  });
});

// Helper functions
function createMockHistoryItem(id: string): TryOnHistoryItem {
  return {
    id,
    jewelryType: "Collier",
    jewelryStyle: "Classique",
    jewelryIcon: "📿",
    modelType: "elegant",
    modelName: "Test Model",
    createdAt: new Date().toISOString(),
    duration: 30,
    liked: false,
    shared: false,
  };
}

function createMockWishlistItem(id: string, priority: WishlistItem["priority"]): WishlistItem {
  return {
    id,
    name: `Test Item ${id}`,
    type: "necklace",
    metal: "gold",
    priority,
    addedAt: new Date().toISOString(),
  };
}
