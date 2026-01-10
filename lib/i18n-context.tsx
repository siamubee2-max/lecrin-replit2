/**
 * Internationalization Context
 * Provides language selection and translation functions throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Language,
  TranslationKeys,
  translations,
  defaultLanguage,
  languageNames,
  languageFlags,
} from "./i18n";

const LANGUAGE_STORAGE_KEY = "@ecrin_virtuel_language";

interface I18nContextType {
  /** Current language code */
  language: Language;
  /** Set the current language */
  setLanguage: (lang: Language) => Promise<void>;
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
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en" || savedLanguage === "es")) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.error("Failed to load language preference:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLanguage();
  }, []);

  // Set language and persist to storage
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  }, []);

  // Get current translations
  const t = translations[language];

  const value: I18nContextType = {
    language,
    setLanguage,
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
