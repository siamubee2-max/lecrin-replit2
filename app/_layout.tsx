import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack , router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLinking from "expo-linking";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { FavoritesProvider } from "@/lib/favorites-context";
import { I18nProvider } from "@/lib/i18n-context";
import { AnalyticsProvider } from "@/lib/analytics-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { initSentry } from "@/lib/sentry";
import { WelcomeBackModal } from "@/components/WelcomeBackModal";
import { RootErrorBoundary } from "@/components/root-error-boundary";
import { scheduleWelcomeNotification } from "@/services/notification-service";
import { runLocalDataHygiene } from "@/services/local-data-hygiene-service";
import { SchemeColors } from "@/constants/theme";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const pathname = usePathname();
  const incomingUrl = ExpoLinking.useURL();
  const handledRecoveryKeyRef = useRef<string | null>(null);
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
    initSentry();
    void runLocalDataHygiene();
  }, []);

  // Check if onboarding has been completed
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem("onboarding_completed");
        if (!completed) {
          // Small delay to let the app initialize
          setTimeout(() => {
            router.replace("/onboarding");
          }, 100);
        } else {
          // Planifier la notification de bienvenue à J+1 (une seule fois)
          scheduleWelcomeNotification();
        }
      } catch (e) {
        // Ignore errors, proceed normally
      }
    };
    checkOnboarding();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Supabase recovery links may redirect to app root (exp://.../--/),
  // with auth tokens in URL hash/query. Forward to /reset-password with params.
  useEffect(() => {
    if (!incomingUrl) return;
    const hashPart = incomingUrl.split("#")[1] ?? "";
    const hashParams = Object.fromEntries(
      hashPart
        .split("&")
        .filter(Boolean)
        .map((pair) => {
          const [k = "", v = ""] = pair.split("=");
          return [decodeURIComponent(k), decodeURIComponent(v)];
        }),
    );

    let queryParams: Record<string, string> = {};
    try {
      queryParams = Object.fromEntries(
        new URL(incomingUrl.replace("exp://", "https://exp.local/")).searchParams.entries(),
      );
    } catch {
      queryParams = {};
    }

    const access_token = queryParams.access_token ?? hashParams.access_token;
    const refresh_token = queryParams.refresh_token ?? hashParams.refresh_token;
    const token_hash = queryParams.token_hash ?? hashParams.token_hash ?? queryParams.token ?? hashParams.token;
    const code = queryParams.code ?? hashParams.code;
    const type = queryParams.type ?? hashParams.type;

    const hasRecoveryPayload = Boolean(code || token_hash || (access_token && refresh_token));
    if (!hasRecoveryPayload) return;
    const recoveryKey = [code, token_hash, access_token, refresh_token, type]
      .filter(Boolean)
      .join("|");
    if (handledRecoveryKeyRef.current === recoveryKey) return;
    if (pathname === "/reset-password") return;

    handledRecoveryKeyRef.current = recoveryKey;
    router.replace({
      pathname: "/reset-password",
      params: {
        ...(access_token ? { access_token } : {}),
        ...(refresh_token ? { refresh_token } : {}),
        ...(token_hash ? { token_hash } : {}),
        ...(code ? { code } : {}),
        ...(type ? { type } : {}),
      },
    });
  }, [incomingUrl, pathname]);

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const stackScreenOptions = {
    headerShown: false as const,
    contentStyle: {
      flex: 1 as const,
      backgroundColor: SchemeColors.light.background,
    },
  };

  const content = (
    <RootErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: SchemeColors.light.background }}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <AnalyticsProvider>
              <I18nProvider>
                <FavoritesProvider>
                  {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
                  {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
                  <Stack screenOptions={stackScreenOptions}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="oauth/callback" />
                    <Stack.Screen name="reset-password" options={{ animation: "fade" }} />
                    <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
                    <Stack.Screen name="partner" />
                    <Stack.Screen name="daily-look" options={{ animation: "slide_from_right" }} />
                    <Stack.Screen name="observability" options={{ animation: "slide_from_right" }} />
                  </Stack>
                  <StatusBar style="auto" />
                  <WelcomeBackModal />
                </FavoritesProvider>
              </I18nProvider>
            </AnalyticsProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </GestureHandlerRootView>
    </RootErrorBoundary>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
