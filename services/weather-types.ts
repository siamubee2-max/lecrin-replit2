/**
 * Weather Service Types
 * Separated from main service to avoid expo-location import in tests
 */

export type WeatherCondition = 
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "stormy"
  | "foggy"
  | "windy"
  | "hot"
  | "cold"
  | "mild";

export type WeatherData = {
  temperature: number; // Celsius
  condition: WeatherCondition;
  humidity: number; // Percentage
  windSpeed: number; // km/h
  description: string;
  icon: string; // Emoji icon
  isDay: boolean;
  city?: string; // City name from reverse geocoding
  country?: string; // Country name
};

export type UserLocation = {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
};

// Default location (Paris, France)
export const DEFAULT_LOCATION: UserLocation = {
  latitude: 48.8566,
  longitude: 2.3522,
  city: "Paris",
  country: "France",
};

// Weather styling tips based on conditions
export const WEATHER_STYLING_TIPS: Record<WeatherCondition, string[]> = {
  sunny: [
    "Optez pour des bijoux qui captent la lumière du soleil",
    "Les pierres claires comme le quartz ou le cristal brilleront magnifiquement",
    "Évitez les métaux trop sombres qui absorberont la chaleur",
    "Les boucles d'oreilles pendantes créeront de jolis reflets",
  ],
  cloudy: [
    "Les bijoux dorés apporteront de la luminosité à votre tenue",
    "C'est le moment idéal pour porter des perles",
    "Les tons chauds comme l'or rose compenseront le manque de soleil",
    "Osez les pièces statement pour égayer la journée",
  ],
  rainy: [
    "Privilégiez les bijoux résistants à l'humidité",
    "L'or et l'acier inoxydable sont vos alliés",
    "Évitez les bijoux fantaisie qui pourraient s'oxyder",
    "Les boucles d'oreilles courtes éviteront les accrocs avec le parapluie",
  ],
  snowy: [
    "Les bijoux argentés s'harmoniseront avec le paysage hivernal",
    "Les pierres bleues comme le saphir ou la topaze sont parfaites",
    "Portez des bijoux sous vos vêtements chauds pour les protéger",
    "Les colliers courts seront plus pratiques avec les écharpes",
  ],
  stormy: [
    "Gardez vos bijoux précieux à l'abri aujourd'hui",
    "Optez pour des pièces simples et résistantes",
    "Les bracelets fins seront plus confortables",
    "Évitez les grandes boucles d'oreilles par temps venteux",
  ],
  foggy: [
    "Les bijoux lumineux vous aideront à vous démarquer",
    "L'or jaune apportera de la chaleur à votre look",
    "Les pierres opaques comme l'opale sont de circonstance",
    "Misez sur des pièces qui attirent l'attention",
  ],
  windy: [
    "Évitez les boucles d'oreilles trop longues",
    "Les colliers courts ou ras-du-cou sont recommandés",
    "Attachez vos cheveux pour mettre en valeur vos bijoux",
    "Les broches peuvent être une alternative élégante",
  ],
  hot: [
    "Privilégiez les bijoux légers et aérés",
    "L'argent sera plus frais au toucher que l'or",
    "Évitez les bracelets trop serrés qui pourraient irriter",
    "Les bijoux minimalistes sont parfaits pour la chaleur",
  ],
  cold: [
    "Les bijoux dorés apporteront de la chaleur visuelle",
    "Portez vos bijoux par-dessus les gants ou écharpes",
    "Les bagues peuvent être portées sur les gants",
    "Les broches sont idéales pour accessoiriser les manteaux",
  ],
  mild: [
    "C'est le moment de sortir vos plus belles pièces",
    "Tous les styles de bijoux sont permis",
    "Expérimentez avec des combinaisons audacieuses",
    "Le layering de colliers est particulièrement adapté",
  ],
};

// Weather jewelry recommendations based on conditions
export const WEATHER_JEWELRY_RECOMMENDATIONS: Record<WeatherCondition, { recommended: string[]; avoid: string[] }> = {
  sunny: {
    recommended: ["Boucles d'oreilles en cristal", "Collier en or jaune", "Bracelet en pierres claires", "Bague solitaire"],
    avoid: ["Bijoux en plastique foncé", "Métaux noirs"],
  },
  cloudy: {
    recommended: ["Perles", "Or rose", "Bijoux dorés", "Pierres chaudes"],
    avoid: ["Bijoux trop discrets", "Argent mat"],
  },
  rainy: {
    recommended: ["Or massif", "Acier inoxydable", "Platine", "Titane"],
    avoid: ["Bijoux fantaisie", "Cuivre", "Laiton non traité"],
  },
  snowy: {
    recommended: ["Argent", "Or blanc", "Saphir", "Topaze bleue", "Diamants"],
    avoid: ["Bijoux fragiles", "Pierres sensibles au froid"],
  },
  stormy: {
    recommended: ["Bijoux simples", "Acier", "Bracelets fins"],
    avoid: ["Grandes boucles d'oreilles", "Colliers longs", "Bijoux précieux"],
  },
  foggy: {
    recommended: ["Or jaune", "Opale", "Bijoux lumineux", "Pierres chatoyantes"],
    avoid: ["Bijoux trop discrets", "Tons gris"],
  },
  windy: {
    recommended: ["Colliers courts", "Boucles d'oreilles puces", "Broches", "Bagues"],
    avoid: ["Boucles pendantes", "Colliers longs", "Chaînes fines"],
  },
  hot: {
    recommended: ["Bijoux légers", "Argent", "Bijoux minimalistes", "Pierres froides"],
    avoid: ["Bracelets serrés", "Bijoux lourds", "Cuir"],
  },
  cold: {
    recommended: ["Or jaune", "Broches", "Bijoux statement", "Pierres chaudes"],
    avoid: ["Bijoux trop fins", "Métaux froids au toucher"],
  },
  mild: {
    recommended: ["Tous les styles", "Layering", "Mix de métaux", "Pierres colorées"],
    avoid: [],
  },
};

/**
 * Get styling tips based on weather conditions
 */
export function getWeatherStylingTips(weather: WeatherData): string[] {
  return WEATHER_STYLING_TIPS[weather.condition] || WEATHER_STYLING_TIPS.mild;
}

/**
 * Get jewelry recommendations based on weather conditions
 */
export function getWeatherJewelryRecommendations(weather: WeatherData): { recommended: string[]; avoid: string[] } {
  return WEATHER_JEWELRY_RECOMMENDATIONS[weather.condition] || WEATHER_JEWELRY_RECOMMENDATIONS.mild;
}
