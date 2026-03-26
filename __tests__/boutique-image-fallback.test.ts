import { describe, it, expect } from "vitest";
import {
  normalizePartnerJewelryImageUrl,
  shouldUseDemoJewelry,
} from "../lib/boutique/partner-jewelry";

describe("Boutique image fallback", () => {
  it("normalizePartnerJewelryImageUrl: string -> { uri }", () => {
    expect(normalizePartnerJewelryImageUrl("https://a.com/1.jpg")).toEqual({
      uri: "https://a.com/1.jpg",
    });
  });

  it("normalizePartnerJewelryImageUrl: { uri } -> { uri }", () => {
    expect(normalizePartnerJewelryImageUrl({ uri: "https://a.com/1.jpg" })).toEqual({
      uri: "https://a.com/1.jpg",
    });
  });

  it("normalizePartnerJewelryImageUrl: empty -> null", () => {
    expect(normalizePartnerJewelryImageUrl("   ")).toBeNull();
    expect(normalizePartnerJewelryImageUrl(null)).toBeNull();
  });

  it("shouldUseDemoJewelry: no usable images -> true", () => {
    expect(
      shouldUseDemoJewelry([
        { id: 1, imageUrl: null },
        { id: 2, image_url: "" },
      ]),
    ).toBe(true);
  });

  it("shouldUseDemoJewelry: one usable image -> false", () => {
    expect(
      shouldUseDemoJewelry([
        { id: 1, imageUrl: null },
        { id: 2, imageUrl: "https://a.com/2.jpg" },
      ]),
    ).toBe(false);
  });
});

