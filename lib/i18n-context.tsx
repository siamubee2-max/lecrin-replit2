/**
 * Internationalization Context
 * Provides language selection and translation functions throughout the app
 * 
 * Language resolution priority:
 * 1. User's explicit choice (saved in AsyncStorage)
 * 2. Device system language (via expo-localization)
 * 3. French (default fallback)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import {
  Language,
  TranslationKeys,
  translations,
  defaultLanguage,
  languageNames,
  languageFlags,
} from "./i18n";

const LANGUAGE_STORAGE_KEY = "@ecrin_virtuel_language";
/** Special value indicating user wants to follow the system language */
const SYSTEM_LANGUAGE_VALUE = "@system";
const SUPPORTED_LANGUAGES: Language[] = ["fr", "en", "es", "de", "it", "pt"];

/**
 * Detect the best matching language from the device's system locale.
 * Checks the primary language code (e.g. "en" from "en-US").
 * Falls back to defaultLanguage ("fr") if no match.
 */
function getSystemLanguage(): Language {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      // Try each locale in order of preference
      for (const locale of locales) {
        const langCode = locale.languageCode?.toLowerCase() as Language;
        if (langCode && SUPPORTED_LANGUAGES.includes(langCode)) {
          return langCode;
        }
      }
    }
  } catch (error) {
    console.warn("Failed to detect system language:", error);
  }
  return defaultLanguage;
}

interface I18nContextType {
  /** Current language code */
  language: Language;
  /** Set the current language (pass null to follow system language) */
  setLanguage: (lang: Language) => Promise<void>;
  /** Reset to follow system language */
  resetToSystemLanguage: () => Promise<void>;
  /** Whether currently following the system language */
  isSystemLanguage: boolean;
  /** Current translations object */
  t: TranslationKeys;
  /** Available languages */
  languages: typeof languageNames;
  /** Language flags for display */
  flags: typeof languageFlags;
  /** Whether the language is loading */
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(getSystemLanguage);
  const [isSystemLanguage, setIsSystemLanguage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        
        if (savedLanguage === null || savedLanguage === SYSTEM_LANGUAGE_VALUE) {
          // No saved preference or explicit "follow system" → use system language
          setLanguageState(getSystemLanguage());
          setIsSystemLanguage(true);
        } else if (SUPPORTED_LANGUAGES.includes(savedLanguage as Language)) {
          // User explicitly chose a language
          setLanguageState(savedLanguage as Language);
          setIsSystemLanguage(false);
        } else {
          // Invalid saved value → fall back to system
          setLanguageState(getSystemLanguage());
          setIsSystemLanguage(true);
        }
      } catch (error) {
        console.error("Failed to load language preference:", error);
        setLanguageState(getSystemLanguage());
        setIsSystemLanguage(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  // Listen for app returning to foreground to detect system language changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isSystemLanguage
      ) {
        // App came back to foreground and user follows system language
        const newSystemLang = getSystemLanguage();
        setLanguageState(newSystemLang);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [isSystemLanguage]);

  // Set language explicitly and persist to storage
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      setIsSystemLanguage(false);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  }, []);

  // Reset to follow system language
  const resetToSystemLanguage = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, SYSTEM_LANGUAGE_VALUE);
      setLanguageState(getSystemLanguage());
      setIsSystemLanguage(true);
    } catch (error) {
      console.error("Failed to reset language preference:", error);
    }
  }, []);

  // Get current translations
  const t = translations[language];

  const value: I18nContextType = {
    language,
    setLanguage,
    resetToSystemLanguage,
    isSystemLanguage,
    t,
    languages: languageNames,
    flags: languageFlags,
    isLoading,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access internationalization context
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

/**
 * Hook to get just the translations (shorthand)
 */
export function useTranslation(): TranslationKeys {
  const { t } = useI18n();
  return t;
}
