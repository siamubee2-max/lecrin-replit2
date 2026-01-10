import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// SAVED LOOK TYPES
// ============================================
describe("Saved Look Types", () => {
  const OCCASIONS = ["casual", "work", "formal", "sport", "party", "all"];
  const SEASONS = ["spring", "summer", "fall", "winter", "all"];

  it("should have valid occasion types", () => {
    expect(OCCASIONS).toHaveLength(6);
    expect(OCCASIONS).toContain("casual");
    expect(OCCASIONS).toContain("formal");
    expect(OCCASIONS).toContain("party");
  });

  it("should have valid season types", () => {
    expect(SEASONS).toHaveLength(5);
    expect(SEASONS).toContain("spring");
    expect(SEASONS).toContain("winter");
    expect(SEASONS).toContain("all");
  });
});

// ============================================
// LOOK FILTERING
// ============================================
describe("Look Filtering", () => {
  const mockLooks = [
    { id: 1, name: "Look Casual", occasion: "casual", season: "spring", isFavorite: true, createdAt: new Date("2025-01-10") },
    { id: 2, name: "Look Bureau", occasion: "work", season: "fall", isFavorite: false, createdAt: new Date("2025-01-09") },
    { id: 3, name: "Look Soirée", occasion: "formal", season: "winter", isFavorite: true, createdAt: new Date("2025-01-08") },
    { id: 4, name: "Look Sport", occasion: "sport", season: "summer", isFavorite: false, createdAt: new Date("2025-01-07") },
    { id: 5, name: "Look Fête", occasion: "party", season: "all", isFavorite: false, createdAt: new Date("2025-01-06") },
  ];

  const filterLooks = (
    looks: typeof mockLooks,
    filters: { occasion?: string; season?: string }
  ) => {
    return looks.filter((look) => {
      if (filters.occasion && filters.occasion !== "all" && look.occasion !== filters.occasion) {
        return false;
      }
      if (filters.season && filters.season !== "all" && look.season !== filters.season) {
        return false;
      }
      return true;
    });
  };

  it("should return all looks with no filters", () => {
    const result = filterLooks(mockLooks, {});
    expect(result).toHaveLength(5);
  });

  it("should filter by occasion", () => {
    const result = filterLooks(mockLooks, { occasion: "casual" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Look Casual");
  });

  it("should filter by season", () => {
    const result = filterLooks(mockLooks, { season: "winter" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Look Soirée");
  });

  it("should combine filters", () => {
    const result = filterLooks(mockLooks, { occasion: "work", season: "fall" });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Look Bureau");
  });

  it("should return empty when no matches", () => {
    const result = filterLooks(mockLooks, { occasion: "casual", season: "winter" });
    expect(result).toHaveLength(0);
  });

  it("should ignore 'all' filter values", () => {
    const result = filterLooks(mockLooks, { occasion: "all", season: "all" });
    expect(result).toHaveLength(5);
  });
});

// ============================================
// LOOK SORTING
// ============================================
describe("Look Sorting", () => {
  const mockLooks = [
    { id: 1, name: "Zebra Look", isFavorite: false, createdAt: new Date("2025-01-05") },
    { id: 2, name: "Alpha Look", isFavorite: true, createdAt: new Date("2025-01-10") },
    { id: 3, name: "Beta Look", isFavorite: false, createdAt: new Date("2025-01-08") },
    { id: 4, name: "Gamma Look", isFavorite: true, createdAt: new Date("2025-01-06") },
  ];

  const sortLooks = (looks: typeof mockLooks, sortBy: "date" | "name" | "favorites") => {
    const result = [...looks];
    
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "favorites":
        result.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case "date":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return result;
  };

  it("should sort by date (most recent first)", () => {
    const result = sortLooks(mockLooks, "date");
    expect(result[0].name).toBe("Alpha Look");
    expect(result[result.length - 1].name).toBe("Zebra Look");
  });

  it("should sort by name alphabetically", () => {
    const result = sortLooks(mockLooks, "name");
    expect(result[0].name).toBe("Alpha Look");
    expect(result[1].name).toBe("Beta Look");
    expect(result[2].name).toBe("Gamma Look");
    expect(result[3].name).toBe("Zebra Look");
  });

  it("should sort favorites first, then by date", () => {
    const result = sortLooks(mockLooks, "favorites");
    expect(result[0].isFavorite).toBe(true);
    expect(result[1].isFavorite).toBe(true);
    expect(result[2].isFavorite).toBe(false);
    expect(result[3].isFavorite).toBe(false);
    // Among favorites, most recent first
    expect(result[0].name).toBe("Alpha Look");
    expect(result[1].name).toBe("Gamma Look");
  });
});

// ============================================
// LOOK ITEM PARSING
// ============================================
describe("Look Item Parsing", () => {
  const parseLookItems = (wardrobeItemIds: string | null, jewelryItemIds: string | null) => {
    const wardrobeIds: number[] = wardrobeItemIds ? JSON.parse(wardrobeItemIds) : [];
    const jewelryIds: number[] = jewelryItemIds ? JSON.parse(jewelryItemIds) : [];
    return { wardrobeIds, jewelryIds };
  };

  it("should parse wardrobe item IDs", () => {
    const result = parseLookItems("[1,2,3]", null);
    expect(result.wardrobeIds).toEqual([1, 2, 3]);
    expect(result.jewelryIds).toEqual([]);
  });

  it("should parse jewelry item IDs", () => {
    const result = parseLookItems(null, "[10,20]");
    expect(result.wardrobeIds).toEqual([]);
    expect(result.jewelryIds).toEqual([10, 20]);
  });

  it("should parse both IDs", () => {
    const result = parseLookItems("[1,2]", "[10,20,30]");
    expect(result.wardrobeIds).toEqual([1, 2]);
    expect(result.jewelryIds).toEqual([10, 20, 30]);
  });

  it("should handle null values", () => {
    const result = parseLookItems(null, null);
    expect(result.wardrobeIds).toEqual([]);
    expect(result.jewelryIds).toEqual([]);
  });

  it("should handle empty arrays", () => {
    const result = parseLookItems("[]", "[]");
    expect(result.wardrobeIds).toEqual([]);
    expect(result.jewelryIds).toEqual([]);
  });
});

// ============================================
// LOOK STATISTICS
// ============================================
describe("Look Statistics", () => {
  const mockLooks = [
    { id: 1, isFavorite: true, isAiGenerated: true },
    { id: 2, isFavorite: false, isAiGenerated: true },
    { id: 3, isFavorite: true, isAiGenerated: false },
    { id: 4, isFavorite: false, isAiGenerated: true },
    { id: 5, isFavorite: true, isAiGenerated: false },
  ];

  const calculateStats = (looks: typeof mockLooks) => {
    return {
      total: looks.length,
      favoritesCount: looks.filter((l) => l.isFavorite).length,
      aiGenerated: looks.filter((l) => l.isAiGenerated).length,
    };
  };

  it("should calculate total looks", () => {
    const stats = calculateStats(mockLooks);
    expect(stats.total).toBe(5);
  });

  it("should calculate favorites count", () => {
    const stats = calculateStats(mockLooks);
    expect(stats.favoritesCount).toBe(3);
  });

  it("should calculate AI generated count", () => {
    const stats = calculateStats(mockLooks);
    expect(stats.aiGenerated).toBe(3);
  });

  it("should handle empty array", () => {
    const stats = calculateStats([]);
    expect(stats.total).toBe(0);
    expect(stats.favoritesCount).toBe(0);
    expect(stats.aiGenerated).toBe(0);
  });
});

// ============================================
// FAVORITE TOGGLE
// ============================================
describe("Favorite Toggle", () => {
  it("should toggle favorite from false to true", () => {
    const look = { id: 1, isFavorite: false };
    const updated = { ...look, isFavorite: !look.isFavorite };
    expect(updated.isFavorite).toBe(true);
  });

  it("should toggle favorite from true to false", () => {
    const look = { id: 1, isFavorite: true };
    const updated = { ...look, isFavorite: !look.isFavorite };
    expect(updated.isFavorite).toBe(false);
  });

  it("should handle null favorite", () => {
    const look = { id: 1, isFavorite: null as boolean | null };
    const updated = { ...look, isFavorite: !look.isFavorite };
    expect(updated.isFavorite).toBe(true);
  });
});

// ============================================
// DATE FORMATTING
// ============================================
describe("Date Formatting", () => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  it("should format date in French", () => {
    const date = new Date("2025-01-10");
    const formatted = formatDate(date);
    expect(formatted).toContain("janvier");
    expect(formatted).toContain("2025");
  });

  it("should include day number", () => {
    const date = new Date("2025-12-25");
    const formatted = formatDate(date);
    expect(formatted).toContain("25");
    expect(formatted).toContain("décembre");
  });
});

// ============================================
// LOOK VALIDATION
// ============================================
describe("Look Validation", () => {
  interface SavedLook {
    id: number;
    name: string;
    description?: string | null;
    occasion?: string | null;
    season?: string | null;
    wardrobeItemIds?: string | null;
  }

  const validateLook = (look: Partial<SavedLook>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!look.name || look.name.trim().length === 0) {
      errors.push("Name is required");
    }
    if (look.name && look.name.length > 255) {
      errors.push("Name must be 255 characters or less");
    }
    
    return { valid: errors.length === 0, errors };
  };

  it("should validate look with name", () => {
    const result = validateLook({ name: "Mon Look" });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject look without name", () => {
    const result = validateLook({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name is required");
  });

  it("should reject empty name", () => {
    const result = validateLook({ name: "   " });
    expect(result.valid).toBe(false);
  });

  it("should reject very long name", () => {
    const result = validateLook({ name: "a".repeat(300) });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Name must be 255 characters or less");
  });
});

// ============================================
// LOOK PREVIEW ITEMS
// ============================================
describe("Look Preview Items", () => {
  const mockWardrobeItems = [
    { id: 1, name: "Robe", imageUrl: "https://example.com/robe.jpg" },
    { id: 2, name: "Jean", imageUrl: "https://example.com/jean.jpg" },
    { id: 3, name: "T-shirt", imageUrl: null },
  ];

  const mockJewelryItems = [
    { id: 10, jewelryType: "necklace", imageUri: "https://example.com/necklace.jpg", jewelryIcon: "💎" },
    { id: 20, jewelryType: "earrings", imageUri: null, jewelryIcon: "✨" },
  ];

  const getLookPreviewItems = (
    wardrobeIds: number[],
    jewelryIds: number[],
    maxItems: number = 2
  ) => {
    const clothes = mockWardrobeItems.filter((item) => wardrobeIds.includes(item.id));
    const jewelry = mockJewelryItems.filter((item) => jewelryIds.includes(item.id));
    
    const previewItems: { type: "cloth" | "jewelry"; imageUrl: string | null; icon?: string }[] = [];
    
    // Add clothes first
    clothes.slice(0, maxItems).forEach((item) => {
      previewItems.push({ type: "cloth", imageUrl: item.imageUrl });
    });
    
    // Fill remaining slots with jewelry
    const remainingSlots = maxItems - previewItems.length;
    jewelry.slice(0, remainingSlots).forEach((item) => {
      previewItems.push({ type: "jewelry", imageUrl: item.imageUri, icon: item.jewelryIcon });
    });
    
    return previewItems;
  };

  it("should return clothes first", () => {
    const result = getLookPreviewItems([1, 2], [10], 2);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("cloth");
    expect(result[1].type).toBe("cloth");
  });

  it("should fill with jewelry if not enough clothes", () => {
    const result = getLookPreviewItems([1], [10, 20], 2);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("cloth");
    expect(result[1].type).toBe("jewelry");
  });

  it("should respect max items", () => {
    const result = getLookPreviewItems([1, 2, 3], [10, 20], 2);
    expect(result).toHaveLength(2);
  });

  it("should handle empty arrays", () => {
    const result = getLookPreviewItems([], [], 2);
    expect(result).toHaveLength(0);
  });

  it("should include jewelry icon", () => {
    const result = getLookPreviewItems([], [10], 1);
    expect(result[0].icon).toBe("💎");
  });
});

// ============================================
// SORT OPTIONS
// ============================================
describe("Sort Options", () => {
  const SORT_OPTIONS = [
    { id: "date", label: "Plus récents" },
    { id: "name", label: "Nom A-Z" },
    { id: "favorites", label: "Favoris d'abord" },
  ];

  it("should have three sort options", () => {
    expect(SORT_OPTIONS).toHaveLength(3);
  });

  it("should have date option", () => {
    const dateOption = SORT_OPTIONS.find((o) => o.id === "date");
    expect(dateOption).toBeDefined();
    expect(dateOption?.label).toBe("Plus récents");
  });

  it("should have name option", () => {
    const nameOption = SORT_OPTIONS.find((o) => o.id === "name");
    expect(nameOption).toBeDefined();
    expect(nameOption?.label).toBe("Nom A-Z");
  });

  it("should have favorites option", () => {
    const favOption = SORT_OPTIONS.find((o) => o.id === "favorites");
    expect(favOption).toBeDefined();
    expect(favOption?.label).toBe("Favoris d'abord");
  });
});
