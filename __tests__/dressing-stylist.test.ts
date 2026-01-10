import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// WARDROBE ITEM TYPES
// ============================================
describe("Wardrobe Item Types", () => {
  const CATEGORIES = ["tops", "bottoms", "dresses", "outerwear", "shoes", "bags", "accessories", "other"];
  const SEASONS = ["spring", "summer", "fall", "winter", "all"];
  const OCCASIONS = ["casual", "work", "formal", "sport", "party", "all"];

  it("should have valid category types", () => {
    expect(CATEGORIES).toHaveLength(8);
    expect(CATEGORIES).toContain("tops");
    expect(CATEGORIES).toContain("dresses");
    expect(CATEGORIES).toContain("shoes");
  });

  it("should have valid season types", () => {
    expect(SEASONS).toHaveLength(5);
    expect(SEASONS).toContain("spring");
    expect(SEASONS).toContain("winter");
    expect(SEASONS).toContain("all");
  });

  it("should have valid occasion types", () => {
    expect(OCCASIONS).toHaveLength(6);
    expect(OCCASIONS).toContain("casual");
    expect(OCCASIONS).toContain("formal");
    expect(OCCASIONS).toContain("party");
  });
});

// ============================================
// WARDROBE ITEM VALIDATION
// ============================================
describe("Wardrobe Item Validation", () => {
  interface WardrobeItem {
    id: number;
    name: string;
    category: string;
    brand?: string | null;
    color?: string | null;
    price?: number | null;
    imageUrl?: string | null;
  }

  const validateItem = (item: Partial<WardrobeItem>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!item.name || item.name.trim().length === 0) {
      errors.push("Name is required");
    }
    if (!item.category) {
      errors.push("Category is required");
    }
    if (item.price !== undefined && item.price !== null && item.price < 0) {
      errors.push("Price must be non-negative");
    }
    
    return { valid: errors.length === 0, errors };
  };

  it("should validate required fields", () => {
    const result = validateItem({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
    expect(result.errors).toContain("Category is required");
  });

  it("should accept valid item", () => {
    const result = validateItem({
      name: "Robe noire",
      category: "dresses",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject negative price", () => {
    const result = validateItem({
      name: "Test",
      category: "tops",
      price: -100,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Price must be non-negative");
  });

  it("should accept item with all fields", () => {
    const result = validateItem({
      name: "Chemise Zara",
      category: "tops",
      brand: "Zara",
      color: "white",
      price: 4900,
      imageUrl: "https://example.com/image.jpg",
    });
    expect(result.valid).toBe(true);
  });
});

// ============================================
// WARDROBE FILTERING
// ============================================
describe("Wardrobe Filtering", () => {
  const mockItems = [
    { id: 1, name: "Robe noire", category: "dresses", brand: "Zara", color: "black", price: 5900 },
    { id: 2, name: "Jean bleu", category: "bottoms", brand: "Levi's", color: "blue", price: 8900 },
    { id: 3, name: "T-shirt blanc", category: "tops", brand: "H&M", color: "white", price: 1500 },
    { id: 4, name: "Veste cuir", category: "outerwear", brand: "Zara", color: "black", price: 15900 },
    { id: 5, name: "Escarpins", category: "shoes", brand: "Louboutin", color: "red", price: 69500 },
  ];

  const filterItems = (
    items: typeof mockItems,
    filters: {
      category?: string;
      brand?: string;
      color?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
    }
  ) => {
    return items.filter((item) => {
      if (filters.category && filters.category !== "all" && item.category !== filters.category) {
        return false;
      }
      if (filters.brand && filters.brand !== "all" && item.brand !== filters.brand) {
        return false;
      }
      if (filters.color && filters.color !== "all" && item.color !== filters.color) {
        return false;
      }
      if (filters.minPrice !== undefined && item.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && item.price > filters.maxPrice) {
        return false;
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = item.brand?.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand) return false;
      }
      return true;
    });
  };

  it("should return all items with no filters", () => {
    const result = filterItems(mockItems, {});
    expect(result).toHaveLength(5);
  });

  it("should filter by category", () => {
    const result = filterItems(mockItems, { category: "dresses" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Robe noire");
  });

  it("should filter by brand", () => {
    const result = filterItems(mockItems, { brand: "Zara" });
    expect(result).toHaveLength(2);
  });

  it("should filter by color", () => {
    const result = filterItems(mockItems, { color: "black" });
    expect(result).toHaveLength(2);
  });

  it("should filter by price range", () => {
    const result = filterItems(mockItems, { minPrice: 5000, maxPrice: 10000 });
    expect(result).toHaveLength(2);
  });

  it("should filter by search query", () => {
    const result = filterItems(mockItems, { search: "robe" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Robe noire");
  });

  it("should combine multiple filters", () => {
    const result = filterItems(mockItems, { brand: "Zara", color: "black" });
    expect(result).toHaveLength(2);
  });

  it("should return empty array when no matches", () => {
    const result = filterItems(mockItems, { category: "bags" });
    expect(result).toHaveLength(0);
  });
});

// ============================================
// AI STYLIST LOOK GENERATION
// ============================================
describe("AI Stylist Look Generation", () => {
  interface LookSuggestion {
    name: string;
    description: string;
    occasion: string;
    season: string;
    wardrobeItemIds: number[];
    jewelryItemIds: number[];
    stylingTips: string;
    confidence: number;
  }

  const validateLook = (look: Partial<LookSuggestion>): boolean => {
    if (!look.name || look.name.length === 0) return false;
    if (!look.wardrobeItemIds || look.wardrobeItemIds.length === 0) return false;
    if (look.confidence === undefined || look.confidence < 0 || look.confidence > 100) return false;
    return true;
  };

  it("should validate look with required fields", () => {
    const look: LookSuggestion = {
      name: "Look Casual Chic",
      description: "Un look décontracté mais élégant",
      occasion: "casual",
      season: "spring",
      wardrobeItemIds: [1, 2],
      jewelryItemIds: [1],
      stylingTips: "Ajoutez une ceinture pour structurer la silhouette",
      confidence: 85,
    };
    expect(validateLook(look)).toBe(true);
  });

  it("should reject look without name", () => {
    const look = {
      wardrobeItemIds: [1],
      confidence: 80,
    };
    expect(validateLook(look)).toBe(false);
  });

  it("should reject look without wardrobe items", () => {
    const look = {
      name: "Test Look",
      wardrobeItemIds: [],
      confidence: 80,
    };
    expect(validateLook(look)).toBe(false);
  });

  it("should reject look with invalid confidence", () => {
    const look = {
      name: "Test Look",
      wardrobeItemIds: [1],
      confidence: 150,
    };
    expect(validateLook(look)).toBe(false);
  });
});

// ============================================
// COLOR HARMONY ANALYSIS
// ============================================
describe("Color Harmony Analysis", () => {
  const COLOR_GROUPS = {
    neutrals: ["black", "white", "gray", "beige", "navy"],
    warm: ["red", "orange", "yellow", "brown", "gold"],
    cool: ["blue", "green", "purple", "silver", "pink"],
  };

  const analyzeColorHarmony = (colors: string[]): { score: number; feedback: string } => {
    if (colors.length < 2) {
      return { score: 100, feedback: "Ajoutez plus de couleurs pour analyser l'harmonie." };
    }

    const neutralCount = colors.filter((c) => COLOR_GROUPS.neutrals.includes(c)).length;
    const warmCount = colors.filter((c) => COLOR_GROUPS.warm.includes(c)).length;
    const coolCount = colors.filter((c) => COLOR_GROUPS.cool.includes(c)).length;

    // All neutrals = perfect
    if (neutralCount === colors.length) {
      return { score: 95, feedback: "Palette neutre élégante et intemporelle." };
    }

    // Neutrals + one color family = good
    if (neutralCount > 0 && (warmCount === 0 || coolCount === 0)) {
      return { score: 85, feedback: "Bonne harmonie avec une base neutre." };
    }

    // Mixed warm and cool = less harmonious
    if (warmCount > 0 && coolCount > 0) {
      return { score: 60, feedback: "Mélange de couleurs chaudes et froides - audacieux mais risqué." };
    }

    return { score: 75, feedback: "Combinaison acceptable." };
  };

  it("should give high score for all neutrals", () => {
    const result = analyzeColorHarmony(["black", "white", "gray"]);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("should give good score for neutrals + warm", () => {
    const result = analyzeColorHarmony(["black", "red", "gold"]);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("should give lower score for mixed warm and cool", () => {
    const result = analyzeColorHarmony(["red", "blue", "green"]);
    expect(result.score).toBeLessThan(70);
  });

  it("should handle single color", () => {
    const result = analyzeColorHarmony(["black"]);
    expect(result.score).toBe(100);
  });
});

// ============================================
// LOOK SAVING
// ============================================
describe("Look Saving", () => {
  interface SavedLook {
    id?: number;
    name: string;
    description?: string;
    occasion?: string;
    season?: string;
    wardrobeItemIds: string;
    jewelryItemIds?: string;
    isAiGenerated?: boolean;
  }

  const prepareLookForSave = (look: {
    name: string;
    description?: string;
    occasion?: string;
    season?: string;
    wardrobeItemIds: number[];
    jewelryItemIds?: number[];
    isAiGenerated?: boolean;
  }): SavedLook => {
    return {
      name: look.name,
      description: look.description,
      occasion: look.occasion,
      season: look.season,
      wardrobeItemIds: JSON.stringify(look.wardrobeItemIds),
      jewelryItemIds: look.jewelryItemIds ? JSON.stringify(look.jewelryItemIds) : undefined,
      isAiGenerated: look.isAiGenerated,
    };
  };

  it("should serialize wardrobe item IDs", () => {
    const result = prepareLookForSave({
      name: "Test Look",
      wardrobeItemIds: [1, 2, 3],
    });
    expect(result.wardrobeItemIds).toBe("[1,2,3]");
  });

  it("should serialize jewelry item IDs", () => {
    const result = prepareLookForSave({
      name: "Test Look",
      wardrobeItemIds: [1],
      jewelryItemIds: [10, 20],
    });
    expect(result.jewelryItemIds).toBe("[10,20]");
  });

  it("should preserve optional fields", () => {
    const result = prepareLookForSave({
      name: "Soirée Chic",
      description: "Look élégant pour une soirée",
      occasion: "formal",
      season: "winter",
      wardrobeItemIds: [1, 2],
      isAiGenerated: true,
    });
    expect(result.name).toBe("Soirée Chic");
    expect(result.description).toBe("Look élégant pour une soirée");
    expect(result.occasion).toBe("formal");
    expect(result.season).toBe("winter");
    expect(result.isAiGenerated).toBe(true);
  });
});

// ============================================
// WARDROBE STATISTICS
// ============================================
describe("Wardrobe Statistics", () => {
  const mockItems = [
    { id: 1, category: "dresses", brand: "Zara", price: 5900 },
    { id: 2, category: "tops", brand: "H&M", price: 1500 },
    { id: 3, category: "tops", brand: "Zara", price: 2500 },
    { id: 4, category: "bottoms", brand: "Levi's", price: 8900 },
    { id: 5, category: "shoes", brand: "Nike", price: 12000 },
  ];

  const calculateStats = (items: typeof mockItems) => {
    const totalValue = items.reduce((sum, item) => sum + item.price, 0);
    const categoryCount: Record<string, number> = {};
    const brandCount: Record<string, number> = {};

    items.forEach((item) => {
      categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      brandCount[item.brand] = (brandCount[item.brand] || 0) + 1;
    });

    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0];

    return {
      totalItems: items.length,
      totalValue,
      averagePrice: Math.round(totalValue / items.length),
      topCategory: topCategory?.[0],
      topBrand: topBrand?.[0],
      categoryBreakdown: categoryCount,
    };
  };

  it("should calculate total items", () => {
    const stats = calculateStats(mockItems);
    expect(stats.totalItems).toBe(5);
  });

  it("should calculate total value", () => {
    const stats = calculateStats(mockItems);
    expect(stats.totalValue).toBe(30800);
  });

  it("should calculate average price", () => {
    const stats = calculateStats(mockItems);
    expect(stats.averagePrice).toBe(6160);
  });

  it("should find top category", () => {
    const stats = calculateStats(mockItems);
    expect(stats.topCategory).toBe("tops");
  });

  it("should find top brand", () => {
    const stats = calculateStats(mockItems);
    expect(stats.topBrand).toBe("Zara");
  });

  it("should provide category breakdown", () => {
    const stats = calculateStats(mockItems);
    expect(stats.categoryBreakdown.tops).toBe(2);
    expect(stats.categoryBreakdown.dresses).toBe(1);
  });
});

// ============================================
// IMAGE UPLOAD VALIDATION
// ============================================
describe("Image Upload Validation", () => {
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const validateImageUpload = (
    mimeType: string,
    fileSize: number
  ): { valid: boolean; error?: string } => {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { valid: false, error: "Format non supporté. Utilisez JPEG, PNG ou WebP." };
    }
    if (fileSize > MAX_FILE_SIZE) {
      return { valid: false, error: "Fichier trop volumineux. Maximum 10MB." };
    }
    return { valid: true };
  };

  it("should accept JPEG images", () => {
    const result = validateImageUpload("image/jpeg", 1024 * 1024);
    expect(result.valid).toBe(true);
  });

  it("should accept PNG images", () => {
    const result = validateImageUpload("image/png", 2 * 1024 * 1024);
    expect(result.valid).toBe(true);
  });

  it("should reject GIF images", () => {
    const result = validateImageUpload("image/gif", 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Format non supporté");
  });

  it("should reject oversized files", () => {
    const result = validateImageUpload("image/jpeg", 15 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("trop volumineux");
  });
});

// ============================================
// OCCASION AND SEASON MATCHING
// ============================================
describe("Occasion and Season Matching", () => {
  const matchItemToContext = (
    item: { season?: string; occasion?: string },
    context: { season?: string; occasion?: string }
  ): number => {
    let score = 50; // Base score

    // Season matching
    if (item.season && context.season) {
      if (item.season === context.season || item.season === "all") {
        score += 25;
      } else {
        score -= 15;
      }
    }

    // Occasion matching
    if (item.occasion && context.occasion) {
      if (item.occasion === context.occasion || item.occasion === "all") {
        score += 25;
      } else {
        score -= 15;
      }
    }

    return Math.max(0, Math.min(100, score));
  };

  it("should give high score for perfect match", () => {
    const score = matchItemToContext(
      { season: "summer", occasion: "casual" },
      { season: "summer", occasion: "casual" }
    );
    expect(score).toBe(100);
  });

  it("should give good score for 'all' season", () => {
    const score = matchItemToContext(
      { season: "all", occasion: "casual" },
      { season: "winter", occasion: "casual" }
    );
    expect(score).toBe(100);
  });

  it("should penalize season mismatch", () => {
    const score = matchItemToContext(
      { season: "summer", occasion: "casual" },
      { season: "winter", occasion: "casual" }
    );
    expect(score).toBeLessThan(80);
  });

  it("should penalize occasion mismatch", () => {
    const score = matchItemToContext(
      { season: "summer", occasion: "formal" },
      { season: "summer", occasion: "sport" }
    );
    expect(score).toBeLessThan(80);
  });
});
