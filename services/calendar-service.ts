/**
 * Calendar Service
 * Provides calendar event information for styling suggestions
 * Uses device calendar via expo-calendar (optional) or manual event types
 */

export type EventType = 
  | "work"
  | "meeting"
  | "casual"
  | "formal"
  | "party"
  | "date"
  | "wedding"
  | "sport"
  | "travel"
  | "interview"
  | "presentation"
  | "dinner"
  | "brunch"
  | "shopping"
  | "none";

export type CalendarEvent = {
  id: string;
  title: string;
  type: EventType;
  startTime: Date;
  endTime?: Date;
  location?: string;
  isAllDay: boolean;
};

export type DaySchedule = {
  date: Date;
  events: CalendarEvent[];
  primaryEventType: EventType;
  hasImportantEvent: boolean;
};

/**
 * Keywords to detect event types from event titles
 */
const EVENT_TYPE_KEYWORDS: Record<EventType, string[]> = {
  work: ["travail", "bureau", "office", "work", "boulot"],
  meeting: ["réunion", "meeting", "rendez-vous", "rdv", "call", "visio", "zoom", "teams"],
  casual: ["café", "coffee", "ami", "friend", "balade", "promenade", "walk"],
  formal: ["gala", "cérémonie", "ceremony", "officiel", "official", "remise"],
  party: ["fête", "party", "soirée", "anniversaire", "birthday", "célébration"],
  date: ["dîner", "dinner", "date", "romantique", "romantic", "sortie"],
  wedding: ["mariage", "wedding", "fiançailles", "engagement"],
  sport: ["sport", "gym", "yoga", "fitness", "course", "running", "natation", "swimming"],
  travel: ["voyage", "travel", "avion", "flight", "train", "vacances", "holiday"],
  interview: ["entretien", "interview", "recrutement", "embauche"],
  presentation: ["présentation", "presentation", "pitch", "démo", "demo", "conférence"],
  dinner: ["dîner", "dinner", "restaurant", "repas"],
  brunch: ["brunch", "petit-déjeuner", "breakfast", "déjeuner", "lunch"],
  shopping: ["shopping", "courses", "magasin", "boutique", "store", "achats"],
  none: [],
};

/**
 * Detect event type from event title
 */
export function detectEventType(title: string): EventType {
  const lowerTitle = title.toLowerCase();
  
  for (const [type, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    if (type === "none") continue;
    
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) {
        return type as EventType;
      }
    }
  }
  
  return "casual"; // Default to casual if no match
}

/**
 * Get styling suggestions based on event type
 */
export function getEventStylingTips(eventType: EventType): string[] {
  const tips: string[] = [];
  
  switch (eventType) {
    case "work":
    case "meeting":
      tips.push("Optez pour des bijoux discrets et professionnels");
      tips.push("Les perles et les métaux classiques (or, argent) sont parfaits");
      tips.push("Évitez les bijoux trop voyants ou bruyants");
      tips.push("Une montre élégante complète parfaitement la tenue");
      break;
      
    case "interview":
    case "presentation":
      tips.push("Choisissez des bijoux simples qui inspirent confiance");
      tips.push("Une paire de boucles d'oreilles discrètes est idéale");
      tips.push("Évitez les bracelets qui cliquettent pendant que vous parlez");
      tips.push("Un collier fin peut ajouter une touche d'élégance");
      break;
      
    case "formal":
    case "wedding":
      tips.push("C'est le moment de sortir vos plus belles pièces");
      tips.push("Les parures complètes sont parfaites pour les événements formels");
      tips.push("Les pierres précieuses et les diamants sont de mise");
      tips.push("Coordonnez vos bijoux avec votre tenue");
      break;
      
    case "party":
      tips.push("Osez les bijoux statement et les pièces audacieuses");
      tips.push("Les bijoux brillants et scintillants sont parfaits");
      tips.push("Superposez les colliers et les bracelets pour un look festif");
      tips.push("Les boucles d'oreilles pendantes ajoutent du mouvement");
      break;
      
    case "date":
    case "dinner":
      tips.push("Choisissez des bijoux romantiques et féminins");
      tips.push("Les pierres de couleur ajoutent une touche de mystère");
      tips.push("Un collier qui attire le regard vers le visage est idéal");
      tips.push("Les boucles d'oreilles qui encadrent le visage sont flatteuses");
      break;
      
    case "casual":
    case "brunch":
    case "shopping":
      tips.push("Portez vos bijoux du quotidien préférés");
      tips.push("Les bijoux bohèmes et naturels sont parfaits");
      tips.push("Superposez les bracelets pour un look décontracté");
      tips.push("Les créoles sont un classique casual");
      break;
      
    case "sport":
      tips.push("Retirez vos bijoux pour éviter les blessures");
      tips.push("Si vous devez porter quelque chose, optez pour des puces d'oreilles");
      tips.push("Les montres de sport sont une bonne alternative");
      tips.push("Évitez les colliers et bracelets pendant l'exercice");
      break;
      
    case "travel":
      tips.push("Choisissez des bijoux polyvalents et faciles à porter");
      tips.push("Évitez les bijoux de grande valeur en voyage");
      tips.push("Les bijoux minimalistes passent facilement la sécurité");
      tips.push("Privilégiez les pièces qui vont avec tout");
      break;
      
    case "none":
    default:
      tips.push("Portez ce qui vous fait plaisir aujourd'hui");
      tips.push("C'est le moment d'expérimenter de nouveaux styles");
      tips.push("Essayez une pièce que vous ne portez pas souvent");
      break;
  }
  
  return tips;
}

/**
 * Get recommended jewelry types based on event
 */
export function getEventJewelryRecommendations(eventType: EventType): {
  recommended: string[];
  avoid: string[];
  metals: string[];
} {
  const recommendations = {
    recommended: [] as string[],
    avoid: [] as string[],
    metals: [] as string[],
  };
  
  switch (eventType) {
    case "work":
    case "meeting":
    case "interview":
    case "presentation":
      recommendations.recommended = ["Boucles d'oreilles discrètes", "Collier fin", "Montre élégante", "Bague simple"];
      recommendations.avoid = ["Bijoux bruyants", "Pièces trop voyantes", "Bracelets multiples"];
      recommendations.metals = ["Or", "Argent", "Or rose"];
      break;
      
    case "formal":
    case "wedding":
      recommendations.recommended = ["Parure complète", "Collier statement", "Boucles pendantes", "Bracelet tennis"];
      recommendations.avoid = ["Bijoux fantaisie", "Pièces trop décontractées"];
      recommendations.metals = ["Or", "Platine", "Or blanc"];
      break;
      
    case "party":
      recommendations.recommended = ["Boucles chandelier", "Colliers superposés", "Bracelets multiples", "Bagues cocktail"];
      recommendations.avoid = ["Bijoux trop discrets"];
      recommendations.metals = ["Or", "Or rose", "Métaux mixtes"];
      break;
      
    case "date":
    case "dinner":
      recommendations.recommended = ["Boucles d'oreilles romantiques", "Collier délicat", "Bracelet fin", "Bague avec pierre"];
      recommendations.avoid = ["Bijoux trop imposants", "Pièces bruyantes"];
      recommendations.metals = ["Or rose", "Or", "Argent"];
      break;
      
    case "casual":
    case "brunch":
    case "shopping":
      recommendations.recommended = ["Créoles", "Collier bohème", "Bracelets superposés", "Bagues empilables"];
      recommendations.avoid = [];
      recommendations.metals = ["Or", "Argent", "Vermeil"];
      break;
      
    case "sport":
      recommendations.recommended = ["Puces d'oreilles", "Montre sport"];
      recommendations.avoid = ["Colliers", "Bracelets", "Boucles pendantes", "Bagues"];
      recommendations.metals = [];
      break;
      
    case "travel":
      recommendations.recommended = ["Bijoux minimalistes", "Pièces polyvalentes", "Boucles simples"];
      recommendations.avoid = ["Bijoux de valeur", "Pièces fragiles"];
      recommendations.metals = ["Acier", "Or", "Argent"];
      break;
      
    case "none":
    default:
      recommendations.recommended = ["Tout ce qui vous plaît"];
      recommendations.avoid = [];
      recommendations.metals = ["Or", "Argent", "Or rose"];
      break;
  }
  
  return recommendations;
}

/**
 * Create a manual event (for users without calendar access)
 */
export function createManualEvent(
  title: string,
  type: EventType,
  date: Date = new Date()
): CalendarEvent {
  return {
    id: `manual-${Date.now()}`,
    title,
    type,
    startTime: date,
    isAllDay: true,
  };
}

/**
 * Get today's schedule with a primary event type
 */
export function getTodaySchedule(events: CalendarEvent[]): DaySchedule {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });
  
  // Determine primary event type (most important event of the day)
  const eventPriority: EventType[] = [
    "interview",
    "presentation",
    "wedding",
    "formal",
    "meeting",
    "date",
    "dinner",
    "party",
    "work",
    "brunch",
    "casual",
    "shopping",
    "travel",
    "sport",
    "none",
  ];
  
  let primaryEventType: EventType = "none";
  let hasImportantEvent = false;
  
  for (const priority of eventPriority) {
    if (todayEvents.some(e => e.type === priority)) {
      primaryEventType = priority;
      hasImportantEvent = ["interview", "presentation", "wedding", "formal", "meeting", "date"].includes(priority);
      break;
    }
  }
  
  return {
    date: today,
    events: todayEvents,
    primaryEventType,
    hasImportantEvent,
  };
}

/**
 * Event type display names (French)
 */
export const EVENT_TYPE_NAMES: Record<EventType, string> = {
  work: "Travail",
  meeting: "Réunion",
  casual: "Casual",
  formal: "Événement formel",
  party: "Fête",
  date: "Rendez-vous",
  wedding: "Mariage",
  sport: "Sport",
  travel: "Voyage",
  interview: "Entretien",
  presentation: "Présentation",
  dinner: "Dîner",
  brunch: "Brunch",
  shopping: "Shopping",
  none: "Journée libre",
};

/**
 * Event type icons
 */
export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  work: "💼",
  meeting: "📅",
  casual: "☕",
  formal: "🎩",
  party: "🎉",
  date: "💕",
  wedding: "💒",
  sport: "🏃",
  travel: "✈️",
  interview: "🤝",
  presentation: "📊",
  dinner: "🍽️",
  brunch: "🥐",
  shopping: "🛍️",
  none: "🌟",
};
