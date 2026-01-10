/**
 * Internationalization (i18n) module
 * Supports French (default), English, and Spanish
 */

export { fr, type TranslationKeys } from "./fr";
export { en } from "./en";
export { es } from "./es";

import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";

export type Language = "fr" | "en" | "es";

export const translations = {
  fr,
  en,
  es,
} as const;

export const languageNames: Record<Language, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export const languageFlags: Record<Language, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
};

export const defaultLanguage: Language = "fr";

/**
 * Get translation for a specific language
 */
export function getTranslation(lang: Language) {
  return translations[lang] || translations[defaultLanguage];
}
