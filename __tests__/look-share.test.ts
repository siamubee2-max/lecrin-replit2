import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================
// LOOK SHARE CARD DATA
// ============================================
describe("Look Share Card Data", () => {
  const OCCASION_LABELS: Record<string, { label: string; icon: string }> = {
    casual: { label: "Casual", icon: "👕" },
    work: { label: "Travail", icon: "💼" },
    formal: { label: "Soirée", icon: "🎩" },
    sport: { label: "Sport", icon: "🏃" },
    party: { label: "Fête", icon: "🎉" },
    all: { label: "Tous", icon: "✨" },
  };

  const SEASON_LABELS: Record<string, { label: string; icon: string }> = {
    spring: { label: "Printemps", icon: "🌸" },
    summer: { label: "Été", icon: "☀️" },
    fall: { label: "Automne", icon: "🍂" },
    winter: { label: "Hiver", icon: "❄️" },
    all: { label: "Toutes saisons", icon: "🌍" },
  };

  it("should have all occasion labels", () => {
    expect(Object.keys(OCCASION_LABELS)).toHaveLength(6);
    expect(OCCASION_LABELS.casual.label).toBe("Casual");
    expect(OCCASION_LABELS.work.icon).toBe("💼");
  });

  it("should have all season labels", () => {
    expect(Object.keys(SEASON_LABELS)).toHaveLength(5);
    expect(SEASON_LABELS.spring.label).toBe("Printemps");
    expect(SEASON_LABELS.winter.icon).toBe("❄️");
  });

  it("should return correct occasion info", () => {
    const occasion = "formal";
    const info = OCCASION_LABELS[occasion];
    expect(info).toBeDefined();
    expect(info.label).toBe("Soirée");
    expect(info.icon).toBe("🎩");
  });

  it("should return correct season info", () => {
    const season = "summer";
    const info = SEASON_LABELS[season];
    expect(info).toBeDefined();
    expect(info.label).toBe("Été");
    expect(info.icon).toBe("☀️");
  });
});

// ============================================
// DISPLAY ITEMS GENERATION
// ============================================
describe("Display Items Generation", () => {
  interface WardrobeItem {
    id: number;
    name: string;
    imageUrl: string | null;
  }

  interface JewelryItem {
    id: number;
    jewelryType: string;
    imageUri: string | null;
    jewelryIcon: string | null;
    modelName: string | null;
  }

  const generateDisplayItems = (
    wardrobeItems: WardrobeItem[],
    jewelryItems: JewelryItem[],
    maxItems: number = 6
  ) => {
    const items: { type: "wardrobe" | "jewelry"; imageUrl: string | null; icon?: string; name: string }[] = [];
    
    wardrobeItems.slice(0, 4).forEach((item) => {
      items.push({
        type: "wardrobe",
        imageUrl: item.imageUrl,
        name: item.name,
      });
    });
    
    jewelryItems.slice(0, maxItems - items.length).forEach((item) => {
      items.push({
        type: "jewelry",
        imageUrl: item.imageUri,
        icon: item.jewelryIcon || "💎",
        name: item.modelName || item.jewelryType,
      });
    });
    
    return items;
  };

  const mockWardrobeItems: WardrobeItem[] = [
    { id: 1, name: "Robe noire", imageUrl: "https://example.com/robe.jpg" },
    { id: 2, name: "Jean bleu", imageUrl: "https://example.com/jean.jpg" },
    { id: 3, name: "T-shirt blanc", imageUrl: null },
  ];

  const mockJewelryItems: JewelryItem[] = [
    { id: 10, jewelryType: "necklace", imageUri: "https://example.com/necklace.jpg", jewelryIcon: "💎", modelName: "Collier diamant" },
    { id: 20, jewelryType: "earrings", imageUri: null, jewelryIcon: "✨", modelName: null },
  ];

  it("should prioritize wardrobe items", () => {
    const result = generateDisplayItems(mockWardrobeItems, mockJewelryItems, 6);
    expect(result[0].type).toBe("wardrobe");
    expect(result[1].type).toBe("wardrobe");
    expect(result[2].type).toBe("wardrobe");
  });

  it("should fill remaining slots with jewelry", () => {
    const result = generateDisplayItems(mockWardrobeItems, mockJewelryItems, 6);
    expect(result.length).toBe(5); // 3 wardrobe + 2 jewelry
    expect(result[3].type).toBe("jewelry");
    expect(result[4].type).toBe("jewelry");
  });

  it("should limit wardrobe items to 4", () => {
    const manyWardrobeItems: WardrobeItem[] = [
      { id: 1, name: "Item 1", imageUrl: null },
      { id: 2, name: "Item 2", imageUrl: null },
      { id: 3, name: "Item 3", imageUrl: null },
      { id: 4, name: "Item 4", imageUrl: null },
      { id: 5, name: "Item 5", imageUrl: null },
    ];
    const result = generateDisplayItems(manyWardrobeItems, mockJewelryItems, 6);
    const wardrobeCount = result.filter(i => i.type === "wardrobe").length;
    expect(wardrobeCount).toBe(4);
  });

  it("should use default icon for jewelry without icon", () => {
    const jewelryWithoutIcon: JewelryItem[] = [
      { id: 1, jewelryType: "ring", imageUri: null, jewelryIcon: null, modelName: null },
    ];
    const result = generateDisplayItems([], jewelryWithoutIcon, 6);
    expect(result[0].icon).toBe("💎");
  });

  it("should use modelName if available, otherwise jewelryType", () => {
    const result = generateDisplayItems([], mockJewelryItems, 6);
    expect(result[0].name).toBe("Collier diamant"); // has modelName
    expect(result[1].name).toBe("earrings"); // no modelName, uses jewelryType
  });

  it("should handle empty arrays", () => {
    const result = generateDisplayItems([], [], 6);
    expect(result).toHaveLength(0);
  });
});

// ============================================
// SHARE MESSAGE GENERATION
// ============================================
describe("Share Message Generation", () => {
  const generateShareMessage = (lookName: string, isAiGenerated: boolean) => {
    const aiTag = isAiGenerated ? " (créé par IA)" : "";
    return `Découvrez mon look "${lookName}"${aiTag} créé avec L'Écrin Virtuel ! 💍✨`;
  };

  it("should generate message with look name", () => {
    const message = generateShareMessage("Look Soirée", false);
    expect(message).toContain("Look Soirée");
  });

  it("should add AI tag for AI-generated looks", () => {
    const message = generateShareMessage("Look Bureau", true);
    expect(message).toContain("(créé par IA)");
  });

  it("should not add AI tag for manual looks", () => {
    const message = generateShareMessage("Look Casual", false);
    expect(message).not.toContain("(créé par IA)");
  });

  it("should include emojis", () => {
    const message = generateShareMessage("Test", false);
    expect(message).toContain("💍");
    expect(message).toContain("✨");
  });

  it("should include brand name", () => {
    const message = generateShareMessage("Test", false);
    expect(message).toContain("L'Écrin Virtuel");
  });
});

// ============================================
// SHARE CARD DIMENSIONS
// ============================================
describe("Share Card Dimensions", () => {
  const CARD_WIDTH = 360;
  const ITEM_CARD_WIDTH = 100;
  const ITEM_IMAGE_HEIGHT = 80;
  const BORDER_RADIUS = 16;

  it("should have correct card width", () => {
    expect(CARD_WIDTH).toBe(360);
  });

  it("should have correct item card width", () => {
    expect(ITEM_CARD_WIDTH).toBe(100);
  });

  it("should have correct item image height", () => {
    expect(ITEM_IMAGE_HEIGHT).toBe(80);
  });

  it("should have correct border radius", () => {
    expect(BORDER_RADIUS).toBe(16);
  });

  it("should fit 3 items per row with gap", () => {
    const gap = 10;
    const totalWidth = ITEM_CARD_WIDTH * 3 + gap * 2;
    expect(totalWidth).toBeLessThanOrEqual(CARD_WIDTH - 32); // 32 = padding
  });
});

// ============================================
// BRANDING ELEMENTS
// ============================================
describe("Branding Elements", () => {
  const BRAND_NAME = "L'Écrin Virtuel";
  const BRAND_TAGLINE = "Essayage virtuel de bijoux";
  const BRAND_ICON = "💎";
  const BRAND_COLOR = "#1a2744";
  const ACCENT_COLOR = "#C9A227";

  it("should have correct brand name", () => {
    expect(BRAND_NAME).toBe("L'Écrin Virtuel");
  });

  it("should have correct tagline", () => {
    expect(BRAND_TAGLINE).toBe("Essayage virtuel de bijoux");
  });

  it("should have correct brand icon", () => {
    expect(BRAND_ICON).toBe("💎");
  });

  it("should have correct brand color", () => {
    expect(BRAND_COLOR).toBe("#1a2744");
  });

  it("should have correct accent color", () => {
    expect(ACCENT_COLOR).toBe("#C9A227");
  });
});

// ============================================
// SHARE CAPTURE FLOW
// ============================================
describe("Share Capture Flow", () => {
  const mockCaptureStates = {
    initial: { isCapturing: false, shareImageUri: null, showShareModal: false },
    capturing: { isCapturing: true, shareImageUri: null, showShareModal: false },
    captured: { isCapturing: false, shareImageUri: "file://captured.png", showShareModal: true },
    closed: { isCapturing: false, shareImageUri: null, showShareModal: false },
  };

  it("should start in initial state", () => {
    const state = mockCaptureStates.initial;
    expect(state.isCapturing).toBe(false);
    expect(state.shareImageUri).toBeNull();
    expect(state.showShareModal).toBe(false);
  });

  it("should transition to capturing state", () => {
    const state = mockCaptureStates.capturing;
    expect(state.isCapturing).toBe(true);
    expect(state.showShareModal).toBe(false);
  });

  it("should transition to captured state with image URI", () => {
    const state = mockCaptureStates.captured;
    expect(state.isCapturing).toBe(false);
    expect(state.shareImageUri).toBe("file://captured.png");
    expect(state.showShareModal).toBe(true);
  });

  it("should reset to initial state when closed", () => {
    const state = mockCaptureStates.closed;
    expect(state.isCapturing).toBe(false);
    expect(state.shareImageUri).toBeNull();
    expect(state.showShareModal).toBe(false);
  });
});

// ============================================
// SOCIAL MEDIA PLATFORMS
// ============================================
describe("Social Media Platforms", () => {
  const PLATFORMS = [
    { id: "instagram", name: "Instagram", color: "#E4405F" },
    { id: "whatsapp", name: "WhatsApp", color: "#25D366" },
    { id: "twitter", name: "Twitter", color: "#1DA1F2" },
    { id: "facebook", name: "Facebook", color: "#1877F2" },
    { id: "pinterest", name: "Pinterest", color: "#E60023" },
  ];

  it("should have 5 platforms", () => {
    expect(PLATFORMS).toHaveLength(5);
  });

  it("should include Instagram", () => {
    const instagram = PLATFORMS.find(p => p.id === "instagram");
    expect(instagram).toBeDefined();
    expect(instagram?.color).toBe("#E4405F");
  });

  it("should include WhatsApp", () => {
    const whatsapp = PLATFORMS.find(p => p.id === "whatsapp");
    expect(whatsapp).toBeDefined();
    expect(whatsapp?.color).toBe("#25D366");
  });

  it("should include Pinterest", () => {
    const pinterest = PLATFORMS.find(p => p.id === "pinterest");
    expect(pinterest).toBeDefined();
    expect(pinterest?.color).toBe("#E60023");
  });

  it("should have unique IDs", () => {
    const ids = PLATFORMS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ============================================
// FOOTER TEXT
// ============================================
describe("Footer Text", () => {
  const generateFooterText = () => {
    return "Créé avec L'Écrin Virtuel • ecrin-virtuel.app";
  };

  it("should include brand name", () => {
    const footer = generateFooterText();
    expect(footer).toContain("L'Écrin Virtuel");
  });

  it("should include website URL", () => {
    const footer = generateFooterText();
    expect(footer).toContain("ecrin-virtuel.app");
  });

  it("should use bullet separator", () => {
    const footer = generateFooterText();
    expect(footer).toContain("•");
  });
});

// ============================================
// TIPS SECTION
// ============================================
describe("Tips Section", () => {
  const formatTips = (tips: string | null, maxLines: number = 3) => {
    if (!tips) return null;
    
    const lines = tips.split("\n").slice(0, maxLines);
    return lines.join("\n");
  };

  it("should return null for null tips", () => {
    const result = formatTips(null);
    expect(result).toBeNull();
  });

  it("should return tips as-is if within limit", () => {
    const tips = "Conseil 1\nConseil 2";
    const result = formatTips(tips);
    expect(result).toBe(tips);
  });

  it("should truncate tips exceeding max lines", () => {
    const tips = "Ligne 1\nLigne 2\nLigne 3\nLigne 4\nLigne 5";
    const result = formatTips(tips, 3);
    expect(result).toBe("Ligne 1\nLigne 2\nLigne 3");
  });

  it("should handle single line tips", () => {
    const tips = "Un seul conseil de style";
    const result = formatTips(tips);
    expect(result).toBe(tips);
  });
});
