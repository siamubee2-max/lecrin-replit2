/**
 * Tests for Notification Services
 * Tests weather service, calendar service, and daily look suggestion service
 */

import { describe, it, expect } from "vitest";

// Weather Service Tests (using types file to avoid expo-location import)
import {
  WeatherCondition,
  WeatherData,
  UserLocation,
  getWeatherStylingTips,
  getWeatherJewelryRecommendations,
  DEFAULT_LOCATION,
} from "../services/weather-types";

// Calendar Service Tests
import {
  EventType,
  detectEventType,
  getEventStylingTips,
  getEventJewelryRecommendations,
  createManualEvent,
  getTodaySchedule,
  EVENT_TYPE_NAMES,
  EVENT_TYPE_ICONS,
} from "../services/calendar-service";

// Daily Look Suggestion Service Tests (using types file to avoid expo-location import)
import {
  generateDailySuggestion,
  generateNotificationContent,
  generateMorningGreeting,
  getNextNotificationTime,
  NOTIFICATION_TIMES,
  DailySuggestion,
} from "../services/daily-look-suggestion-types";

describe("Weather Service", () => {
  describe("DEFAULT_LOCATION", () => {
    it("should have Paris as default location", () => {
      expect(DEFAULT_LOCATION.latitude).toBe(48.8566);
      expect(DEFAULT_LOCATION.longitude).toBe(2.3522);
      expect(DEFAULT_LOCATION.city).toBe("Paris");
      expect(DEFAULT_LOCATION.country).toBe("France");
    });
  });

  describe("UserLocation type", () => {
    it("should accept valid location data", () => {
      const location: UserLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
        city: "Paris",
        country: "France",
      };
      expect(location.latitude).toBe(48.8566);
      expect(location.longitude).toBe(2.3522);
      expect(location.city).toBe("Paris");
      expect(location.country).toBe("France");
    });

    it("should accept location without city and country", () => {
      const location: UserLocation = {
        latitude: 40.7128,
        longitude: -74.006,
      };
      expect(location.latitude).toBe(40.7128);
      expect(location.longitude).toBe(-74.006);
      expect(location.city).toBeUndefined();
      expect(location.country).toBeUndefined();
    });
  });

  describe("getWeatherStylingTips", () => {
    const weatherConditions: WeatherCondition[] = [
      "sunny", "cloudy", "rainy", "snowy", "stormy", "foggy", "windy", "hot", "cold", "mild"
    ];

    weatherConditions.forEach((condition) => {
      it(`should return tips for ${condition} weather`, () => {
        const weather: WeatherData = {
          temperature: 20,
          condition,
          humidity: 50,
          windSpeed: 10,
          description: "Test",
          icon: "☀️",
          isDay: true,
        };
        const tips = getWeatherStylingTips(weather);
        expect(tips).toBeInstanceOf(Array);
        expect(tips.length).toBeGreaterThan(0);
        tips.forEach((tip) => {
          expect(typeof tip).toBe("string");
          expect(tip.length).toBeGreaterThan(0);
        });
      });
    });

    it("should return different tips for sunny vs rainy weather", () => {
      const sunnyWeather: WeatherData = {
        temperature: 25,
        condition: "sunny",
        humidity: 40,
        windSpeed: 5,
        description: "Ensoleillé",
        icon: "☀️",
        isDay: true,
      };
      const rainyWeather: WeatherData = {
        temperature: 15,
        condition: "rainy",
        humidity: 90,
        windSpeed: 20,
        description: "Pluvieux",
        icon: "🌧️",
        isDay: true,
      };

      const sunnyTips = getWeatherStylingTips(sunnyWeather);
      const rainyTips = getWeatherStylingTips(rainyWeather);

      expect(sunnyTips).not.toEqual(rainyTips);
    });
  });

  describe("getWeatherJewelryRecommendations", () => {
    it("should return recommendations for sunny weather", () => {
      const weather: WeatherData = {
        temperature: 28,
        condition: "sunny",
        humidity: 40,
        windSpeed: 5,
        description: "Ensoleillé",
        icon: "☀️",
        isDay: true,
      };
      const recs = getWeatherJewelryRecommendations(weather);
      
      expect(recs.recommended).toBeInstanceOf(Array);
      expect(recs.avoid).toBeInstanceOf(Array);
      expect(recs.recommended.length).toBeGreaterThan(0);
    });

    it("should recommend avoiding certain items in rainy weather", () => {
      const weather: WeatherData = {
        temperature: 12,
        condition: "rainy",
        humidity: 90,
        windSpeed: 15,
        description: "Pluvieux",
        icon: "🌧️",
        isDay: true,
      };
      const recs = getWeatherJewelryRecommendations(weather);
      
      expect(recs.avoid.length).toBeGreaterThan(0);
    });
  });
});

describe("Calendar Service", () => {
  describe("detectEventType", () => {
    const testCases: [string, EventType][] = [
      ["Réunion d'équipe", "meeting"],
      ["Team meeting", "meeting"],
      ["Travail au bureau", "work"],
      ["Café avec Marie", "casual"],
      ["Mariage de Pierre", "wedding"],
      ["Entretien d'embauche", "interview"],
      ["Présentation client", "presentation"],
      ["Dîner romantique", "date"],
      ["Fête d'anniversaire", "party"],
      ["Yoga matinal", "sport"],
      ["Voyage à Lyon", "travel"],
      ["Shopping au magasin", "shopping"],
      ["Brunch dominical", "brunch"],
    ];

    testCases.forEach(([title, expectedType]) => {
      it(`should detect "${title}" as ${expectedType}`, () => {
        const detected = detectEventType(title);
        expect(detected).toBe(expectedType);
      });
    });

    it("should default to casual for unknown events", () => {
      const detected = detectEventType("Something random");
      expect(detected).toBe("casual");
    });
  });

  describe("getEventStylingTips", () => {
    const eventTypes: EventType[] = [
      "work", "meeting", "casual", "formal", "party", "date",
      "wedding", "sport", "travel", "interview", "presentation",
      "dinner", "brunch", "shopping", "none"
    ];

    eventTypes.forEach((eventType) => {
      it(`should return tips for ${eventType} event`, () => {
        const tips = getEventStylingTips(eventType);
        expect(tips).toBeInstanceOf(Array);
        expect(tips.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getEventJewelryRecommendations", () => {
    it("should recommend professional jewelry for work", () => {
      const recs = getEventJewelryRecommendations("work");
      expect(recs.recommended).toBeInstanceOf(Array);
      expect(recs.avoid).toBeInstanceOf(Array);
      expect(recs.metals).toBeInstanceOf(Array);
    });

    it("should recommend removing jewelry for sport", () => {
      const recs = getEventJewelryRecommendations("sport");
      expect(recs.avoid.length).toBeGreaterThan(0);
    });

    it("should recommend elegant jewelry for wedding", () => {
      const recs = getEventJewelryRecommendations("wedding");
      expect(recs.recommended.length).toBeGreaterThan(0);
    });
  });

  describe("createManualEvent", () => {
    it("should create a manual event with correct properties", () => {
      const event = createManualEvent("Test Event", "meeting");
      
      expect(event.id).toContain("manual-");
      expect(event.title).toBe("Test Event");
      expect(event.type).toBe("meeting");
      expect(event.isAllDay).toBe(true);
      expect(event.startTime).toBeInstanceOf(Date);
    });
  });

  describe("getTodaySchedule", () => {
    it("should return schedule with no events", () => {
      const schedule = getTodaySchedule([]);
      
      expect(schedule.events).toEqual([]);
      expect(schedule.primaryEventType).toBe("none");
      expect(schedule.hasImportantEvent).toBe(false);
    });

    it("should identify important events", () => {
      const events = [
        createManualEvent("Interview", "interview"),
      ];
      const schedule = getTodaySchedule(events);
      
      expect(schedule.primaryEventType).toBe("interview");
      expect(schedule.hasImportantEvent).toBe(true);
    });
  });

  describe("EVENT_TYPE_NAMES", () => {
    it("should have names for all event types", () => {
      const eventTypes: EventType[] = [
        "work", "meeting", "casual", "formal", "party", "date",
        "wedding", "sport", "travel", "interview", "presentation",
        "dinner", "brunch", "shopping", "none"
      ];

      eventTypes.forEach((type) => {
        expect(EVENT_TYPE_NAMES[type]).toBeDefined();
        expect(typeof EVENT_TYPE_NAMES[type]).toBe("string");
      });
    });
  });

  describe("EVENT_TYPE_ICONS", () => {
    it("should have icons for all event types", () => {
      const eventTypes: EventType[] = [
        "work", "meeting", "casual", "formal", "party", "date",
        "wedding", "sport", "travel", "interview", "presentation",
        "dinner", "brunch", "shopping", "none"
      ];

      eventTypes.forEach((type) => {
        expect(EVENT_TYPE_ICONS[type]).toBeDefined();
        expect(typeof EVENT_TYPE_ICONS[type]).toBe("string");
      });
    });
  });
});

describe("Daily Look Suggestion Service", () => {
  const mockWeather: WeatherData = {
    temperature: 22,
    condition: "sunny",
    humidity: 45,
    windSpeed: 8,
    description: "Ensoleillé",
    icon: "☀️",
    isDay: true,
  };

  describe("generateDailySuggestion", () => {
    it("should generate a complete suggestion", () => {
      const schedule = getTodaySchedule([]);
      const suggestion = generateDailySuggestion(mockWeather, schedule);

      expect(suggestion.date).toBeInstanceOf(Date);
      expect(suggestion.weather).toBeDefined();
      expect(suggestion.event).toBeDefined();
      expect(suggestion.mainTip).toBeDefined();
      expect(suggestion.tips).toBeInstanceOf(Array);
      expect(suggestion.recommendedJewelry).toBeInstanceOf(Array);
      expect(suggestion.avoidJewelry).toBeInstanceOf(Array);
      expect(suggestion.recommendedMetals).toBeInstanceOf(Array);
      expect(suggestion.lookInspiration).toBeDefined();
      expect(suggestion.moodKeywords).toBeInstanceOf(Array);
    });

    it("should prioritize important events", () => {
      const events = [createManualEvent("Interview", "interview")];
      const schedule = getTodaySchedule(events);
      const suggestion = generateDailySuggestion(mockWeather, schedule);

      expect(suggestion.event.type).toBe("interview");
    });

    it("should include weather information", () => {
      const schedule = getTodaySchedule([]);
      const suggestion = generateDailySuggestion(mockWeather, schedule);

      expect(suggestion.weather.temperature).toBe(22);
      expect(suggestion.weather.condition).toBe("sunny");
    });

    it("should have mood keywords", () => {
      const schedule = getTodaySchedule([]);
      const suggestion = generateDailySuggestion(mockWeather, schedule);

      expect(suggestion.moodKeywords.length).toBeGreaterThan(0);
    });
  });

  describe("generateNotificationContent", () => {
    it("should generate notification content from suggestion", () => {
      const schedule = getTodaySchedule([]);
      const suggestion = generateDailySuggestion(mockWeather, schedule);
      const content = generateNotificationContent(suggestion);

      expect(content.title).toBeDefined();
      expect(content.body).toBeDefined();
      expect(typeof content.title).toBe("string");
      expect(typeof content.body).toBe("string");
    });

    it("should include weather info in title", () => {
      const events = [createManualEvent("Wedding", "wedding")];
      const schedule = getTodaySchedule(events);
      const suggestion = generateDailySuggestion(mockWeather, schedule);
      const content = generateNotificationContent(suggestion);

      expect(content.title).toContain(suggestion.weather.icon);
      expect(content.title).toContain(String(suggestion.weather.temperature));
    });
  });

  describe("generateMorningGreeting", () => {
    it("should generate a greeting based on time of day", () => {
      const greeting = generateMorningGreeting();
      
      expect(typeof greeting).toBe("string");
      expect(greeting.length).toBeGreaterThan(0);
      expect(["Bonjour", "Bon après-midi", "Bonsoir"]).toContain(greeting);
    });
  });

  describe("NOTIFICATION_TIMES", () => {
    it("should have morning time at 8:00", () => {
      expect(NOTIFICATION_TIMES.morning.hour).toBe(8);
      expect(NOTIFICATION_TIMES.morning.minute).toBe(0);
    });

    it("should have evening time at 20:00", () => {
      expect(NOTIFICATION_TIMES.evening.hour).toBe(20);
      expect(NOTIFICATION_TIMES.evening.minute).toBe(0);
    });
  });

  describe("getNextNotificationTime", () => {
    it("should return a future date", () => {
      const nextTime = getNextNotificationTime("morning");
      const now = new Date();

      expect(nextTime).toBeInstanceOf(Date);
      expect(nextTime.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });

    it("should set correct hour for morning", () => {
      const nextTime = getNextNotificationTime("morning");
      expect(nextTime.getHours()).toBe(8);
      expect(nextTime.getMinutes()).toBe(0);
    });

    it("should set correct hour for evening", () => {
      const nextTime = getNextNotificationTime("evening");
      expect(nextTime.getHours()).toBe(20);
      expect(nextTime.getMinutes()).toBe(0);
    });
  });
});

describe("Integration Tests", () => {
  describe("Full suggestion flow", () => {
    it("should generate a complete daily suggestion for work day", () => {
      const weather: WeatherData = {
        temperature: 18,
        condition: "cloudy",
        humidity: 60,
        windSpeed: 12,
        description: "Nuageux",
        icon: "☁️",
        isDay: true,
      };

      const events = [
        createManualEvent("Réunion importante", "meeting"),
      ];
      const schedule = getTodaySchedule(events);
      const suggestion = generateDailySuggestion(weather, schedule);
      const notification = generateNotificationContent(suggestion);

      // Verify complete flow
      expect(suggestion.event.type).toBe("meeting");
      expect(suggestion.weather.condition).toBe("cloudy");
      expect(suggestion.recommendedJewelry.length).toBeGreaterThan(0);
      expect(notification.title).toBeDefined();
      expect(notification.body).toBeDefined();
    });

    it("should generate appropriate suggestions for party", () => {
      const weather: WeatherData = {
        temperature: 24,
        condition: "sunny",
        humidity: 35,
        windSpeed: 5,
        description: "Ensoleillé",
        icon: "☀️",
        isDay: false,
      };

      const events = [createManualEvent("Fête", "party")];
      const schedule = getTodaySchedule(events);
      const suggestion = generateDailySuggestion(weather, schedule);

      expect(suggestion.event.type).toBe("party");
      expect(suggestion.moodKeywords.length).toBeGreaterThan(0);
    });

    it("should handle extreme weather conditions", () => {
      const hotWeather: WeatherData = {
        temperature: 35,
        condition: "hot",
        humidity: 30,
        windSpeed: 3,
        description: "Très chaud",
        icon: "🌡️",
        isDay: true,
      };

      const schedule = getTodaySchedule([]);
      const suggestion = generateDailySuggestion(hotWeather, schedule);

      expect(suggestion.weather.temperature).toBe(35);
      expect(suggestion.mainTip).toBeDefined();
    });

    it("should handle cold weather with formal event", () => {
      const coldWeather: WeatherData = {
        temperature: -2,
        condition: "cold",
        humidity: 70,
        windSpeed: 20,
        description: "Très froid",
        icon: "❄️",
        isDay: true,
      };

      const events = [createManualEvent("Gala", "formal")];
      const schedule = getTodaySchedule(events);
      const suggestion = generateDailySuggestion(coldWeather, schedule);

      expect(suggestion.event.type).toBe("formal");
    });
  });
});
