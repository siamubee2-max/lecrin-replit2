import type { UserLocation, WeatherData } from "./weather-service";
import type { StyleProfile } from "./style-profile-service";

export type GenderLookAdvice = {
  gender: "femme" | "homme";
  title: string;
  pieces: string[];
  shoes: string;
  outerwear?: string;
  accessories: string[];
  tip: string;
};

export type DailyGenderLook = {
  date: string;
  locationLabel: string;
  season: "spring" | "summer" | "fall" | "winter";
  weatherLabel: string;
  weatherHighlights: string[];
  alerts: string[];
  styleProfile: StyleProfile;
  femme: GenderLookAdvice;
  homme: GenderLookAdvice;
};

export type DailyLookVariant = {
  id: "bureau" | "soir" | "pluie";
  title: string;
  subtitle: string;
  femme: GenderLookAdvice;
  homme: GenderLookAdvice;
};

function getSeason(date: Date, latitude: number): "spring" | "summer" | "fall" | "winter" {
  const month = date.getMonth() + 1;
  const northern = latitude >= 0;
  if (northern) {
    if (month >= 3 && month <= 5) return "spring";
    if (month >= 6 && month <= 8) return "summer";
    if (month >= 9 && month <= 11) return "fall";
    return "winter";
  }
  if (month >= 3 && month <= 5) return "fall";
  if (month >= 6 && month <= 8) return "winter";
  if (month >= 9 && month <= 11) return "spring";
  return "summer";
}

function seasonLabel(season: DailyGenderLook["season"]): string {
  if (season === "spring") return "printemps";
  if (season === "summer") return "ete";
  if (season === "fall") return "automne";
  return "hiver";
}

function weatherAlerts(weather: WeatherData): string[] {
  const alerts: string[] = [];
  if (weather.condition === "rainy" || (weather.precipitation ?? 0) > 0.2) alerts.push("Pluie");
  if (weather.condition === "snowy") alerts.push("Neige");
  if (weather.condition === "windy" || weather.windSpeed >= 35 || (weather.windGusts ?? 0) >= 45) alerts.push("Vent");
  if (weather.temperature <= 0 || weather.condition === "cold") alerts.push("Gel");
  if ((weather.uvIndex ?? 0) >= 7) alerts.push("UV fort");
  return alerts;
}

function buildTip(season: string, weather: WeatherData, alerts: string[]): string {
  const meteo = `${weather.temperature}C, ${weather.description.toLowerCase()}`;
  if (alerts.length === 0) return `Meteo du jour: ${meteo}. Garde une silhouette confortable et elegante de saison (${season}).`;
  return `Meteo du jour: ${meteo}. Attention: ${alerts.join(", ")}. Priorite a la protection sans perdre le style.`;
}

function styleTouch(profile: StyleProfile, gender: "femme" | "homme"): string {
  if (profile === "minimal") return gender === "femme" ? "Palette neutre, coupe nette" : "Lignes epurees, tons sobres";
  if (profile === "street") return gender === "femme" ? "Superposition moderne, sneakers statement" : "Couche urbaine, silhouette relax";
  if (profile === "business") return gender === "femme" ? "Tailleur souple et structure" : "Blazer net et pantalon propre";
  return gender === "femme" ? "Finition chic, details soignes" : "Elegance classique, details subtils";
}

function buildFemmeLook(season: DailyGenderLook["season"], weather: WeatherData, alerts: string[], profile: StyleProfile): GenderLookAdvice {
  const hot = weather.temperature >= 27;
  const cold = weather.temperature <= 8;
  const rainy = alerts.includes("Pluie");
  const snowy = alerts.includes("Neige");
  const windy = alerts.includes("Vent");

  const baseBySeason: Record<DailyGenderLook["season"], string[]> = {
    spring: ["Blouse fluide", "Jean droit ou pantalon cigarette"],
    summer: ["Top leger", "Jupe midi ou pantalon en lin"],
    fall: ["Maille fine", "Pantalon taille haute"],
    winter: ["Pull chaud", "Pantalon laine melangee"],
  };

  const shoes = snowy ? "Bottes antiderapantes" : rainy ? "Bottines impermeables" : hot ? "Sandales structurees" : "Sneakers chic";
  const outerwear = cold ? (snowy ? "Manteau long isole" : "Trench double ou manteau droit") : windy ? "Veste coupe-vent chic" : undefined;
  const pieces = [...baseBySeason[season]];
  if (hot) pieces[0] = "Top respirant en coton";
  if (cold) pieces[0] = "Maille thermique elegante";
  if (rainy) pieces.push("Matiere deperlant/quick-dry");

  const accessories = ["Sac structure", windy ? "Boucles courtes" : "Boucles fines", "Montre ou bracelet fin"];

  const profileHint = styleTouch(profile, "femme");
  return {
    gender: "femme",
    title: "Look femme du jour",
    pieces,
    shoes,
    outerwear,
    accessories,
    tip: `${buildTip(seasonLabel(season), weather, alerts)} ${profileHint}.`,
  };
}

function buildHommeLook(season: DailyGenderLook["season"], weather: WeatherData, alerts: string[], profile: StyleProfile): GenderLookAdvice {
  const hot = weather.temperature >= 27;
  const cold = weather.temperature <= 8;
  const rainy = alerts.includes("Pluie");
  const snowy = alerts.includes("Neige");
  const windy = alerts.includes("Vent");

  const baseBySeason: Record<DailyGenderLook["season"], string[]> = {
    spring: ["Chemise oxford ou polo", "Chino ajuste"],
    summer: ["T-shirt premium", "Pantalon lin ou chino leger"],
    fall: ["Surchemise", "Jean brut"],
    winter: ["Pull col rond chaud", "Pantalon laine ou denim epais"],
  };

  const shoes = snowy ? "Boots antiderapantes" : rainy ? "Derbies impermeables" : hot ? "Loafers respirants" : "Sneakers sobres";
  const outerwear = cold ? (snowy ? "Parka chaude" : "Manteau droit") : windy ? "Veste coupe-vent" : undefined;
  const pieces = [...baseBySeason[season]];
  if (hot) pieces[0] = "Polo respirant";
  if (cold) pieces[0] = "Sous-couche thermique + maille";
  if (rainy) pieces.push("Textile deperlant");

  const accessories = ["Ceinture sobre", "Montre acier", windy ? "Bonnet fin ou casquette structuree" : "Lunettes de soleil discretes"];

  const profileHint = styleTouch(profile, "homme");
  return {
    gender: "homme",
    title: "Look homme du jour",
    pieces,
    shoes,
    outerwear,
    accessories,
    tip: `${buildTip(seasonLabel(season), weather, alerts)} ${profileHint}.`,
  };
}

export function buildDailyGenderLook(
  weather: WeatherData,
  location: UserLocation,
  profile: StyleProfile = "elegant",
  targetDate: Date = new Date(),
): DailyGenderLook {
  const season = getSeason(targetDate, location.latitude);
  const alerts = weatherAlerts(weather);
  const locationLabel = [location.city, location.country].filter(Boolean).join(", ") || "Votre position";

  const weatherHighlights = [
    `Humidite ${weather.humidity}%`,
    `Vent ${weather.windSpeed} km/h${weather.windGusts ? ` (rafales ${weather.windGusts})` : ""}`,
    `Pluie ${weather.precipitation ?? 0} mm`,
    `UV ${weather.uvIndex ?? "-"}`,
  ];

  return {
    date: targetDate.toISOString().split("T")[0],
    locationLabel,
    season,
    weatherLabel: `${weather.icon} ${weather.temperature}C (ressenti ${weather.apparentTemperature ?? weather.temperature}C) - ${weather.description}`,
    weatherHighlights,
    alerts,
    styleProfile: profile,
    femme: buildFemmeLook(season, weather, alerts, profile),
    homme: buildHommeLook(season, weather, alerts, profile),
  };
}

function withExtra(base: GenderLookAdvice, extraPiece: string, extraAccessory: string, title: string, tipTail: string): GenderLookAdvice {
  return {
    ...base,
    title,
    pieces: [...base.pieces, extraPiece],
    accessories: [...base.accessories, extraAccessory],
    tip: `${base.tip} ${tipTail}`,
  };
}

export function buildDailyLookVariants(base: DailyGenderLook): DailyLookVariant[] {
  const pluieExtra = base.alerts.includes("Pluie") ? "Manteau impermeable leger" : "Veste deperlant";
  return [
    {
      id: "bureau",
      title: "Variation Bureau",
      subtitle: "Plus structuree, tenue pro",
      femme: withExtra(base.femme, "Blazer structure", "Sac structure", "Look femme - Bureau", "Version bureau: tenue nette et professionnelle."),
      homme: withExtra(base.homme, "Blazer sobre", "Ceinture cuir sobre", "Look homme - Bureau", "Version bureau: coupe propre et lignes nettes."),
    },
    {
      id: "soir",
      title: "Variation Soir",
      subtitle: "Plus chic, sortie/restaurant",
      femme: withExtra(base.femme, "Piece statement soiree", "Bijou eclat discret", "Look femme - Soir", "Version soir: accent chic et allure elegante."),
      homme: withExtra(base.homme, "Veste habillee", "Montre metal", "Look homme - Soir", "Version soir: silhouette plus habillee."),
    },
    {
      id: "pluie",
      title: "Variation Pluie",
      subtitle: "Protection meteo sans perdre le style",
      femme: withExtra(base.femme, pluieExtra, "Parapluie compact", "Look femme - Pluie", "Version pluie: priorite au confort et a la protection."),
      homme: withExtra(base.homme, pluieExtra, "Parapluie compact", "Look homme - Pluie", "Version pluie: priorite au confort et a la protection."),
    },
  ];
}
