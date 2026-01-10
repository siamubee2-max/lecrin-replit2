/**
 * Daily Look Suggestion Types
 * Separated from main service to avoid expo-location import in tests
 */

import {
  WeatherData,
  WeatherCondition,
  getWeatherStylingTips,
  getWeatherJewelryRecommendations,
} from "./weather-types";

import {
  EventType,
  DaySchedule,
  getEventStylingTips,
  getEventJewelryRecommendations,
  EVENT_TYPE_NAMES,
  EVENT_TYPE_ICONS,
} from "./calendar-service";

export type DailySuggestion = {
  date: Date;
  weather: {
    temperature: number;
    condition: WeatherCondition;
    description: string;
    icon: string;
  };
  event: {
    type: EventType;
    name: string;
    icon: string;
  };
  mainTip: string;
  tips: string[];
  recommendedJewelry: string[];
  recommendedMetals: string[];
  avoidJewelry: string[];
  moodKeywords: string[];
  lookInspiration: string;
};

// Notification times
export const NOTIFICATION_TIMES = {
  morning: { hour: 8, minute: 0 },
  evening: { hour: 20, minute: 0 },
};

// Mood keywords based on weather and event
const MOOD_KEYWORDS: Record<WeatherCondition, string[]> = {
  sunny: ["lumineux", "radieux", "éclatant", "solaire"],
  cloudy: ["doux", "subtil", "nuancé", "élégant"],
  rainy: ["cozy", "intimiste", "raffiné", "discret"],
  snowy: ["féerique", "pur", "cristallin", "hivernal"],
  stormy: ["audacieux", "dramatique", "intense", "puissant"],
  foggy: ["mystérieux", "éthéré", "poétique", "rêveur"],
  windy: ["dynamique", "libre", "aérien", "fluide"],
  hot: ["léger", "frais", "estival", "décontracté"],
  cold: ["chaleureux", "cocooning", "douillet", "réconfortant"],
  mild: ["équilibré", "harmonieux", "polyvalent", "classique"],
};

// Look inspirations based on event type
const LOOK_INSPIRATIONS: Record<EventType, string[]> = {
  none: [
    "Un look décontracté mais soigné pour profiter de la journée",
    "L'élégance du quotidien avec des pièces intemporelles",
    "Simplicité et raffinement pour une journée sereine",
  ],
  work: [
    "Professionnalisme et style avec des bijoux discrets mais remarquables",
    "L'art de se démarquer subtilement au bureau",
    "Confiance et élégance pour une journée productive",
  ],
  meeting: [
    "Des bijoux qui inspirent confiance et crédibilité",
    "L'équilibre parfait entre autorité et accessibilité",
    "Un look mémorable pour des discussions importantes",
  ],
  interview: [
    "Première impression impeccable avec des bijoux classiques",
    "Sobriété et personnalité pour vous démarquer",
    "L'élégance qui rassure et inspire confiance",
  ],
  presentation: [
    "Des bijoux qui captent l'attention sans distraire",
    "Charisme et professionnalisme pour captiver votre audience",
    "L'art de briller tout en restant accessible",
  ],
  casual: [
    "Décontraction chic avec des pièces tendance",
    "L'art du style sans effort apparent",
    "Confort et élégance pour un moment détente",
  ],
  formal: [
    "Sophistication et glamour pour une occasion spéciale",
    "L'éclat des grandes occasions",
    "Élégance intemporelle pour un événement mémorable",
  ],
  party: [
    "Brillez de mille feux sur la piste de danse",
    "Audace et fantaisie pour une soirée inoubliable",
    "L'art de faire la fête avec style",
  ],
  date: [
    "Romance et séduction avec des bijoux délicats",
    "L'élégance qui fait battre les cœurs",
    "Charme et mystère pour une soirée romantique",
  ],
  dinner: [
    "Raffinement et convivialité pour un dîner réussi",
    "L'art de la table se prolonge dans vos bijoux",
    "Élégance gourmande pour savourer chaque instant",
  ],
  brunch: [
    "Fraîcheur et légèreté pour un brunch ensoleillé",
    "Style décontracté-chic pour un moment de partage",
    "L'art du dimanche matin avec élégance",
  ],
  wedding: [
    "Éclat et émotion pour célébrer l'amour",
    "Des bijoux qui honorent ce jour unique",
    "L'élégance des grandes célébrations",
  ],
  shopping: [
    "Praticité et style pour une session shopping réussie",
    "Des bijoux qui vous inspirent de nouveaux looks",
    "L'art de shopper avec élégance",
  ],
  travel: [
    "Aventure et style pour découvrir le monde",
    "Des bijoux qui racontent vos voyages",
    "L'élégance nomade pour explorer en beauté",
  ],
  sport: [
    "Performance et style même pendant l'effort",
    "Des bijoux discrets qui vous accompagnent",
    "L'art de rester élégante en mouvement",
  ],
};

// Main tips based on weather and event combination
function generateMainTip(weather: WeatherData, eventType: EventType): string {
  const weatherTips: Record<WeatherCondition, string> = {
    sunny: "Profitez du soleil avec des bijoux qui captent la lumière",
    cloudy: "Apportez de la luminosité avec des bijoux dorés",
    rainy: "Optez pour des bijoux résistants à l'humidité",
    snowy: "Harmonisez vos bijoux avec le paysage hivernal",
    stormy: "Restez sobre et élégante malgré le temps",
    foggy: "Démarquez-vous avec des bijoux lumineux",
    windy: "Privilégiez les bijoux courts et sécurisés",
    hot: "Restez fraîche avec des bijoux légers",
    cold: "Réchauffez votre look avec des tons dorés",
    mild: "Tous les styles sont permis aujourd'hui",
  };

  const eventTips: Record<string, string> = {
    none: "pour une journée décontractée",
    work: "tout en restant professionnelle",
    meeting: "pour inspirer confiance",
    interview: "pour faire bonne impression",
    presentation: "pour captiver votre audience",
    casual: "pour un look sans effort",
    formal: "pour briller en société",
    party: "pour faire la fête avec style",
    date: "pour séduire avec élégance",
    dinner: "pour un dîner raffiné",
    brunch: "pour un moment convivial",
    wedding: "pour célébrer avec éclat",
    shopping: "pour shopper avec style",
    travel: "pour voyager élégamment",
    sport: "même pendant l'effort",
  };

  return `${weatherTips[weather.condition]} ${eventTips[eventType as EventType]}.`;
}

/**
 * Generate a daily suggestion based on weather and event
 */
export function generateDailySuggestion(
  weather: WeatherData,
  schedule: DaySchedule
): DailySuggestion {
  const eventType = schedule.primaryEventType || "none";
  const weatherTips = getWeatherStylingTips(weather);
  const eventTips = getEventStylingTips(eventType);
  const weatherJewelry = getWeatherJewelryRecommendations(weather);
  const eventJewelry = getEventJewelryRecommendations(eventType);

  // Combine tips (max 4)
  const allTips = [...weatherTips, ...eventTips];
  const tips = allTips.slice(0, 4);

  // Combine jewelry recommendations (unique items)
  const recommendedJewelry = [
    ...new Set([...weatherJewelry.recommended, ...eventJewelry.recommended]),
  ].slice(0, 5);

  // Combine avoid items (unique)
  const avoidJewelry = [
    ...new Set([...weatherJewelry.avoid, ...eventJewelry.avoid]),
  ].slice(0, 3);

  // Get mood keywords
  const moodKeywords = MOOD_KEYWORDS[weather.condition] || MOOD_KEYWORDS.mild;

  // Get look inspiration
  const inspirations = LOOK_INSPIRATIONS[eventType as EventType] || LOOK_INSPIRATIONS.none;
  const lookInspiration =
    inspirations[Math.floor(Math.random() * inspirations.length)];

  // Recommended metals based on weather
  const recommendedMetals = getRecommendedMetals(weather.condition);

  return {
    date: new Date(),
    weather: {
      temperature: weather.temperature,
      condition: weather.condition,
      description: weather.description,
      icon: weather.icon,
    },
    event: {
      type: eventType,
      name: EVENT_TYPE_NAMES[eventType],
      icon: EVENT_TYPE_ICONS[eventType],
    },
    mainTip: generateMainTip(weather, eventType),
    tips,
    recommendedJewelry,
    recommendedMetals,
    avoidJewelry,
    moodKeywords: moodKeywords.slice(0, 3),
    lookInspiration,
  };
}

/**
 * Get recommended metals based on weather
 */
function getRecommendedMetals(condition: WeatherCondition): string[] {
  const metalRecommendations: Record<WeatherCondition, string[]> = {
    sunny: ["Or jaune", "Or rose", "Vermeil"],
    cloudy: ["Or jaune", "Or rose", "Bronze"],
    rainy: ["Or massif", "Platine", "Acier inoxydable"],
    snowy: ["Argent", "Or blanc", "Platine"],
    stormy: ["Acier", "Titane", "Or blanc"],
    foggy: ["Or jaune", "Vermeil", "Laiton doré"],
    windy: ["Or", "Argent", "Acier"],
    hot: ["Argent", "Or blanc", "Platine"],
    cold: ["Or jaune", "Or rose", "Bronze"],
    mild: ["Or", "Argent", "Or rose"],
  };

  return metalRecommendations[condition] || metalRecommendations.mild;
}

/**
 * Generate notification content
 */
export function generateNotificationContent(suggestion: DailySuggestion): {
  title: string;
  body: string;
} {
  const title = `✨ Votre look du jour - ${suggestion.weather.icon} ${suggestion.weather.temperature}°C`;
  const body = suggestion.mainTip;

  return { title, body };
}

/**
 * Generate morning greeting
 */
export function generateMorningGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

/**
 * Get next notification time
 */
export function getNextNotificationTime(
  time: "morning" | "evening"
): Date {
  const now = new Date();
  const notificationTime = NOTIFICATION_TIMES[time];
  
  const next = new Date(now);
  next.setHours(notificationTime.hour, notificationTime.minute, 0, 0);
  
  // If the time has passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next;
}
