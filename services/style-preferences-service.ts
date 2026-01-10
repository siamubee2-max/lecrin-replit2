/**
 * Style Preferences Service
 * Manages user style preferences for personalized jewelry recommendations
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const STYLE_PREFERENCES_KEY = "@ecrin_style_preferences";
const TRYONS_HISTORY_KEY = "@ecrin_tryons_history";
const WISHLIST_KEY = "@ecrin_wishlist";

// Types
export type MetalPreference = "gold" | "silver" | "rose_gold" | "platinum" | "mixed";
export type StonePreference = "diamond" | "ruby" | "emerald" | "sapphire" | "pearl" | "none";
export type StyleType = "classic" | "modern" | "bohemian" | "minimalist" | "glamorous" | "vintage";
export type OccasionType = "everyday" | "work" | "evening" | "wedding" | "casual" | "sport";
export type BudgetRange = "budget" | "mid_range" | "premium" | "luxury";

export interface StylePreferences {
  // Metal preferences
  preferredMetals: MetalPreference[];
  
  // Stone preferences
  preferredStones: StonePreference[];
  
  // Style preferences
  preferredStyles: StyleType[];
  
  // Occasion preferences
  preferredOccasions: OccasionType[];
  
  // Budget range
  budgetRange: BudgetRange;
  
  // Skin tone for color matching
  skinTone: "light" | "medium" | "olive" | "tan" | "dark";
  
  // Jewelry size preferences
  sizePreferences: {
    rings: string; // e.g., "52", "54"
    bracelets: string; // e.g., "16cm", "18cm"
    necklaces: string; // e.g., "40cm", "45cm"
  };
  
  // Allergies
  allergies: string[];
  
  // Last updated
  updatedAt: string;
}

export interface TryOnHistoryItem {
  id: string;
  jewelryType: string;
  jewelryStyle: string;
  jewelryIcon: string;
  modelType: string;
  modelName: string;
  imageUri?: string;
  createdAt: string;
  duration: number; // seconds spent on this try-on
  liked: boolean;
  shared: boolean;
}

export interface WishlistItem {
  id: string;
  name: string;
  type: string;
  metal: string;
  stone?: string;
  price?: number;
  currency?: string;
  imageUri?: string;
  brandName?: string;
  brandId?: string;
  externalUrl?: string;
  notes?: string;
  priority: "high" | "medium" | "low";
  addedAt: string;
}

// Default preferences
export const DEFAULT_STYLE_PREFERENCES: StylePreferences = {
  preferredMetals: ["gold"],
  preferredStones: [],
  preferredStyles: ["classic"],
  preferredOccasions: ["everyday"],
  budgetRange: "mid_range",
  skinTone: "medium",
  sizePreferences: {
    rings: "",
    bracelets: "",
    necklaces: "",
  },
  allergies: [],
  updatedAt: new Date().toISOString(),
};

// Metal display names
export const METAL_NAMES: Record<MetalPreference, string> = {
  gold: "Or jaune",
  silver: "Argent",
  rose_gold: "Or rose",
  platinum: "Platine",
  mixed: "Mixte",
};

// Metal icons
export const METAL_ICONS: Record<MetalPreference, string> = {
  gold: "🥇",
  silver: "🥈",
  rose_gold: "🌸",
  platinum: "💎",
  mixed: "✨",
};

// Stone display names
export const STONE_NAMES: Record<StonePreference, string> = {
  diamond: "Diamant",
  ruby: "Rubis",
  emerald: "Émeraude",
  sapphire: "Saphir",
  pearl: "Perle",
  none: "Sans pierre",
};

// Stone icons
export const STONE_ICONS: Record<StonePreference, string> = {
  diamond: "💎",
  ruby: "❤️",
  emerald: "💚",
  sapphire: "💙",
  pearl: "🤍",
  none: "⭕",
};

// Style display names
export const STYLE_NAMES: Record<StyleType, string> = {
  classic: "Classique",
  modern: "Moderne",
  bohemian: "Bohème",
  minimalist: "Minimaliste",
  glamorous: "Glamour",
  vintage: "Vintage",
};

// Style icons
export const STYLE_ICONS: Record<StyleType, string> = {
  classic: "👑",
  modern: "🔷",
  bohemian: "🌻",
  minimalist: "◻️",
  glamorous: "✨",
  vintage: "🕰️",
};

// Occasion display names
export const OCCASION_NAMES: Record<OccasionType, string> = {
  everyday: "Quotidien",
  work: "Travail",
  evening: "Soirée",
  wedding: "Mariage",
  casual: "Décontracté",
  sport: "Sport",
};

// Occasion icons
export const OCCASION_ICONS: Record<OccasionType, string> = {
  everyday: "☀️",
  work: "💼",
  evening: "🌙",
  wedding: "💒",
  casual: "👕",
  sport: "🏃",
};

// Budget display names
export const BUDGET_NAMES: Record<BudgetRange, string> = {
  budget: "Économique (< 100€)",
  mid_range: "Moyen (100€ - 500€)",
  premium: "Premium (500€ - 2000€)",
  luxury: "Luxe (> 2000€)",
};

// Skin tone display names
export const SKIN_TONE_NAMES: Record<StylePreferences["skinTone"], string> = {
  light: "Claire",
  medium: "Moyenne",
  olive: "Olive",
  tan: "Hâlée",
  dark: "Foncée",
};

// Priority display names
export const PRIORITY_NAMES: Record<WishlistItem["priority"], string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

// Priority icons
export const PRIORITY_ICONS: Record<WishlistItem["priority"], string> = {
  high: "🔥",
  medium: "⭐",
  low: "💫",
};

/**
 * Load style preferences from storage
 */
export async function loadStylePreferences(): Promise<StylePreferences> {
  try {
    const data = await AsyncStorage.getItem(STYLE_PREFERENCES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_STYLE_PREFERENCES;
  } catch (error) {
    console.error("Error loading style preferences:", error);
    return DEFAULT_STYLE_PREFERENCES;
  }
}

/**
 * Save style preferences to storage
 */
export async function saveStylePreferences(preferences: StylePreferences): Promise<void> {
  try {
    const updated = {
      ...preferences,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STYLE_PREFERENCES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving style preferences:", error);
    throw error;
  }
}

/**
 * Load try-on history from storage
 */
export async function loadTryOnHistory(): Promise<TryOnHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(TRYONS_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error loading try-on history:", error);
    return [];
  }
}

/**
 * Save try-on history to storage
 */
export async function saveTryOnHistory(history: TryOnHistoryItem[]): Promise<void> {
  try {
    // Keep only the last 100 items
    const trimmed = history.slice(0, 100);
    await AsyncStorage.setItem(TRYONS_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Error saving try-on history:", error);
    throw error;
  }
}

/**
 * Add a try-on to history
 */
export async function addTryOnToHistory(item: Omit<TryOnHistoryItem, "id" | "createdAt">): Promise<TryOnHistoryItem> {
  const history = await loadTryOnHistory();
  const newItem: TryOnHistoryItem = {
    ...item,
    id: `tryon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  // Add to beginning of array
  history.unshift(newItem);
  await saveTryOnHistory(history);
  
  return newItem;
}

/**
 * Remove a try-on from history
 */
export async function removeTryOnFromHistory(id: string): Promise<void> {
  const history = await loadTryOnHistory();
  const filtered = history.filter((item) => item.id !== id);
  await saveTryOnHistory(filtered);
}

/**
 * Clear all try-on history
 */
export async function clearTryOnHistory(): Promise<void> {
  await AsyncStorage.removeItem(TRYONS_HISTORY_KEY);
}

/**
 * Load wishlist from storage
 */
export async function loadWishlist(): Promise<WishlistItem[]> {
  try {
    const data = await AsyncStorage.getItem(WISHLIST_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error("Error loading wishlist:", error);
    return [];
  }
}

/**
 * Save wishlist to storage
 */
export async function saveWishlist(wishlist: WishlistItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  } catch (error) {
    console.error("Error saving wishlist:", error);
    throw error;
  }
}

/**
 * Add an item to wishlist
 */
export async function addToWishlist(item: Omit<WishlistItem, "id" | "addedAt">): Promise<WishlistItem> {
  const wishlist = await loadWishlist();
  const newItem: WishlistItem = {
    ...item,
    id: `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    addedAt: new Date().toISOString(),
  };
  
  wishlist.unshift(newItem);
  await saveWishlist(wishlist);
  
  return newItem;
}

/**
 * Update a wishlist item
 */
export async function updateWishlistItem(id: string, updates: Partial<WishlistItem>): Promise<void> {
  const wishlist = await loadWishlist();
  const index = wishlist.findIndex((item) => item.id === id);
  
  if (index !== -1) {
    wishlist[index] = { ...wishlist[index], ...updates };
    await saveWishlist(wishlist);
  }
}

/**
 * Remove an item from wishlist
 */
export async function removeFromWishlist(id: string): Promise<void> {
  const wishlist = await loadWishlist();
  const filtered = wishlist.filter((item) => item.id !== id);
  await saveWishlist(filtered);
}

/**
 * Clear all wishlist items
 */
export async function clearWishlist(): Promise<void> {
  await AsyncStorage.removeItem(WISHLIST_KEY);
}

/**
 * Get try-on statistics
 */
export async function getTryOnStats(): Promise<{
  totalTryOns: number;
  likedCount: number;
  sharedCount: number;
  averageDuration: number;
  mostTriedType: string | null;
  mostTriedStyle: string | null;
}> {
  const history = await loadTryOnHistory();
  
  if (history.length === 0) {
    return {
      totalTryOns: 0,
      likedCount: 0,
      sharedCount: 0,
      averageDuration: 0,
      mostTriedType: null,
      mostTriedStyle: null,
    };
  }
  
  const likedCount = history.filter((item) => item.liked).length;
  const sharedCount = history.filter((item) => item.shared).length;
  const totalDuration = history.reduce((sum, item) => sum + item.duration, 0);
  const averageDuration = Math.round(totalDuration / history.length);
  
  // Count jewelry types
  const typeCounts: Record<string, number> = {};
  history.forEach((item) => {
    typeCounts[item.jewelryType] = (typeCounts[item.jewelryType] || 0) + 1;
  });
  const mostTriedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Count jewelry styles
  const styleCounts: Record<string, number> = {};
  history.forEach((item) => {
    styleCounts[item.jewelryStyle] = (styleCounts[item.jewelryStyle] || 0) + 1;
  });
  const mostTriedStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  return {
    totalTryOns: history.length,
    likedCount,
    sharedCount,
    averageDuration,
    mostTriedType,
    mostTriedStyle,
  };
}

/**
 * Get personalized recommendations based on preferences and history
 */
export async function getPersonalizedRecommendations(): Promise<{
  recommendedMetals: MetalPreference[];
  recommendedStones: StonePreference[];
  recommendedStyles: StyleType[];
  basedOn: string;
}> {
  const preferences = await loadStylePreferences();
  const history = await loadTryOnHistory();
  
  // Start with user preferences
  let recommendedMetals = [...preferences.preferredMetals];
  let recommendedStones = [...preferences.preferredStones];
  let recommendedStyles = [...preferences.preferredStyles];
  
  // Enhance with history data if available
  if (history.length > 0) {
    const likedItems = history.filter((item) => item.liked);
    
    if (likedItems.length > 0) {
      // Analyze liked items for patterns
      const styleCounts: Record<string, number> = {};
      likedItems.forEach((item) => {
        styleCounts[item.jewelryStyle] = (styleCounts[item.jewelryStyle] || 0) + 1;
      });
      
      // Add top styles from liked items
      const topStyles = Object.entries(styleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([style]) => style as StyleType);
      
      recommendedStyles = [...new Set([...recommendedStyles, ...topStyles])].slice(0, 3);
    }
  }
  
  const basedOn = history.length > 0 
    ? "Basé sur vos préférences et votre historique d'essayages"
    : "Basé sur vos préférences de style";
  
  return {
    recommendedMetals,
    recommendedStones,
    recommendedStyles,
    basedOn,
  };
}
