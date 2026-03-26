/**
 * Weather Service
 * Provides real weather information for styling suggestions
 * Uses Open-Meteo API (free, no API key required)
 * Supports user geolocation via expo-location
 */

import * as ExpoLocation from "expo-location";
import { Platform } from "react-native";

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
  apparentTemperature?: number; // Celsius (feels like)
  condition: WeatherCondition;
  humidity: number; // Percentage
  windSpeed: number; // km/h
  windGusts?: number; // km/h
  precipitation?: number; // mm
  uvIndex?: number;
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

// Weather code mapping from Open-Meteo WMO codes
// https://open-meteo.com/en/docs
const WEATHER_CODE_MAP: Record<number, { condition: WeatherCondition; description: string; descriptionEn: string; icon: string; iconNight: string }> = {
  0: { condition: "sunny", description: "Ciel dégagé", descriptionEn: "Clear sky", icon: "☀️", iconNight: "🌙" },
  1: { condition: "sunny", description: "Principalement dégagé", descriptionEn: "Mainly clear", icon: "🌤️", iconNight: "🌙" },
  2: { condition: "cloudy", description: "Partiellement nuageux", descriptionEn: "Partly cloudy", icon: "⛅", iconNight: "☁️" },
  3: { condition: "cloudy", description: "Couvert", descriptionEn: "Overcast", icon: "☁️", iconNight: "☁️" },
  45: { condition: "foggy", description: "Brouillard", descriptionEn: "Fog", icon: "🌫️", iconNight: "🌫️" },
  48: { condition: "foggy", description: "Brouillard givrant", descriptionEn: "Depositing rime fog", icon: "🌫️", iconNight: "🌫️" },
  51: { condition: "rainy", description: "Bruine légère", descriptionEn: "Light drizzle", icon: "🌧️", iconNight: "🌧️" },
  53: { condition: "rainy", description: "Bruine modérée", descriptionEn: "Moderate drizzle", icon: "🌧️", iconNight: "🌧️" },
  55: { condition: "rainy", description: "Bruine dense", descriptionEn: "Dense drizzle", icon: "🌧️", iconNight: "🌧️" },
  56: { condition: "rainy", description: "Bruine verglaçante légère", descriptionEn: "Light freezing drizzle", icon: "🌧️", iconNight: "🌧️" },
  57: { condition: "rainy", description: "Bruine verglaçante dense", descriptionEn: "Dense freezing drizzle", icon: "🌧️", iconNight: "🌧️" },
  61: { condition: "rainy", description: "Pluie légère", descriptionEn: "Slight rain", icon: "🌧️", iconNight: "🌧️" },
  63: { condition: "rainy", description: "Pluie modérée", descriptionEn: "Moderate rain", icon: "🌧️", iconNight: "🌧️" },
  65: { condition: "rainy", description: "Pluie forte", descriptionEn: "Heavy rain", icon: "🌧️", iconNight: "🌧️" },
  66: { condition: "rainy", description: "Pluie verglaçante légère", descriptionEn: "Light freezing rain", icon: "🌧️", iconNight: "🌧️" },
  67: { condition: "rainy", description: "Pluie verglaçante forte", descriptionEn: "Heavy freezing rain", icon: "🌧️", iconNight: "🌧️" },
  71: { condition: "snowy", description: "Neige légère", descriptionEn: "Slight snow fall", icon: "🌨️", iconNight: "🌨️" },
  73: { condition: "snowy", description: "Neige modérée", descriptionEn: "Moderate snow fall", icon: "🌨️", iconNight: "🌨️" },
  75: { condition: "snowy", description: "Neige forte", descriptionEn: "Heavy snow fall", icon: "❄️", iconNight: "❄️" },
  77: { condition: "snowy", description: "Grains de neige", descriptionEn: "Snow grains", icon: "❄️", iconNight: "❄️" },
  80: { condition: "rainy", description: "Averses légères", descriptionEn: "Slight rain showers", icon: "🌦️", iconNight: "🌧️" },
  81: { condition: "rainy", description: "Averses modérées", descriptionEn: "Moderate rain showers", icon: "🌦️", iconNight: "🌧️" },
  82: { condition: "rainy", description: "Averses violentes", descriptionEn: "Violent rain showers", icon: "🌧️", iconNight: "🌧️" },
  85: { condition: "snowy", description: "Averses de neige légères", descriptionEn: "Slight snow showers", icon: "🌨️", iconNight: "🌨️" },
  86: { condition: "snowy", description: "Averses de neige fortes", descriptionEn: "Heavy snow showers", icon: "❄️", iconNight: "❄️" },
  95: { condition: "stormy", description: "Orage", descriptionEn: "Thunderstorm", icon: "⛈️", iconNight: "⛈️" },
  96: { condition: "stormy", description: "Orage avec grêle légère", descriptionEn: "Thunderstorm with slight hail", icon: "⛈️", iconNight: "⛈️" },
  99: { condition: "stormy", description: "Orage avec grêle forte", descriptionEn: "Thunderstorm with heavy hail", icon: "⛈️", iconNight: "⛈️" },
};

/**
 * Default location (Paris, France)
 */
export const DEFAULT_LOCATION: UserLocation = {
  latitude: 48.8566,
  longitude: 2.3522,
  city: "Paris",
  country: "France",
};

// Cache for location to avoid repeated permission requests
let cachedLocation: UserLocation | null = null;
let locationPermissionStatus: "granted" | "denied" | "undetermined" = "undetermined";

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    // Web geolocation is handled differently
    return true;
  }

  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    locationPermissionStatus = status === "granted" ? "granted" : "denied";
    return status === "granted";
  } catch (error) {
    console.error("[WeatherService] Error requesting location permission:", error);
    locationPermissionStatus = "denied";
    return false;
  }
}

/**
 * Check if location permission is granted
 */
export async function checkLocationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return true;
  }

  try {
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();
    locationPermissionStatus = status === "granted" ? "granted" : "denied";
    return status === "granted";
  } catch (error) {
    console.error("[WeatherService] Error checking location permission:", error);
    return false;
  }
}

/**
 * Get user's current location
 */
export async function getUserLocation(): Promise<UserLocation> {
  // Return cached location if available
  if (cachedLocation) {
    return cachedLocation;
  }

  // Check permission first
  let hasPermission = await checkLocationPermission();
  if (!hasPermission) {
    // Always try requesting permission once when unavailable.
    // This handles first run and cases where status changed externally.
    hasPermission = await requestLocationPermission();
  }
  
  if (!hasPermission) {
    console.log("[WeatherService] Location permission not granted, using default location");
    return DEFAULT_LOCATION;
  }

  try {
    if (Platform.OS === "web") {
      // Use browser geolocation API for web
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(DEFAULT_LOCATION);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            
            // Try to get city name via reverse geocoding
            const cityInfo = await reverseGeocode(location.latitude, location.longitude);
            location.city = cityInfo.city;
            location.country = cityInfo.country;
            
            cachedLocation = location;
            resolve(location);
          },
          () => {
            resolve(DEFAULT_LOCATION);
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      });
    }

    // Native location:
    // 1) Use last known position quickly when available
    // 2) Then refine with current GPS position
    const lastKnown = await ExpoLocation.getLastKnownPositionAsync();
    let position = lastKnown;
    try {
      position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
    } catch (gpsError) {
      if (!position) throw gpsError;
      console.warn("[WeatherService] Current GPS unavailable, using last known position");
    }
    if (!position) {
      throw new Error("No position available");
    }

    const location: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // Try to get city name via reverse geocoding
    try {
      const [reverseGeoResult] = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      if (reverseGeoResult) {
        location.city = reverseGeoResult.city || reverseGeoResult.subregion || undefined;
        location.country = reverseGeoResult.country || undefined;
      }
    } catch (geoError) {
      console.warn("[WeatherService] Reverse geocoding failed:", geoError);
      // Try Open-Meteo geocoding as fallback
      const cityInfo = await reverseGeocode(location.latitude, location.longitude);
      location.city = cityInfo.city;
      location.country = cityInfo.country;
    }

    cachedLocation = location;
    return location;
  } catch (error) {
    console.error("[WeatherService] Error getting location:", error);
    return DEFAULT_LOCATION;
  }
}

/**
 * Reverse geocode coordinates to city name using Open-Meteo Geocoding API
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<{ city?: string; country?: string }> {
  try {
    // Use Open-Meteo's geocoding API for reverse lookup
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=city&count=1&language=fr&format=json`;
    
    // Open-Meteo doesn't have reverse geocoding, so we'll use a simple approach
    // by searching for the nearest city based on coordinates
    // For now, we'll return empty and rely on expo-location's reverse geocoding
    return {};
  } catch (error) {
    console.warn("[WeatherService] Reverse geocoding failed:", error);
    return {};
  }
}

/**
 * Clear cached location (useful when user wants to refresh)
 */
export function clearLocationCache(): void {
  cachedLocation = null;
}

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
 * Determine wind-based condition
 */
function getWindCondition(windSpeed: number): WeatherCondition | null {
  if (windSpeed >= 40) return "windy";
  return null;
}

/**
 * Fetch current weather data from Open-Meteo API
 */
export async function getCurrentWeather(location?: UserLocation): Promise<WeatherData> {
  // Get location if not provided
  const loc = location || await getUserLocation();
  
  try {
    const { latitude, longitude } = loc;
    
    // Build API URL with all needed parameters
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index,is_day&timezone=auto`;
    
    console.log(`[WeatherService] Fetching weather for ${loc.city || 'unknown location'} (${latitude}, ${longitude})`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const current = data.current;
    
    const weatherCode = current.weather_code ?? 0;
    const weatherInfo = WEATHER_CODE_MAP[weatherCode] || WEATHER_CODE_MAP[0];
    
    const temperature = current.temperature_2m;
    const apparentTemperature = current.apparent_temperature;
    const windSpeed = current.wind_speed_10m;
    const windGusts = current.wind_gusts_10m;
    const precipitation = current.precipitation;
    const uvIndex = current.uv_index;
    const isDay = current.is_day === 1;
    
    // Determine condition based on weather code, temperature, and wind
    const tempCondition = getTemperatureCondition(temperature);
    const windCondition = getWindCondition(windSpeed);
    
    // Priority: storm > wind > temperature > weather code
    let condition: WeatherCondition;
    if (weatherInfo.condition === "stormy") {
      condition = "stormy";
    } else if (windCondition) {
      condition = windCondition;
    } else if (tempCondition) {
      condition = tempCondition;
    } else {
      condition = weatherInfo.condition;
    }
    
    // Select appropriate icon based on day/night
    const icon = isDay ? weatherInfo.icon : weatherInfo.iconNight;
    
    console.log(`[WeatherService] Weather: ${temperature}°C, ${weatherInfo.description}, ${condition}`);
    
    return {
      temperature: Math.round(temperature),
      apparentTemperature: Math.round(apparentTemperature),
      condition,
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(windSpeed),
      windGusts: Math.round(windGusts),
      precipitation: typeof precipitation === "number" ? Math.round(precipitation * 10) / 10 : 0,
      uvIndex: typeof uvIndex === "number" ? Math.round(uvIndex) : undefined,
      description: weatherInfo.description,
      icon,
      isDay,
      city: loc.city,
      country: loc.country,
    };
  } catch (error) {
    console.error("[WeatherService] Error fetching weather:", error);
    // Return default mild weather on error
    return {
      temperature: 20,
      apparentTemperature: 20,
      condition: "mild",
      humidity: 50,
      windSpeed: 10,
      windGusts: 12,
      precipitation: 0,
      uvIndex: 3,
      description: "Conditions inconnues",
      icon: "🌤️",
      isDay: true,
      city: loc.city,
      country: loc.country,
    };
  }
}

/**
 * Get weather forecast for the next few days
 */
export async function getWeatherForecast(location?: UserLocation, days: number = 7): Promise<{
  daily: {
    date: Date;
    temperatureMax: number;
    temperatureMin: number;
    condition: WeatherCondition;
    description: string;
    icon: string;
  }[];
}> {
  const loc = location || await getUserLocation();
  
  try {
    const { latitude, longitude } = loc;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${days}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const daily = data.daily;
    
    const forecast = daily.time.map((dateStr: string, index: number) => {
      const weatherCode = daily.weather_code[index] ?? 0;
      const weatherInfo = WEATHER_CODE_MAP[weatherCode] || WEATHER_CODE_MAP[0];
      
      return {
        date: new Date(dateStr),
        temperatureMax: Math.round(daily.temperature_2m_max[index]),
        temperatureMin: Math.round(daily.temperature_2m_min[index]),
        condition: weatherInfo.condition,
        description: weatherInfo.description,
        icon: weatherInfo.icon,
      };
    });
    
    return { daily: forecast };
  } catch (error) {
    console.error("[WeatherService] Error fetching forecast:", error);
    return { daily: [] };
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
 * Get location permission status
 */
export function getLocationPermissionStatus(): "granted" | "denied" | "undetermined" {
  return locationPermissionStatus;
}

/**
 * Search for a city by name using Open-Meteo Geocoding API
 */
export async function searchCity(query: string): Promise<{
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}[]> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=fr&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results) {
      return [];
    }
    
    return data.results.map((result: { name: string; country: string; latitude: number; longitude: number }) => ({
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
    }));
  } catch (error) {
    console.error("[WeatherService] Error searching city:", error);
    return [];
  }
}

// Legacy export for backward compatibility
export type Location = UserLocation;
