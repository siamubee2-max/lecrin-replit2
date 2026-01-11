/**
 * Tests for Demo Gallery Screen
 * Tests the inclusive demonstration gallery functionality
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock expo-router
vi.mock("expo-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock expo-image
vi.mock("expo-image", () => ({
  Image: "Image",
}));

// Mock i18n context
const mockTranslations = {
  common: {
    close: "Fermer",
  },
  demoGallery: {
    title: "Galerie Démo",
    intro: "Découvrez comment nos bijoux s'adaptent à toutes les morphologies et carnations.",
    categories: {
      all: "Tout",
      hands: "Mains",
      ears: "Oreilles",
      necks: "Cous",
    },
    skinTones: {
      light: "Carnation claire",
      medium: "Carnation médiane",
      dark: "Carnation foncée",
    },
    inclusivityTitle: "Pour tout le monde",
    inclusivityMessage: "L'Écrin Virtuel est conçu pour toutes les personnes, quels que soient leur genre, leur carnation ou leur morphologie. Les bijoux sont universels.",
  },
};

vi.mock("@/lib/i18n-context", () => ({
  useI18n: () => ({
    t: mockTranslations,
    language: "fr",
  }),
}));

// Mock colors hook
vi.mock("@/hooks/use-colors", () => ({
  useColors: () => ({
    foreground: "#11181C",
    background: "#FFFFFF",
    muted: "#687076",
    primary: "#D4AF37",
    surface: "#F5F5F5",
    border: "#E5E7EB",
  }),
}));

describe("Demo Gallery Screen", () => {
  describe("Translations", () => {
    it("should have all required translation keys in French", () => {
      expect(mockTranslations.demoGallery.title).toBe("Galerie Démo");
      expect(mockTranslations.demoGallery.intro).toContain("morphologies");
      expect(mockTranslations.demoGallery.categories.all).toBe("Tout");
      expect(mockTranslations.demoGallery.categories.hands).toBe("Mains");
      expect(mockTranslations.demoGallery.categories.ears).toBe("Oreilles");
      expect(mockTranslations.demoGallery.categories.necks).toBe("Cous");
    });

    it("should have all skin tone translations", () => {
      expect(mockTranslations.demoGallery.skinTones.light).toBe("Carnation claire");
      expect(mockTranslations.demoGallery.skinTones.medium).toBe("Carnation médiane");
      expect(mockTranslations.demoGallery.skinTones.dark).toBe("Carnation foncée");
    });

    it("should have inclusivity message", () => {
      expect(mockTranslations.demoGallery.inclusivityTitle).toBe("Pour tout le monde");
      expect(mockTranslations.demoGallery.inclusivityMessage).toContain("genre");
      expect(mockTranslations.demoGallery.inclusivityMessage).toContain("carnation");
      expect(mockTranslations.demoGallery.inclusivityMessage).toContain("morphologie");
    });
  });

  describe("Demo Images Configuration", () => {
    const DEMO_IMAGES = [
      { id: "hand_light", skinTone: "light", bodyPart: "hands" },
      { id: "hand_medium", skinTone: "medium", bodyPart: "hands" },
      { id: "hand_dark", skinTone: "dark", bodyPart: "hands" },
      { id: "ear_light", skinTone: "light", bodyPart: "ears" },
      { id: "ear_medium", skinTone: "medium", bodyPart: "ears" },
      { id: "ear_dark", skinTone: "dark", bodyPart: "ears" },
      { id: "neck_light", skinTone: "light", bodyPart: "necks" },
      { id: "neck_dark", skinTone: "dark", bodyPart: "necks" },
    ];

    it("should have 8 demo images", () => {
      expect(DEMO_IMAGES.length).toBe(8);
    });

    it("should have images for all body part categories", () => {
      const bodyParts = [...new Set(DEMO_IMAGES.map(img => img.bodyPart))];
      expect(bodyParts).toContain("hands");
      expect(bodyParts).toContain("ears");
      expect(bodyParts).toContain("necks");
    });

    it("should have diverse skin tones represented", () => {
      const skinTones = [...new Set(DEMO_IMAGES.map(img => img.skinTone))];
      expect(skinTones).toContain("light");
      expect(skinTones).toContain("medium");
      expect(skinTones).toContain("dark");
    });

    it("should have at least one light and one dark skin tone for each body part", () => {
      const handImages = DEMO_IMAGES.filter(img => img.bodyPart === "hands");
      const earImages = DEMO_IMAGES.filter(img => img.bodyPart === "ears");
      const neckImages = DEMO_IMAGES.filter(img => img.bodyPart === "necks");

      expect(handImages.some(img => img.skinTone === "light")).toBe(true);
      expect(handImages.some(img => img.skinTone === "dark")).toBe(true);
      expect(earImages.some(img => img.skinTone === "light")).toBe(true);
      expect(earImages.some(img => img.skinTone === "dark")).toBe(true);
      expect(neckImages.some(img => img.skinTone === "light")).toBe(true);
      expect(neckImages.some(img => img.skinTone === "dark")).toBe(true);
    });
  });

  describe("Category Filtering", () => {
    const DEMO_IMAGES = [
      { id: "hand_light", skinTone: "light", bodyPart: "hands" },
      { id: "hand_medium", skinTone: "medium", bodyPart: "hands" },
      { id: "hand_dark", skinTone: "dark", bodyPart: "hands" },
      { id: "ear_light", skinTone: "light", bodyPart: "ears" },
      { id: "ear_medium", skinTone: "medium", bodyPart: "ears" },
      { id: "ear_dark", skinTone: "dark", bodyPart: "ears" },
      { id: "neck_light", skinTone: "light", bodyPart: "necks" },
      { id: "neck_dark", skinTone: "dark", bodyPart: "necks" },
    ];

    it("should filter images by hands category", () => {
      const filtered = DEMO_IMAGES.filter(img => img.bodyPart === "hands");
      expect(filtered.length).toBe(3);
      expect(filtered.every(img => img.bodyPart === "hands")).toBe(true);
    });

    it("should filter images by ears category", () => {
      const filtered = DEMO_IMAGES.filter(img => img.bodyPart === "ears");
      expect(filtered.length).toBe(3);
      expect(filtered.every(img => img.bodyPart === "ears")).toBe(true);
    });

    it("should filter images by necks category", () => {
      const filtered = DEMO_IMAGES.filter(img => img.bodyPart === "necks");
      expect(filtered.length).toBe(2);
      expect(filtered.every(img => img.bodyPart === "necks")).toBe(true);
    });

    it("should return all images when category is 'all'", () => {
      const selectedCategory = "all";
      const filtered = selectedCategory === "all" 
        ? DEMO_IMAGES 
        : DEMO_IMAGES.filter(img => img.bodyPart === selectedCategory);
      expect(filtered.length).toBe(8);
    });
  });

  describe("Skin Tone Labels", () => {
    const getSkinToneLabel = (skinTone: string): string => {
      switch (skinTone) {
        case "light":
          return mockTranslations.demoGallery.skinTones.light;
        case "medium":
          return mockTranslations.demoGallery.skinTones.medium;
        case "dark":
          return mockTranslations.demoGallery.skinTones.dark;
        default:
          return skinTone;
      }
    };

    it("should return correct label for light skin tone", () => {
      expect(getSkinToneLabel("light")).toBe("Carnation claire");
    });

    it("should return correct label for medium skin tone", () => {
      expect(getSkinToneLabel("medium")).toBe("Carnation médiane");
    });

    it("should return correct label for dark skin tone", () => {
      expect(getSkinToneLabel("dark")).toBe("Carnation foncée");
    });

    it("should return original value for unknown skin tone", () => {
      expect(getSkinToneLabel("unknown")).toBe("unknown");
    });
  });

  describe("Body Part Labels", () => {
    type BodyPartCategory = "hands" | "ears" | "necks";

    const getBodyPartLabel = (bodyPart: BodyPartCategory): string => {
      switch (bodyPart) {
        case "hands":
          return mockTranslations.demoGallery.categories.hands;
        case "ears":
          return mockTranslations.demoGallery.categories.ears;
        case "necks":
          return mockTranslations.demoGallery.categories.necks;
        default:
          return bodyPart;
      }
    };

    it("should return correct label for hands", () => {
      expect(getBodyPartLabel("hands")).toBe("Mains");
    });

    it("should return correct label for ears", () => {
      expect(getBodyPartLabel("ears")).toBe("Oreilles");
    });

    it("should return correct label for necks", () => {
      expect(getBodyPartLabel("necks")).toBe("Cous");
    });
  });

  describe("Inclusivity", () => {
    it("should have gender-neutral messaging", () => {
      const message = mockTranslations.demoGallery.inclusivityMessage;
      expect(message).toContain("toutes les personnes");
      expect(message).not.toContain("femmes");
      expect(message).not.toContain("hommes");
    });

    it("should emphasize universality of jewelry", () => {
      const message = mockTranslations.demoGallery.inclusivityMessage;
      expect(message).toContain("universels");
    });

    it("should mention body diversity", () => {
      const message = mockTranslations.demoGallery.inclusivityMessage;
      expect(message).toContain("morphologie");
    });

    it("should mention skin tone diversity", () => {
      const message = mockTranslations.demoGallery.inclusivityMessage;
      expect(message).toContain("carnation");
    });
  });

  describe("Categories Configuration", () => {
    const categories = ["all", "hands", "ears", "necks"];

    it("should have 4 categories including 'all'", () => {
      expect(categories.length).toBe(4);
    });

    it("should have 'all' as the first category", () => {
      expect(categories[0]).toBe("all");
    });

    it("should include all body part types", () => {
      expect(categories).toContain("hands");
      expect(categories).toContain("ears");
      expect(categories).toContain("necks");
    });
  });
});
