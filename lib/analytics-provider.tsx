/**
 * Provider Analytics — Écrin Virtuel
 * Initialise PostHog et fournit le contexte analytics à l'application.
 *
 * Variables d'environnement requises :
 *   EXPO_PUBLIC_POSTHOG_API_KEY  — clé publique PostHog (ex: phc_xxxx)
 *   EXPO_PUBLIC_POSTHOG_HOST     — host PostHog (défaut: https://eu.i.posthog.com)
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initPostHog } from "@/lib/analytics";

interface AnalyticsContextType {
  isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({ isReady: false });

/**
 * Provider qui initialise PostHog au démarrage de l'application
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initPostHog()
      .then(() => {
        setIsReady(true);
        console.log("[AnalyticsProvider] PostHog initialized");
      })
      .catch((error) => {
        console.warn("[AnalyticsProvider] PostHog init failed:", error);
        setIsReady(true); // Ne pas bloquer l'app en cas d'erreur
      });
  }, []);

  return (
    <AnalyticsContext.Provider value={{ isReady }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte analytics
 */
export function useAnalytics() {
  return useContext(AnalyticsContext);
}

export default AnalyticsProvider;
