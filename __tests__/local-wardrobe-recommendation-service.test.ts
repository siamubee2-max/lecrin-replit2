import { describe, expect, it } from "vitest";
import { buildWardrobeRecommendations } from "../services/local-wardrobe-recommendation-service";
import type { DailyGenderLook } from "../services/daily-gender-look-service";

const mockLook: DailyGenderLook = {
  date: "2026-03-25",
  locationLabel: "Paris, France",
  season: "winter",
  weatherLabel: "🌧️ 6C",
  weatherHighlights: [],
  alerts: ["Pluie", "Vent"],
  styleProfile: "elegant",
  femme: {
    gender: "femme",
    title: "f",
    pieces: [],
    shoes: "",
    accessories: [],
    tip: "",
  },
  homme: {
    gender: "homme",
    title: "h",
    pieces: [],
    shoes: "",
    accessories: [],
    tip: "",
  },
};

describe("Local wardrobe recommendation service", () => {
  it("retourne des recommandations triées avec raison", () => {
    const recs = buildWardrobeRecommendations(mockLook, [
      { id: 1, name: "Bottines noires", type: "shoes", isFavorite: true },
      { id: 2, name: "Trench", type: "clothing", isFavorite: false },
      { id: 3, name: "Mini sac", type: "accessories", isFavorite: false },
    ]);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]?.name).toBe("Bottines noires");
    expect(recs[0]?.reason.length).toBeGreaterThan(0);
  });
});
