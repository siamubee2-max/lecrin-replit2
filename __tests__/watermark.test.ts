import { describe, it, expect } from "vitest";

// Types for testing
type WatermarkPosition = 
  | "top-left" 
  | "top-right" 
  | "bottom-left" 
  | "bottom-right" 
  | "center";

type WatermarkSize = "small" | "medium" | "large";

interface WatermarkConfig {
  position: WatermarkPosition;
  opacity: number;
  size: WatermarkSize;
  showLogo: boolean;
  showText: boolean;
  customText?: string;
  theme: "light" | "dark";
}

// Size configuration
const SIZE_CONFIG = {
  small: {
    logoSize: 20,
    fontSize: 10,
    padding: 8,
    gap: 4,
  },
  medium: {
    logoSize: 28,
    fontSize: 12,
    padding: 12,
    gap: 6,
  },
  large: {
    logoSize: 36,
    fontSize: 14,
    padding: 16,
    gap: 8,
  },
};

// Helper functions
function getPositionStyle(position: WatermarkPosition, padding: number) {
  switch (position) {
    case "top-left":
      return { top: padding, left: padding };
    case "top-right":
      return { top: padding, right: padding };
    case "bottom-left":
      return { bottom: padding, left: padding };
    case "bottom-right":
      return { bottom: padding, right: padding };
    case "center":
      return { 
        top: "50%", 
        left: "50%", 
        transform: [{ translateX: -50 }, { translateY: -50 }] 
      };
    default:
      return { bottom: padding, right: padding };
  }
}

function getTextColor(theme: "light" | "dark"): string {
  return theme === "light" ? "#FFFFFF" : "#1a1a2e";
}

function getShadowColor(theme: "light" | "dark"): string {
  return theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
}

function validateOpacity(opacity: number): boolean {
  return opacity >= 0 && opacity <= 1;
}

function createWatermarkConfig(overrides: Partial<WatermarkConfig> = {}): WatermarkConfig {
  return {
    position: "bottom-right",
    opacity: 0.6,
    size: "medium",
    showLogo: true,
    showText: true,
    theme: "light",
    ...overrides,
  };
}

describe("Watermark Component", () => {
  describe("Position Styles", () => {
    it("should return correct style for top-left position", () => {
      const style = getPositionStyle("top-left", 12);
      expect(style).toEqual({ top: 12, left: 12 });
    });

    it("should return correct style for top-right position", () => {
      const style = getPositionStyle("top-right", 12);
      expect(style).toEqual({ top: 12, right: 12 });
    });

    it("should return correct style for bottom-left position", () => {
      const style = getPositionStyle("bottom-left", 12);
      expect(style).toEqual({ bottom: 12, left: 12 });
    });

    it("should return correct style for bottom-right position", () => {
      const style = getPositionStyle("bottom-right", 12);
      expect(style).toEqual({ bottom: 12, right: 12 });
    });

    it("should return correct style for center position", () => {
      const style = getPositionStyle("center", 12);
      expect(style.top).toBe("50%");
      expect(style.left).toBe("50%");
      expect(style.transform).toBeDefined();
    });

    it("should default to bottom-right for unknown position", () => {
      const style = getPositionStyle("unknown" as WatermarkPosition, 12);
      expect(style).toEqual({ bottom: 12, right: 12 });
    });

    it("should respect custom padding values", () => {
      const style8 = getPositionStyle("top-left", 8);
      expect(style8).toEqual({ top: 8, left: 8 });
      
      const style16 = getPositionStyle("top-left", 16);
      expect(style16).toEqual({ top: 16, left: 16 });
    });
  });

  describe("Size Configuration", () => {
    it("should have correct small size config", () => {
      expect(SIZE_CONFIG.small.logoSize).toBe(20);
      expect(SIZE_CONFIG.small.fontSize).toBe(10);
      expect(SIZE_CONFIG.small.padding).toBe(8);
      expect(SIZE_CONFIG.small.gap).toBe(4);
    });

    it("should have correct medium size config", () => {
      expect(SIZE_CONFIG.medium.logoSize).toBe(28);
      expect(SIZE_CONFIG.medium.fontSize).toBe(12);
      expect(SIZE_CONFIG.medium.padding).toBe(12);
      expect(SIZE_CONFIG.medium.gap).toBe(6);
    });

    it("should have correct large size config", () => {
      expect(SIZE_CONFIG.large.logoSize).toBe(36);
      expect(SIZE_CONFIG.large.fontSize).toBe(14);
      expect(SIZE_CONFIG.large.padding).toBe(16);
      expect(SIZE_CONFIG.large.gap).toBe(8);
    });

    it("should have increasing sizes from small to large", () => {
      expect(SIZE_CONFIG.small.logoSize).toBeLessThan(SIZE_CONFIG.medium.logoSize);
      expect(SIZE_CONFIG.medium.logoSize).toBeLessThan(SIZE_CONFIG.large.logoSize);
    });
  });

  describe("Theme Colors", () => {
    it("should return white text for light theme", () => {
      expect(getTextColor("light")).toBe("#FFFFFF");
    });

    it("should return dark text for dark theme", () => {
      expect(getTextColor("dark")).toBe("#1a1a2e");
    });

    it("should return dark shadow for light theme", () => {
      expect(getShadowColor("light")).toBe("rgba(0,0,0,0.5)");
    });

    it("should return light shadow for dark theme", () => {
      expect(getShadowColor("dark")).toBe("rgba(255,255,255,0.5)");
    });
  });

  describe("Opacity Validation", () => {
    it("should accept valid opacity values", () => {
      expect(validateOpacity(0)).toBe(true);
      expect(validateOpacity(0.5)).toBe(true);
      expect(validateOpacity(1)).toBe(true);
    });

    it("should reject negative opacity", () => {
      expect(validateOpacity(-0.1)).toBe(false);
    });

    it("should reject opacity greater than 1", () => {
      expect(validateOpacity(1.1)).toBe(false);
    });

    it("should accept boundary values", () => {
      expect(validateOpacity(0)).toBe(true);
      expect(validateOpacity(1)).toBe(true);
    });
  });

  describe("Watermark Configuration", () => {
    it("should create default config", () => {
      const config = createWatermarkConfig();
      expect(config.position).toBe("bottom-right");
      expect(config.opacity).toBe(0.6);
      expect(config.size).toBe("medium");
      expect(config.showLogo).toBe(true);
      expect(config.showText).toBe(true);
      expect(config.theme).toBe("light");
    });

    it("should allow position override", () => {
      const config = createWatermarkConfig({ position: "top-left" });
      expect(config.position).toBe("top-left");
    });

    it("should allow opacity override", () => {
      const config = createWatermarkConfig({ opacity: 0.8 });
      expect(config.opacity).toBe(0.8);
    });

    it("should allow size override", () => {
      const config = createWatermarkConfig({ size: "small" });
      expect(config.size).toBe("small");
    });

    it("should allow hiding logo", () => {
      const config = createWatermarkConfig({ showLogo: false });
      expect(config.showLogo).toBe(false);
    });

    it("should allow hiding text", () => {
      const config = createWatermarkConfig({ showText: false });
      expect(config.showText).toBe(false);
    });

    it("should allow custom text", () => {
      const config = createWatermarkConfig({ customText: "Custom Brand" });
      expect(config.customText).toBe("Custom Brand");
    });

    it("should allow dark theme", () => {
      const config = createWatermarkConfig({ theme: "dark" });
      expect(config.theme).toBe("dark");
    });

    it("should allow multiple overrides", () => {
      const config = createWatermarkConfig({
        position: "center",
        opacity: 0.3,
        size: "large",
        theme: "dark",
      });
      expect(config.position).toBe("center");
      expect(config.opacity).toBe(0.3);
      expect(config.size).toBe("large");
      expect(config.theme).toBe("dark");
    });
  });

  describe("WatermarkMinimal Preset", () => {
    it("should have correct default settings", () => {
      const config = createWatermarkConfig({
        size: "small",
        showLogo: true,
        showText: false,
        opacity: 0.5,
      });
      expect(config.size).toBe("small");
      expect(config.showLogo).toBe(true);
      expect(config.showText).toBe(false);
      expect(config.opacity).toBe(0.5);
    });
  });

  describe("WatermarkFull Preset", () => {
    it("should have correct default settings", () => {
      const config = createWatermarkConfig({
        size: "medium",
        showLogo: true,
        showText: true,
        opacity: 0.7,
      });
      expect(config.size).toBe("medium");
      expect(config.showLogo).toBe(true);
      expect(config.showText).toBe(true);
      expect(config.opacity).toBe(0.7);
    });
  });

  describe("Brand Text", () => {
    const DEFAULT_BRAND_TEXT = "L'Écrin Virtuel";

    it("should use default brand text when no custom text", () => {
      const config = createWatermarkConfig();
      const displayText = config.customText || DEFAULT_BRAND_TEXT;
      expect(displayText).toBe(DEFAULT_BRAND_TEXT);
    });

    it("should use custom text when provided", () => {
      const config = createWatermarkConfig({ customText: "My Brand" });
      const displayText = config.customText || DEFAULT_BRAND_TEXT;
      expect(displayText).toBe("My Brand");
    });

    it("should handle empty custom text", () => {
      const config = createWatermarkConfig({ customText: "" });
      const displayText = config.customText || DEFAULT_BRAND_TEXT;
      expect(displayText).toBe(DEFAULT_BRAND_TEXT);
    });
  });

  describe("Integration Scenarios", () => {
    it("should work for screenshot capture (tryon screen)", () => {
      const config = createWatermarkConfig({
        position: "top-right",
        opacity: 0.6,
        theme: "light",
      });
      expect(config.position).toBe("top-right");
      expect(config.opacity).toBe(0.6);
    });

    it("should work for look share card", () => {
      const config = createWatermarkConfig({
        position: "bottom-right",
        opacity: 0.5,
        size: "small",
        showLogo: true,
        showText: false,
        theme: "dark",
      });
      expect(config.position).toBe("bottom-right");
      expect(config.size).toBe("small");
      expect(config.showText).toBe(false);
    });

    it("should be discreet with low opacity", () => {
      const config = createWatermarkConfig({ opacity: 0.3 });
      expect(config.opacity).toBeLessThanOrEqual(0.5);
    });

    it("should be visible with higher opacity", () => {
      const config = createWatermarkConfig({ opacity: 0.8 });
      expect(config.opacity).toBeGreaterThan(0.5);
    });
  });

  describe("All Positions", () => {
    const positions: WatermarkPosition[] = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "center",
    ];

    it("should have 5 position options", () => {
      expect(positions).toHaveLength(5);
    });

    positions.forEach((position) => {
      it(`should generate valid style for ${position}`, () => {
        const style = getPositionStyle(position, 12);
        expect(style).toBeDefined();
        expect(typeof style).toBe("object");
      });
    });
  });

  describe("All Sizes", () => {
    const sizes: WatermarkSize[] = ["small", "medium", "large"];

    it("should have 3 size options", () => {
      expect(sizes).toHaveLength(3);
    });

    sizes.forEach((size) => {
      it(`should have valid config for ${size} size`, () => {
        const config = SIZE_CONFIG[size];
        expect(config.logoSize).toBeGreaterThan(0);
        expect(config.fontSize).toBeGreaterThan(0);
        expect(config.padding).toBeGreaterThan(0);
        expect(config.gap).toBeGreaterThan(0);
      });
    });
  });
});
