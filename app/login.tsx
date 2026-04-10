import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { appleSignIn } from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);

    try {
      if (Platform.OS === "web") {
        // Web: use Supabase OAuth (handles redirect automatically)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) {
          console.error("[Login] Supabase OAuth error:", error);
          Alert.alert("Erreur de connexion", "La connexion a échoué. Veuillez réessayer.");
        }
      } else {
        // Native: Supabase OAuth via WebBrowser to capture the callback
        const redirectTo = Linking.createURL("/oauth/callback");
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error || !data?.url) {
          console.error("[Login] Supabase OAuth error:", error);
          Alert.alert("Erreur de connexion", "La connexion a échoué. Veuillez réessayer.");
          return;
        }

        // Open the OAuth URL in a system browser
        const result = await WebBrowser.openAuthSessionAsync(data.url.toString(), redirectTo);
        if (result.type === "success" && result.url) {
          // Parse the callback URL for the auth code
          const url = new URL(result.url);
          const code = url.searchParams.get("code");
          if (code) {
            // Exchange code for session (PKCE verifier is stored by Supabase SDK)
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error("[Login] Code exchange error:", exchangeError);
              Alert.alert("Erreur de connexion", "La connexion a échoué. Veuillez réessayer.");
              return;
            }
            // Session is now set — update user info
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user) {
              const supaUser = sessionData.session.user;
              await Auth.setUserInfo({
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
              });
            }
            router.replace("/");
          }
        }
      }
    } catch (error) {
      console.error("[Login] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("[Login] Apple Sign In succeeded");

      if (!credential.identityToken) {
        throw new Error("Apple identity token is missing");
      }

      // Exchange Apple identity token for a session
      const { sessionToken, user } = await appleSignIn({
        identityToken: credential.identityToken,
        email: credential.email,
        fullName: credential.fullName,
      });

      // Store session token and user info
      await Auth.setSessionToken(sessionToken);
      await Auth.setUserInfo({
        id: user.id,
        openId: user.openId,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod ?? "apple",
        lastSignedIn: new Date(user.lastSignedIn),
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.replace("/");
    } catch (error: any) {
      if (error?.code === "ERR_REQUEST_CANCELED") {
        // User canceled — no action needed
        console.log("[Login] Apple Sign In canceled by user");
      } else {
        console.error("[Login] Apple Sign In error:", error);
        Alert.alert(
          "Erreur de connexion",
          "La connexion avec Apple a échoué. Veuillez réessayer.",
        );
      }
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer
      edges={["top", "left", "right", "bottom"]}
      containerClassName="bg-background"
    >
      <View style={styles.container}>
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* ── Logo & Titre ───────────────────────────────────────────────── */}
        <View style={styles.logoSection}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={[styles.goldLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.brandName, { color: colors.foreground }]}>L'ÉCRIN</Text>
          <Text style={[styles.brandSub, { color: colors.primary }]}>VIRTUEL</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            Synchronisez votre collection sur tous vos appareils
          </Text>
        </View>

        {/* ── Avantages ─────────────────────────────────────────────────── */}
        <View style={styles.benefits}>
          <BenefitRow
            icon="diamond.fill"
            label="Mon Écrin synchronisé"
            desc="Votre collection accessible partout"
            colors={colors}
          />
          <View style={[styles.benefitDivider, { backgroundColor: colors.border }]} />
          <BenefitRow
            icon="heart.fill"
            label="Essayages sauvegardés"
            desc="Retrouvez vos résultats préférés"
            colors={colors}
          />
          <View style={[styles.benefitDivider, { backgroundColor: colors.border }]} />
          <BenefitRow
            icon="person.2.fill"
            label="Communauté exclusive"
            desc="Partagez vos looks avec la communauté"
            colors={colors}
          />
        </View>

        {/* ── Boutons de connexion ───────────────────────────────────────── */}
        <View style={styles.actions}>
          {/* Apple Sign In (iOS uniquement) — bouton officiel Apple */}
          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={4}
              style={styles.appleBtn}
              onPress={handleAppleSignIn}
            />
          )}

          {/* Connexion par OAuth (web/Android ou fallback iOS) */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={[
              styles.loginBtn,
              { backgroundColor: Platform.OS === "ios" ? "transparent" : colors.foreground, borderWidth: Platform.OS === "ios" ? 1 : 0, borderColor: colors.border },
            ]}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color={Platform.OS === "ios" ? colors.foreground : colors.background} />
            ) : (
              <>
                <IconSymbol name="person.fill" size={18} color={Platform.OS === "ios" ? colors.foreground : colors.background} />
                <Text style={[styles.loginBtnText, { color: Platform.OS === "ios" ? colors.foreground : colors.background }]}>
                  SE CONNECTER
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Continuer sans compte */}
          <TouchableOpacity
            onPress={handleSkip}
            style={[styles.skipBtn, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipBtnText, { color: colors.muted }]}>
              Continuer sans compte
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Mentions légales ──────────────────────────────────────────── */}
        <View style={styles.legal}>
          <Text style={[styles.legalText, { color: colors.muted }]}>
            En continuant, vous acceptez nos{" "}
            <Text
              style={{ color: colors.primary }}
              onPress={() => router.push("/terms")}
            >
              Conditions d'utilisation
            </Text>
            {" "}et notre{" "}
            <Text
              style={{ color: colors.primary }}
              onPress={() => router.push("/privacy")}
            >
              Politique de confidentialité
            </Text>
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

// ── Composant BenefitRow ────────────────────────────────────────────────────
function BenefitRow({
  icon,
  label,
  desc,
  colors,
}: {
  icon: string;
  label: string;
  desc: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.benefitIcon, { backgroundColor: colors.primary + "20" }]}>
        <IconSymbol name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.benefitText}>
        <Text style={[styles.benefitLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.benefitDesc, { color: colors.muted }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
  },
  goldLine: {
    width: 40,
    height: 1,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 6,
    lineHeight: 34,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 4,
    marginTop: 2,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  benefits: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 20,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  benefitDivider: {
    height: 0.5,
    marginLeft: 50,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
    lineHeight: 20,
  },
  benefitDesc: {
    fontSize: 12,
    letterSpacing: 0.2,
    marginTop: 1,
    lineHeight: 16,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  appleBtn: {
    height: 50,
    width: "100%",
  },
  loginBtn: {
    paddingVertical: 18,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  skipBtn: {
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  legal: {
    marginTop: "auto",
    paddingBottom: 24,
    paddingTop: 16,
  },
  legalText: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});
