import { ThemedView } from "@/components/themed-view";
import * as Auth from "@/lib/_core/auth";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OAuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[OAuth] Callback handler triggered");
      try {
        // Check if there's a Supabase session available (set by detectSessionInUrl)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          const supaUser = sessionData.session.user;
          const userInfo: Auth.User = {
            id: 0,
            openId: `supabase_${supaUser.id}`,
            name:
              supaUser.user_metadata?.name ||
              supaUser.user_metadata?.full_name ||
              supaUser.email?.split("@")[0] ||
              null,
            email: supaUser.email ?? null,
            loginMethod: supaUser.app_metadata?.provider ?? "supabase",
            lastSignedIn: new Date(),
          };
          await Auth.setUserInfo(userInfo);
          console.log("[OAuth] Supabase session found:", userInfo);
          setStatus("success");
          setTimeout(() => router.replace("/(tabs)"), 1000);
          return;
        }

        console.log("[OAuth] No Supabase session, checking for legacy token...");
        // Fallback: check for legacy sessionToken in URL params (migration path)
        // This handles existing sessions that were set up before the Supabase migration
        setStatus("error");
        setErrorMessage("Aucune session trouvée. Veuillez réessayer de vous connecter.");
      } catch (error) {
        console.error("[OAuth] Callback error:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to complete authentication",
        );
      }
    };

    handleCallback();
  }, [router]);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completing authentication...
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">
              Authentication successful!
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecting...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Authentication failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
