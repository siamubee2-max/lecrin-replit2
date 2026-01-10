/**
 * Weather Service
 * Provides weather information for styling suggestions
 * Uses Open-Meteo API (free, no API key required)
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
};

export type Location = {
  latitude: number;
  longitude: number;
  city?: string;
};

// Weather code mapping from Open-Meteo
// https://open-meteo.com/en/docs
const WEATHER_CODE_MAP: Record<number, { condition: WeatherCondition; description: string; icon: string }> = {
  0: { condition: "sunny", description: "Ciel dégagé", icon: "☀️" },
  1: { condition: "sunny", description: "Principalement dégagé", icon: "🌤️" },
  2: { condition: "cloudy", description: "Partiellement nuageux", icon: "⛅" },
  3: { condition: "cloudy", description: "Couvert", icon: "☁️" },
  45: { condition: "foggy", description: "Brouillard", icon: "🌫️" },
  48: { condition: "foggy", description: "Brouillard givrant", icon: "🌫️" },
  51: { condition: "rainy", description: "Bruine légère", icon: "🌧️" },
  53: { condition: "rainy", description: "Bruine modérée", icon: "🌧️" },
  55: { condition: "rainy", description: "Bruine dense", icon: "🌧️" },
  56: { condition: "rainy", description: "Bruine verglaçante légère", icon: "🌧️" },
  57: { condition: "rainy", description: "Bruine verglaçante dense", icon: "🌧️" },
  61: { condition: "rainy", description: "Pluie légère", icon: "🌧️" },
  63: { condition: "rainy", description: "Pluie modérée", icon: "🌧️" },
  65: { condition: "rainy", description: "Pluie forte", icon: "🌧️" },
  66: { condition: "rainy", description: "Pluie verglaçante légère", icon: "🌧️" },
  67: { condition: "rainy", description: "Pluie verglaçante forte", icon: "🌧️" },
  71: { condition: "snowy", description: "Neige légère", icon: "🌨️" },
  73: { condition: "snowy", description: "Neige modérée", icon: "🌨️" },
  75: { condition: "snowy", description: "Neige forte", icon: "❄️" },
  77: { condition: "snowy", description: "Grains de neige", icon: "❄️" },
  80: { condition: "rainy", description: "Averses légères", icon: "🌦️" },
  81: { condition: "rainy", description: "Averses modérées", icon: "🌦️" },
  82: { condition: "rainy", description: "Averses violentes", icon: "🌧️" },
  85: { condition: "snowy", description: "Averses de neige légères", icon: "🌨️" },
  86: { condition: "snowy", description: "Averses de neige fortes", icon: "❄️" },
  95: { condition: "stormy", description: "Orage", icon: "⛈️" },
  96: { condition: "stormy", description: "Orage avec grêle légère", icon: "⛈️" },
  99: { condition: "stormy", description: "Orage avec grêle forte", icon: "⛈️" },
};

/**
 * Determine temperature-based condition
 */
function getTemperatureCondition(temp: number): WeatherCondition | null {
  if (temp >= 30) return "hot";
  if (temp <= 5) return "cold";
  if (temp >= 15 && temp <= 25) return "mild";
  return null;
}

/**
 * Fetch current weather data from Open-Meteo API
 */
export async function getCurrentWeather(location: Location): Promise<WeatherData> {
  try {
    const { latitude, longitude } = location;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const current = data.current;
    
    const weatherCode = current.weather_code || 0;
    const weatherInfo = WEATHER_CODE_MAP[weatherCode] || WEATHER_CODE_MAP[0];
    
    const temperature = current.temperature_2m;
    const tempCondition = getTemperatureCondition(temperature);
    
    // Combine weather code condition with temperature condition
    const condition = tempCondition || weatherInfo.condition;
    
    return {
      temperature: Math.round(temperature),
      condition,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      description: weatherInfo.description,
      icon: weatherInfo.icon,
      isDay: current.is_day === 1,
    };
  } catch (error) {
    console.error("[WeatherService] Error fetching weather:", error);
    // Return default mild weather on error
    return {
      temperature: 20,
      condition: "mild",
      humidity: 50,
      windSpeed: 10,
      description: "Conditions inconnues",
      icon: "🌤️",
      isDay: true,
    };
  }
}

/**
 * Get weather-based styling suggestions
 */
export function getWeatherStylingTips(weather: WeatherData): string[] {
  const tips: string[] = [];
  
  switch (weather.condition) {
    case "sunny":
    case "hot":
      tips.push("Optez pour des bijoux légers et brillants qui captent la lumière du soleil");
      tips.push("Les métaux dorés et les pierres claires sont parfaits pour cette journée ensoleillée");
      tips.push("Évitez les bijoux trop lourds qui peuvent être inconfortables par temps chaud");
      break;
      
    case "cloudy":
    case "mild":
      tips.push("C'est le moment idéal pour porter des bijoux statement");
      tips.push("Les perles et les pierres nacrées ressortent magnifiquement sous un ciel nuageux");
      tips.push("Osez les pièces plus imposantes pour illuminer votre tenue");
      break;
      
    case "rainy":
      tips.push("Privilégiez les bijoux résistants à l'humidité comme l'or ou l'acier inoxydable");
      tips.push("Évitez les bijoux fantaisie qui pourraient s'oxyder");
      tips.push("Les boucles d'oreilles sont parfaites car elles restent protégées sous un parapluie");
      break;
      
    case "snowy":
    case "cold":
      tips.push("Les bijoux argentés et les pierres froides (diamants, cristaux) s'harmonisent avec l'hiver");
      tips.push("Portez des colliers qui se voient au-dessus de votre écharpe");
      tips.push("Les bracelets larges sont parfaits sur les manches de pull");
      break;
      
    case "stormy":
      tips.push("Optez pour des bijoux discrets et sécurisés");
      tips.push("Évitez les pendentifs longs qui peuvent s'accrocher");
      tips.push("Les boucles d'oreilles clips sont plus pratiques par temps venteux");
      break;
      
    case "foggy":
      tips.push("Les bijoux avec des reflets mystérieux comme l'opale ou la labradorite sont parfaits");
      tips.push("Jouez sur les contrastes avec des pièces qui se démarquent");
      break;
      
    case "windy":
      tips.push("Évitez les boucles d'oreilles pendantes qui peuvent s'emmêler dans vos cheveux");
      tips.push("Privilégiez les bijoux près du corps : puces, créoles serrées, bracelets ajustés");
      break;
  }
  
  return tips;
}

/**
 * Get recommended jewelry types based on weather
 */
export function getWeatherJewelryRecommendations(weather: WeatherData): {
  recommended: string[];
  avoid: string[];
} {
  const recommendations = {
    recommended: [] as string[],
    avoid: [] as string[],
  };
  
  switch (weather.condition) {
    case "sunny":
    case "hot":
      recommendations.recommended = ["Boucles d'oreilles légères", "Bracelets fins", "Colliers courts", "Bagues simples"];
      recommendations.avoid = ["Bijoux lourds", "Colliers épais", "Bracelets larges"];
      break;
      
    case "cloudy":
    case "mild":
      recommendations.recommended = ["Colliers statement", "Boucles d'oreilles pendantes", "Bracelets superposés", "Parures complètes"];
      recommendations.avoid = [];
      break;
      
    case "rainy":
      recommendations.recommended = ["Bijoux en or", "Bijoux en acier", "Boucles d'oreilles", "Bagues"];
      recommendations.avoid = ["Bijoux fantaisie", "Bijoux en argent non traité", "Perles naturelles"];
      break;
      
    case "snowy":
    case "cold":
      recommendations.recommended = ["Colliers longs", "Broches", "Bracelets larges", "Boucles d'oreilles visibles"];
      recommendations.avoid = ["Bracelets fins cachés sous les manches"];
      break;
      
    case "stormy":
    case "windy":
      recommendations.recommended = ["Puces d'oreilles", "Créoles serrées", "Bracelets ajustés", "Bagues"];
      recommendations.avoid = ["Boucles pendantes", "Colliers longs", "Bijoux légers qui volent"];
      break;
      
    case "foggy":
      recommendations.recommended = ["Bijoux avec reflets", "Pierres opalescentes", "Métaux mixtes"];
      recommendations.avoid = [];
      break;
  }
  
  return recommendations;
}

/**
 * Default location (Paris, France)
 */
export const DEFAULT_LOCATION: Location = {
  latitude: 48.8566,
  longitude: 2.3522,
  city: "Paris",
};
