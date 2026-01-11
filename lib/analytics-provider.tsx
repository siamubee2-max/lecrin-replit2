/**
 * Provider Analytics pour L'Écrin Virtuel
 * Initialise Mixpanel et fournit le contexte analytics à l'application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { analytics } from '@/services/analytics-service';
import Constants from 'expo-constants';

interface AnalyticsContextType {
  isReady: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({ isReady: false });

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Provider qui initialise Mixpanel au démarrage de l'application
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Récupérer le token Mixpanel depuis les variables d'environnement
        const mixpanelToken = Constants.expoConfig?.extra?.mixpanelToken || 
                              process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ||
                              process.env.MIXPANEL_TOKEN;

        if (mixpanelToken) {
          await analytics.initialize(mixpanelToken);
          setIsReady(true);
          console.log('[AnalyticsProvider] Mixpanel initialized');
        } else {
          console.log('[AnalyticsProvider] No Mixpanel token found, analytics disabled');
          // Même sans token, on marque comme prêt pour ne pas bloquer l'app
          setIsReady(true);
        }
      } catch (error) {
        console.error('[AnalyticsProvider] Failed to initialize:', error);
        setIsReady(true); // Ne pas bloquer l'app en cas d'erreur
      }
    };

    initializeAnalytics();
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
