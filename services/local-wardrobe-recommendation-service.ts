import type { DailyGenderLook } from "./daily-gender-look-service";

export type LocalCollectionItem = {
  id?: string | number;
  name?: string;
  type?: string;
  metal?: string;
  imageUri?: string;
  isFavorite?: boolean;
  createdAt?: string;
};

export type WardrobeRecommendation = {
  id: string;
  type: string;
  name: string;
  reason: string;
};

function reasonByAlert(alerts: string[], type: string): string {
  if ((alerts.includes("Pluie") || alerts.includes("Neige")) && (type === "shoes" || type === "accessories")) {
    return "Meteo instable: prioriser protection et confort.";
  }
  if (alerts.includes("Vent") && type === "accessories") {
    return "Vent fort: accessoires compacts recommandes.";
  }
  if (alerts.includes("Gel") && (type === "clothing" || type === "shoes")) {
    return "Gel: couches chaudes et semelles adaptees recommandees.";
  }
  return "Compatible avec votre look du jour.";
}

export function buildWardrobeRecommendations(
  dailyLook: DailyGenderLook | null,
  items: LocalCollectionItem[],
  limit: number = 3,
): WardrobeRecommendation[] {
  if (!dailyLook || !Array.isArray(items) || items.length === 0) return [];
  const preferredTypes = new Set<string>([
    "clothing",
    "shoes",
    "accessories",
    "jewelry",
    "outfit",
    "earrings",
    "necklace",
    "ring",
    "bracelet",
  ]);
  const ranked = items
    .filter((item) => item?.name && item?.type && preferredTypes.has(String(item.type)))
    .sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)))
    .slice(0, Math.max(limit * 2, 6))
    .map((item, idx) => ({
      id: String(item.id ?? `${idx}-${item.name}`),
      type: String(item.type ?? "other"),
      name: String(item.name ?? "Article"),
      reason: reasonByAlert(dailyLook.alerts, String(item.type ?? "")),
    }));
  return ranked.slice(0, limit);
}
