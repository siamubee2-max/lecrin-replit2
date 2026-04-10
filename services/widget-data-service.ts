/**
 * Widget Data Service
 * Manages data sharing between the app and native widgets
 * Uses AsyncStorage for persistence and provides data in a widget-friendly format
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { DailySuggestion } from "./daily-look-suggestion-types";
import { WeatherData } from "./weather-types";
import { EventType, EVENT_TYPE_NAMES, EVENT_TYPE_ICONS } from "./calendar-service";

// Widget data storage key
const WIDGET_DATA_KEY = "@ecrin_widget_data";
const WIDGET_LAST_UPDATE_KEY = "@ecrin_widget_last_update";

/**
 * Simplified widget data structure
 * Contains only essential information for display in widgets
 */
export type WidgetData = {
  // Weather info
  weatherIcon: string;
  weatherTemp: number;
  weatherCondition: string;
  weatherDescription: string;
  
  // Event info
  eventIcon: string;
  eventName: string;
  eventType: string;
  
  // Suggestion info
  mainTip: string;
  shortTip: string; // Truncated version for small widgets
  recommendedJewelry: string[];
  recommendedMetal: string;
  lookInspiration: string;
  
  // Mood
  moodKeyword: string;
  
  // Metadata
  date: string; // ISO date string
  lastUpdated: string; // ISO timestamp
  
  // Deep link
  deepLink: string;
};

/**
 * Widget size configurations
 */
export type WidgetSize = "small" | "medium" | "large";

/**
 * Get the appropriate content for each widget size
 */
export function getWidgetContent(data: WidgetData, size: WidgetSize): Partial<WidgetData> {
  switch (size) {
    case "small":
      return {
        weatherIcon: data.weatherIcon,
        weatherTemp: data.weatherTemp,
        recommendedMetal: data.recommendedMetal,
        shortTip: data.shortTip,
        deepLink: data.deepLink,
      };
    case "medium":
      return {
        weatherIcon: data.weatherIcon,
        weatherTemp: data.weatherTemp,
        weatherDescription: data.weatherDescription,
        eventIcon: data.eventIcon,
        eventName: data.eventName,
        mainTip: data.mainTip,
        recommendedJewelry: data.recommendedJewelry.slice(0, 2),
        recommendedMetal: data.recommendedMetal,
        deepLink: data.deepLink,
      };
    case "large":
      return data;
  }
}

/**
 * Convert a DailySuggestion to WidgetData format
 */
export function suggestionToWidgetData(
  suggestion: DailySuggestion,
  weather: WeatherData
): WidgetData {
  const now = new Date();
  
  // Create a short tip (max 50 characters)
  const shortTip = suggestion.mainTip.length > 50
    ? suggestion.mainTip.substring(0, 47) + "..."
    : suggestion.mainTip;
  
  return {
    // Weather
    weatherIcon: weather.icon,
    weatherTemp: Math.round(weather.temperature),
    weatherCondition: weather.condition,
    weatherDescription: weather.description,
    
    // Event
    eventIcon: suggestion.event.icon,
    eventName: suggestion.event.name,
    eventType: suggestion.event.type,
    
    // Suggestion
    mainTip: suggestion.mainTip,
    shortTip,
    recommendedJewelry: suggestion.recommendedJewelry,
    recommendedMetal: suggestion.recommendedMetals[0] || "Or",
    lookInspiration: suggestion.lookInspiration,
    
    // Mood
    moodKeyword: suggestion.moodKeywords[0] || "élégant",
    
    // Metadata
    date: now.toISOString().split("T")[0],
    lastUpdated: now.toISOString(),
    
    // Deep link
    deepLink: "ecrin://notifications",
  };
}

/**
 * Save widget data to storage
 */
export async function saveWidgetData(data: WidgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(WIDGET_LAST_UPDATE_KEY, new Date().toISOString());
  } catch (error) {
    console.error("Failed to save widget data:", error);
  }
}

/**
 * Load widget data from storage
 */
export async function loadWidgetData(): Promise<WidgetData | null> {
  try {
    const data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (data) {
      return JSON.parse(data) as WidgetData;
    }
    return null;
  } catch (error) {
    console.error("Failed to load widget data:", error);
    return null;
  }
}

/**
 * Get the last update timestamp
 */
export async function getLastWidgetUpdate(): Promise<Date | null> {
  try {
    const timestamp = await AsyncStorage.getItem(WIDGET_LAST_UPDATE_KEY);
    if (timestamp) {
      return new Date(timestamp);
    }
    return null;
  } catch (error) {
    console.error("Failed to get last widget update:", error);
    return null;
  }
}

/**
 * Check if widget data needs to be refreshed
 * Returns true if data is older than 1 hour or doesn't exist
 */
export async function needsWidgetRefresh(): Promise<boolean> {
  const lastUpdate = await getLastWidgetUpdate();
  if (!lastUpdate) return true;
  
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceUpdate >= 1;
}

/**
 * Generate default widget data when no suggestion is available
 */
export function getDefaultWidgetData(): WidgetData {
  const now = new Date();
  
  return {
    weatherIcon: "☀️",
    weatherTemp: 20,
    weatherCondition: "mild",
    weatherDescription: "Temps agréable",
    
    eventIcon: "📅",
    eventName: "Journée normale",
    eventType: "none",
    
    mainTip: "Portez vos bijoux préférés aujourd'hui",
    shortTip: "Portez vos bijoux préférés",
    recommendedJewelry: ["Collier", "Boucles d'oreilles", "Bracelet"],
    recommendedMetal: "Or",
    lookInspiration: "L'élégance du quotidien",
    
    moodKeyword: "classique",
    
    date: now.toISOString().split("T")[0],
    lastUpdated: now.toISOString(),
    
    deepLink: "ecrin://notifications",
  };
}

/**
 * Format widget data for iOS UserDefaults (App Groups)
 * Returns a JSON string suitable for sharing with iOS widgets
 */
export function formatForIOSWidget(data: WidgetData): string {
  return JSON.stringify({
    ...data,
    platform: "ios",
  });
}

/**
 * Format widget data for Android SharedPreferences
 * Returns a JSON string suitable for sharing with Android widgets
 */
export function formatForAndroidWidget(data: WidgetData): string {
  return JSON.stringify({
    ...data,
    platform: "android",
  });
}

/**
 * Get formatted widget data for the current platform
 */
export function formatForPlatform(data: WidgetData): string {
  if (Platform.OS === "ios") {
    return formatForIOSWidget(data);
  }
  return formatForAndroidWidget(data);
}

/**
 * Widget refresh intervals in milliseconds
 */
export const WIDGET_REFRESH_INTERVALS = {
  minimum: 15 * 60 * 1000, // 15 minutes (iOS minimum)
  hourly: 60 * 60 * 1000, // 1 hour
  daily: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Widget timeline entry for iOS WidgetKit
 */
export type WidgetTimelineEntry = {
  date: Date;
  data: WidgetData;
};

/**
 * Generate a timeline of widget entries for the next 24 hours
 * Used by iOS WidgetKit for scheduled updates
 */
export function generateWidgetTimeline(
  currentData: WidgetData,
  hoursAhead: number = 24
): WidgetTimelineEntry[] {
  const entries: WidgetTimelineEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < hoursAhead; i++) {
    const entryDate = new Date(now.getTime() + i * 60 * 60 * 1000);
    entries.push({
      date: entryDate,
      data: {
        ...currentData,
        lastUpdated: entryDate.toISOString(),
      },
    });
  }
  
  return entries;
}

/**
 * Widget configuration for app.config.ts
 */
export const WIDGET_CONFIG = {
  ios: {
    widgetName: "EcrinWidget",
    displayName: "L'Écrin Virtuel",
    description: "Votre suggestion de bijoux du jour",
    supportedFamilies: ["small", "medium", "large"],
    appGroupId: "group.com.ecrin.jewelry.widget",
  },
  android: {
    widgetName: "DailySuggestionWidget",
    displayName: "L'Écrin Virtuel",
    description: "Votre suggestion de bijoux du jour",
    minWidth: 110,
    minHeight: 40,
    updatePeriodMillis: 3600000, // 1 hour
    previewLayout: "@layout/widget_preview",
    initialLayout: "@layout/widget_daily_suggestion",
  },
};
