import { describe, it, expect, vi } from "vitest";
import { DailySuggestion } from "../services/daily-look-suggestion-types";
import { WeatherData, WeatherCondition } from "../services/weather-types";
import { EventType } from "../services/calendar-service";

// Mock AsyncStorage and Platform before importing the service
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
  },
}));

// Import after mocks are set up
import {
  WidgetData,
  getWidgetContent,
  suggestionToWidgetData,
  getDefaultWidgetData,
  formatForIOSWidget,
  formatForAndroidWidget,
  generateWidgetTimeline,
  WIDGET_CONFIG,
  WIDGET_REFRESH_INTERVALS,
} from "../services/widget-data-service";

describe("Widget Data Service", () => {
  // Sample test data
  const sampleWeather: WeatherData = {
    temperature: 22,
    condition: "sunny" as WeatherCondition,
    description: "Ensoleillé",
    humidity: 45,
    windSpeed: 10,
    icon: "☀️",
    city: "Paris",
    country: "France",
    isDay: true,
  };

  const sampleSuggestion: DailySuggestion = {
    date: new Date(),
    weather: {
      condition: "sunny" as WeatherCondition,
      temperature: 22,
      description: "Ensoleillé",
      icon: "☀️",
    },
    event: {
      type: "work" as EventType,
      name: "Réunion importante",
      icon: "💼",
    },
    mainTip: "Optez pour des bijoux discrets mais élégants pour votre réunion professionnelle",
    tips: ["Conseil 1", "Conseil 2"],
    recommendedJewelry: ["Boucles d'oreilles perles", "Bracelet fin", "Montre classique"],
    recommendedMetals: ["Or blanc", "Argent"],
    avoidJewelry: ["Bijoux volumineux"],
    lookInspiration: "L'élégance professionnelle",
    moodKeywords: ["sophistiqué", "professionnel", "raffiné"],
  };

  describe("getWidgetContent", () => {
    const widgetData = suggestionToWidgetData(sampleSuggestion, sampleWeather);

    it("should return minimal data for small widget", () => {
      const content = getWidgetContent(widgetData, "small");
      
      expect(content.weatherIcon).toBe("☀️");
      expect(content.weatherTemp).toBe(22);
      expect(content.recommendedMetal).toBe("Or blanc");
      expect(content.shortTip).toBeDefined();
      expect(content.deepLink).toBe("ecrin://notifications");
      
      // Should not include full data
      expect(content.mainTip).toBeUndefined();
      expect(content.lookInspiration).toBeUndefined();
    });

    it("should return medium data for medium widget", () => {
      const content = getWidgetContent(widgetData, "medium");
      
      expect(content.weatherIcon).toBe("☀️");
      expect(content.weatherTemp).toBe(22);
      expect(content.weatherDescription).toBe("Ensoleillé");
      expect(content.eventIcon).toBe("💼");
      expect(content.eventName).toBe("Réunion importante");
      expect(content.mainTip).toBeDefined();
      expect(content.recommendedJewelry).toHaveLength(2);
      expect(content.recommendedMetal).toBe("Or blanc");
      expect(content.deepLink).toBe("ecrin://notifications");
      
      // Should not include full data
      expect(content.lookInspiration).toBeUndefined();
    });

    it("should return full data for large widget", () => {
      const content = getWidgetContent(widgetData, "large");
      
      expect(content.weatherIcon).toBe("☀️");
      expect(content.weatherTemp).toBe(22);
      expect(content.weatherDescription).toBe("Ensoleillé");
      expect(content.eventIcon).toBe("💼");
      expect(content.eventName).toBe("Réunion importante");
      expect(content.mainTip).toBeDefined();
      expect(content.recommendedJewelry).toBeDefined();
      expect(content.recommendedMetal).toBe("Or blanc");
      expect(content.lookInspiration).toBe("L'élégance professionnelle");
      expect(content.moodKeyword).toBe("sophistiqué");
      expect(content.deepLink).toBe("ecrin://notifications");
    });
  });

  describe("suggestionToWidgetData", () => {
    it("should convert suggestion to widget data format", () => {
      const widgetData = suggestionToWidgetData(sampleSuggestion, sampleWeather);
      
      expect(widgetData.weatherIcon).toBe("☀️");
      expect(widgetData.weatherTemp).toBe(22);
      expect(widgetData.weatherCondition).toBe("sunny");
      expect(widgetData.weatherDescription).toBe("Ensoleillé");
      
      expect(widgetData.eventIcon).toBe("💼");
      expect(widgetData.eventName).toBe("Réunion importante");
      expect(widgetData.eventType).toBe("work");
      
      expect(widgetData.mainTip).toContain("bijoux discrets");
      expect(widgetData.recommendedJewelry).toContain("Boucles d'oreilles perles");
      expect(widgetData.recommendedMetal).toBe("Or blanc");
      expect(widgetData.lookInspiration).toBe("L'élégance professionnelle");
      expect(widgetData.moodKeyword).toBe("sophistiqué");
      
      expect(widgetData.deepLink).toBe("ecrin://notifications");
      expect(widgetData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(widgetData.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should truncate long tips for shortTip", () => {
      const longTipSuggestion: DailySuggestion = {
        ...sampleSuggestion,
        mainTip: "Ceci est un conseil très long qui dépasse largement les 50 caractères et devrait être tronqué pour le petit widget",
      };
      
      const widgetData = suggestionToWidgetData(longTipSuggestion, sampleWeather);
      
      expect(widgetData.shortTip.length).toBeLessThanOrEqual(50);
      expect(widgetData.shortTip).toContain("...");
    });

    it("should not truncate short tips", () => {
      const shortTipSuggestion: DailySuggestion = {
        ...sampleSuggestion,
        mainTip: "Conseil court",
      };
      
      const widgetData = suggestionToWidgetData(shortTipSuggestion, sampleWeather);
      
      expect(widgetData.shortTip).toBe("Conseil court");
      expect(widgetData.shortTip).not.toContain("...");
    });
  });

  describe("getDefaultWidgetData", () => {
    it("should return valid default widget data", () => {
      const defaultData = getDefaultWidgetData();
      
      expect(defaultData.weatherIcon).toBe("☀️");
      expect(defaultData.weatherTemp).toBe(20);
      expect(defaultData.weatherCondition).toBe("mild");
      expect(defaultData.eventIcon).toBe("📅");
      expect(defaultData.eventName).toBe("Journée normale");
      expect(defaultData.mainTip).toContain("bijoux préférés");
      expect(defaultData.recommendedJewelry).toHaveLength(3);
      expect(defaultData.recommendedMetal).toBe("Or");
      expect(defaultData.deepLink).toBe("ecrin://notifications");
    });
  });

  describe("formatForIOSWidget", () => {
    it("should format data for iOS with platform marker", () => {
      const widgetData = getDefaultWidgetData();
      const formatted = formatForIOSWidget(widgetData);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.platform).toBe("ios");
      expect(parsed.weatherIcon).toBe(widgetData.weatherIcon);
      expect(parsed.recommendedMetal).toBe(widgetData.recommendedMetal);
    });
  });

  describe("formatForAndroidWidget", () => {
    it("should format data for Android with platform marker", () => {
      const widgetData = getDefaultWidgetData();
      const formatted = formatForAndroidWidget(widgetData);
      const parsed = JSON.parse(formatted);
      
      expect(parsed.platform).toBe("android");
      expect(parsed.weatherIcon).toBe(widgetData.weatherIcon);
      expect(parsed.recommendedMetal).toBe(widgetData.recommendedMetal);
    });
  });

  describe("generateWidgetTimeline", () => {
    it("should generate timeline entries for 24 hours by default", () => {
      const widgetData = getDefaultWidgetData();
      const timeline = generateWidgetTimeline(widgetData);
      
      expect(timeline).toHaveLength(24);
    });

    it("should generate timeline entries for specified hours", () => {
      const widgetData = getDefaultWidgetData();
      const timeline = generateWidgetTimeline(widgetData, 12);
      
      expect(timeline).toHaveLength(12);
    });

    it("should have incrementing dates for each entry", () => {
      const widgetData = getDefaultWidgetData();
      const timeline = generateWidgetTimeline(widgetData, 5);
      
      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].date.getTime()).toBeGreaterThan(timeline[i - 1].date.getTime());
      }
    });

    it("should include widget data in each entry", () => {
      const widgetData = getDefaultWidgetData();
      const timeline = generateWidgetTimeline(widgetData, 3);
      
      timeline.forEach((entry) => {
        expect(entry.data.weatherIcon).toBe(widgetData.weatherIcon);
        expect(entry.data.recommendedMetal).toBe(widgetData.recommendedMetal);
      });
    });
  });

  describe("WIDGET_CONFIG", () => {
    it("should have valid iOS configuration", () => {
      expect(WIDGET_CONFIG.ios.widgetName).toBe("EcrinWidget");
      expect(WIDGET_CONFIG.ios.displayName).toBe("L'Écrin Virtuel");
      expect(WIDGET_CONFIG.ios.supportedFamilies).toContain("small");
      expect(WIDGET_CONFIG.ios.supportedFamilies).toContain("medium");
      expect(WIDGET_CONFIG.ios.supportedFamilies).toContain("large");
      expect(WIDGET_CONFIG.ios.appGroupId).toMatch(/^group\./);
    });

    it("should have valid Android configuration", () => {
      expect(WIDGET_CONFIG.android.widgetName).toBe("DailySuggestionWidget");
      expect(WIDGET_CONFIG.android.displayName).toBe("L'Écrin Virtuel");
      expect(WIDGET_CONFIG.android.minWidth).toBeGreaterThan(0);
      expect(WIDGET_CONFIG.android.minHeight).toBeGreaterThan(0);
      expect(WIDGET_CONFIG.android.updatePeriodMillis).toBe(3600000); // 1 hour
    });
  });

  describe("WIDGET_REFRESH_INTERVALS", () => {
    it("should have correct interval values", () => {
      expect(WIDGET_REFRESH_INTERVALS.minimum).toBe(15 * 60 * 1000); // 15 minutes
      expect(WIDGET_REFRESH_INTERVALS.hourly).toBe(60 * 60 * 1000); // 1 hour
      expect(WIDGET_REFRESH_INTERVALS.daily).toBe(24 * 60 * 60 * 1000); // 24 hours
    });
  });

  describe("Widget data validation", () => {
    it("should have all required fields for widget display", () => {
      const widgetData = suggestionToWidgetData(sampleSuggestion, sampleWeather);
      
      // Required fields for all widget sizes
      expect(widgetData).toHaveProperty("weatherIcon");
      expect(widgetData).toHaveProperty("weatherTemp");
      expect(widgetData).toHaveProperty("recommendedMetal");
      expect(widgetData).toHaveProperty("shortTip");
      expect(widgetData).toHaveProperty("deepLink");
      
      // Required fields for medium and large widgets
      expect(widgetData).toHaveProperty("weatherDescription");
      expect(widgetData).toHaveProperty("eventIcon");
      expect(widgetData).toHaveProperty("eventName");
      expect(widgetData).toHaveProperty("mainTip");
      expect(widgetData).toHaveProperty("recommendedJewelry");
      
      // Required fields for large widget
      expect(widgetData).toHaveProperty("lookInspiration");
      expect(widgetData).toHaveProperty("moodKeyword");
    });

    it("should have valid deep link format", () => {
      const widgetData = getDefaultWidgetData();
      
      expect(widgetData.deepLink).toMatch(/^ecrin:\/\//);
    });

    it("should have valid date format", () => {
      const widgetData = getDefaultWidgetData();
      
      // ISO date format YYYY-MM-DD
      expect(widgetData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // ISO timestamp format
      expect(widgetData.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("Weather condition mapping", () => {
    const conditions: WeatherCondition[] = ["sunny", "cloudy", "rainy", "snowy", "cold", "hot", "mild"];
    
    conditions.forEach((condition) => {
      it(`should handle ${condition} weather condition`, () => {
        const weather: WeatherData = {
          ...sampleWeather,
          condition,
        };
        
        const widgetData = suggestionToWidgetData(sampleSuggestion, weather);
        
        expect(widgetData.weatherCondition).toBe(condition);
      });
    });
  });

  describe("Event type mapping", () => {
    const eventTypes: EventType[] = ["work", "formal", "casual", "sport", "date", "shopping", "none"];
    
    eventTypes.forEach((eventType) => {
      it(`should handle ${eventType} event type`, () => {
        const suggestion: DailySuggestion = {
          ...sampleSuggestion,
          event: {
            type: eventType,
            name: `Test ${eventType}`,
            icon: "📅",
          },
        };
        
        const widgetData = suggestionToWidgetData(suggestion, sampleWeather);
        
        expect(widgetData.eventType).toBe(eventType);
      });
    });
  });
});
