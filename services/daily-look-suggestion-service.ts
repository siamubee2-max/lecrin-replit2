/**
 * Daily Look Suggestion Service
 * Generates personalized jewelry and styling suggestions based on weather and calendar events
 */

import {
  WeatherData,
  WeatherCondition,
  getWeatherStylingTips,
  getWeatherJewelryRecommendations,
} from "./weather-service";

import {
  EventType,
  DaySchedule,
  getEventStylingTips,
  getEventJewelryRecommendations,
  EVENT_TYPE_NAMES,
  EVENT_TYPE_ICONS,
} from "./calendar-service";

export type DailySuggestion = {
  id: string;
  date: Date;
  title: string;
  subtitle: string;
  icon: string;
  
  // Weather context
  weather: {
    temperature: number;
    condition: WeatherCondition;
    description: string;
    icon: string;
  };
  
  // Calendar context
  event: {
    type: EventType;
    name: string;
    icon: string;
    hasImportantEvent: boolean;
  };
  
  // Styling suggestions
  mainTip: string;
  tips: string[];
  
  // Jewelry recommendations
  recommendedJewelry: string[];
  avoidJewelry: string[];
  recommendedMetals: string[];
  
  // Look inspiration
  lookInspiration: string;
  moodKeywords: string[];
};

export type NotificationContent = {
  title: string;
  body: string;
  data: {
    type: "daily_suggestion";
    suggestionId: string;
    date: string;
  };
};

/**
 * Generate mood keywords based on weather and event
 */
function generateMoodKeywords(weather: WeatherData, eventType: EventType): string[] {
  const keywords: string[] = [];
  
  // Weather-based moods
  switch (weather.condition) {
    case "sunny":
    case "hot":
      keywords.push("lumineux", "éclatant", "radieux");
      break;
    case "cloudy":
    case "mild":
      keywords.push("élégant", "sophistiqué", "raffiné");
      break;
    case "rainy":
      keywords.push("cosy", "confortable", "douillet");
      break;
    case "snowy":
    case "cold":
      keywords.push("hivernal", "scintillant", "glacé");
      break;
    case "stormy":
      keywords.push("audacieux", "dramatique", "intense");
      break;
    case "foggy":
      keywords.push("mystérieux", "éthéré", "poétique");
      break;
    case "windy":
      keywords.push("dynamique", "libre", "moderne");
      break;
  }
  
  // Event-based moods
  switch (eventType) {
    case "work":
    case "meeting":
    case "interview":
    case "presentation":
      keywords.push("professionnel", "confiant", "sérieux");
      break;
    case "formal":
    case "wedding":
      keywords.push("glamour", "prestigieux", "chic");
      break;
    case "party":
      keywords.push("festif", "joyeux", "pétillant");
      break;
    case "date":
    case "dinner":
      keywords.push("romantique", "séduisant", "intime");
      break;
    case "casual":
    case "brunch":
    case "shopping":
      keywords.push("décontracté", "naturel", "spontané");
      break;
    case "sport":
      keywords.push("actif", "énergique", "sportif");
      break;
    case "travel":
      keywords.push("aventurier", "pratique", "polyvalent");
      break;
    case "none":
      keywords.push("libre", "créatif", "inspiré");
      break;
  }
  
  return keywords;
}

/**
 * Generate look inspiration text
 */
function generateLookInspiration(weather: WeatherData, eventType: EventType): string {
  const inspirations: Record<string, string[]> = {
    "sunny-work": [
      "Un look professionnel illuminé par des touches dorées",
      "L'élégance solaire d'une journée productive",
    ],
    "sunny-casual": [
      "Légèreté et brillance pour une journée ensoleillée",
      "Des bijoux qui captent la lumière du jour",
    ],
    "sunny-party": [
      "Éclat et festivité sous le soleil",
      "Brillez de mille feux pour cette célébration",
    ],
    "rainy-work": [
      "Élégance discrète pour affronter la pluie avec style",
      "Des bijoux résistants pour une journée productive",
    ],
    "rainy-casual": [
      "Confort et style pour une journée cosy",
      "Des touches de lumière pour égayer la grisaille",
    ],
    "cold-formal": [
      "Sophistication hivernale pour un événement mémorable",
      "L'éclat des cristaux pour une soirée glacée",
    ],
    "cold-casual": [
      "Chaleur et style pour braver le froid",
      "Des bijoux qui réchauffent le cœur",
    ],
    "default": [
      "Exprimez votre style unique aujourd'hui",
      "Laissez vos bijoux raconter votre histoire",
      "Une journée parfaite pour oser quelque chose de nouveau",
    ],
  };
  
  const key = `${weather.condition}-${eventType}`;
  const options = inspirations[key] || inspirations["default"];
  
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate main tip combining weather and event
 */
function generateMainTip(weather: WeatherData, eventType: EventType): string {
  // Priority: Important events first, then weather
  if (["interview", "presentation", "wedding", "formal"].includes(eventType)) {
    return `Journée importante ! ${getEventStylingTips(eventType)[0]}`;
  }
  
  if (["party", "date"].includes(eventType)) {
    return `${EVENT_TYPE_ICONS[eventType]} ${EVENT_TYPE_NAMES[eventType]} prévu(e) : ${getEventStylingTips(eventType)[0]}`;
  }
  
  // Weather-based main tip
  if (weather.condition === "rainy" || weather.condition === "stormy") {
    return `${weather.icon} Temps ${weather.description.toLowerCase()} : ${getWeatherStylingTips(weather)[0]}`;
  }
  
  if (weather.temperature >= 30) {
    return `🌡️ ${weather.temperature}°C : Privilégiez les bijoux légers et respirants`;
  }
  
  if (weather.temperature <= 5) {
    return `❄️ ${weather.temperature}°C : Optez pour des bijoux qui se voient sur vos tenues d'hiver`;
  }
  
  return `${weather.icon} ${weather.temperature}°C : ${getWeatherStylingTips(weather)[0]}`;
}

/**
 * Generate a complete daily suggestion
 */
export function generateDailySuggestion(
  weather: WeatherData,
  schedule: DaySchedule
): DailySuggestion {
  const { primaryEventType, hasImportantEvent } = schedule;
  
  // Get tips from both services
  const weatherTips = getWeatherStylingTips(weather);
  const eventTips = getEventStylingTips(primaryEventType);
  
  // Get jewelry recommendations
  const weatherRecs = getWeatherJewelryRecommendations(weather);
  const eventRecs = getEventJewelryRecommendations(primaryEventType);
  
  // Combine recommendations (event takes priority for important events)
  const recommendedJewelry = hasImportantEvent
    ? [...new Set([...eventRecs.recommended, ...weatherRecs.recommended])]
    : [...new Set([...weatherRecs.recommended, ...eventRecs.recommended])];
  
  const avoidJewelry = [...new Set([...weatherRecs.avoid, ...eventRecs.avoid])];
  const recommendedMetals = eventRecs.metals.length > 0 ? eventRecs.metals : ["Or", "Argent", "Or rose"];
  
  // Combine tips (limit to 4)
  const allTips = hasImportantEvent
    ? [...eventTips.slice(0, 2), ...weatherTips.slice(0, 2)]
    : [...weatherTips.slice(0, 2), ...eventTips.slice(0, 2)];
  
  const suggestion: DailySuggestion = {
    id: `suggestion-${Date.now()}`,
    date: new Date(),
    title: hasImportantEvent
      ? `${EVENT_TYPE_ICONS[primaryEventType]} ${EVENT_TYPE_NAMES[primaryEventType]}`
      : `${weather.icon} ${weather.description}`,
    subtitle: hasImportantEvent
      ? `${weather.icon} ${weather.temperature}°C - ${weather.description}`
      : `${EVENT_TYPE_ICONS[primaryEventType]} ${EVENT_TYPE_NAMES[primaryEventType]}`,
    icon: hasImportantEvent ? EVENT_TYPE_ICONS[primaryEventType] : weather.icon,
    
    weather: {
      temperature: weather.temperature,
      condition: weather.condition,
      description: weather.description,
      icon: weather.icon,
    },
    
    event: {
      type: primaryEventType,
      name: EVENT_TYPE_NAMES[primaryEventType],
      icon: EVENT_TYPE_ICONS[primaryEventType],
      hasImportantEvent,
    },
    
    mainTip: generateMainTip(weather, primaryEventType),
    tips: allTips.slice(0, 4),
    
    recommendedJewelry: recommendedJewelry.slice(0, 4),
    avoidJewelry: avoidJewelry.slice(0, 3),
    recommendedMetals,
    
    lookInspiration: generateLookInspiration(weather, primaryEventType),
    moodKeywords: generateMoodKeywords(weather, primaryEventType),
  };
  
  return suggestion;
}

/**
 * Generate notification content from a daily suggestion
 */
export function generateNotificationContent(suggestion: DailySuggestion): NotificationContent {
  const title = suggestion.event.hasImportantEvent
    ? `${suggestion.event.icon} ${suggestion.event.name} aujourd'hui !`
    : `${suggestion.weather.icon} Votre look du jour`;
  
  const body = suggestion.mainTip;
  
  return {
    title,
    body,
    data: {
      type: "daily_suggestion",
      suggestionId: suggestion.id,
      date: suggestion.date.toISOString(),
    },
  };
}

/**
 * Generate a quick morning greeting based on time and weather
 */
export function generateMorningGreeting(weather: WeatherData): string {
  const hour = new Date().getHours();
  
  let greeting = "";
  if (hour < 12) {
    greeting = "Bonjour";
  } else if (hour < 18) {
    greeting = "Bon après-midi";
  } else {
    greeting = "Bonsoir";
  }
  
  const weatherGreetings: Record<WeatherCondition, string[]> = {
    sunny: ["Quelle belle journée ensoleillée !", "Le soleil brille pour vous !"],
    hot: ["Il fait chaud aujourd'hui !", "Journée estivale en perspective !"],
    cloudy: ["Journée nuageuse mais pleine de possibilités !", "Un temps parfait pour briller !"],
    mild: ["Une température idéale aujourd'hui !", "Journée agréable en vue !"],
    rainy: ["N'oubliez pas votre parapluie !", "La pluie n'arrêtera pas votre style !"],
    snowy: ["Journée enneigée magique !", "La neige crée une ambiance féerique !"],
    stormy: ["Temps orageux, restez au chaud !", "L'orage passera, votre style restera !"],
    foggy: ["Journée mystérieuse et poétique !", "Le brouillard ajoute du mystère !"],
    windy: ["Attention au vent aujourd'hui !", "Journée dynamique en perspective !"],
    cold: ["Couvrez-vous bien !", "Le froid est là, réchauffez votre style !"],
  };
  
  const weatherMessage = weatherGreetings[weather.condition][
    Math.floor(Math.random() * weatherGreetings[weather.condition].length)
  ];
  
  return `${greeting} ! ${weatherMessage}`;
}

/**
 * Notification scheduling times
 */
export const NOTIFICATION_TIMES = {
  morning: { hour: 8, minute: 0 },
  evening: { hour: 20, minute: 0 },
} as const;

/**
 * Get the next notification time
 */
export function getNextNotificationTime(preferredTime: "morning" | "evening" = "morning"): Date {
  const now = new Date();
  const next = new Date();
  
  const { hour, minute } = NOTIFICATION_TIMES[preferredTime];
  next.setHours(hour, minute, 0, 0);
  
  // If the time has passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}
