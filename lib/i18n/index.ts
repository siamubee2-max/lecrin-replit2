/**
 * Internationalization (i18n) module
 * Supports French (default), English, Spanish, German, Italian, and Portuguese
 */

import { fr } from "./fr";
import { en } from "./en";
import { es } from "./es";
import { de } from "./de";
import { it } from "./it";
import { pt } from "./pt";

export { fr, type TranslationKeys } from "./fr";
export { en } from "./en";
export { es } from "./es";
export { de } from "./de";
export { it } from "./it";
export { pt } from "./pt";

export type Language = "fr" | "en" | "es" | "de" | "it" | "pt";

export const translations = {
  fr,
  en,
  es,
  de,
  it,
  pt,
} as const;

export const languageNames: Record<Language, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

export const languageFlags: Record<Language, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇵🇹",
};

export const defaultLanguage: Language = "fr";

/**
 * Get translation for a specific language
 */
export function getTranslation(lang: Language) {
  return translations[lang] || translations[defaultLanguage];
}
