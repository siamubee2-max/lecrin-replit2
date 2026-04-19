import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
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

  // ─── Champs email/password pour Apple App Review + utilisateurs standards ──
  // Build 19 : seul « Sign in with Apple » était exposé. Apple App Review ne pouvait
  // donc PAS utiliser le compte démo `appreview@ecrinvirtuel.app / EcrinReview2026!`
  // fourni dans les notes → rejet 2.1(a). On ajoute ici une connexion par email.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(Platform.OS === "ios");

  useEffect(() => {
    // iPadOS 26 : AppleAuthentication peut ne pas être dispo sur certains iPad
    // de démo ou comptes sans Apple ID configuré. Si indispo, on masque le bouton
    // Apple et on force le flow email/password → le réviseur a toujours un chemin.
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then((ok) => setAppleAvailable(ok))
        .catch(() => setAppleAvailable(false));
    }
  }, []);

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

    setIsLoading(true);
    try {
      // iPadOS 26.4.1 : check obligatoire sinon crash possible
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        Alert.alert(
          "Sign in with Apple indisponible",
          "Ce compte iCloud ne permet pas Sign in with Apple. Vous pouvez utiliser la connexion par email ou continuer sans compte.",
        );
        setShowEmailForm(true);
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("Apple identity token is missing");
      }

      // Appel backend avec timeout explicite (10 s) — iPadOS 26 sandbox peut être lent
      const timeoutMs = 10_000;
      const sessionPromise = appleSignIn({
        identityToken: credential.identityToken,
        email: credential.email,
        fullName: credential.fullName,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("APPLE_SIGNIN_TIMEOUT")), timeoutMs),
      );

      const { sessionToken, user } = await Promise.race([sessionPromise, timeoutPromise]);

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
        // Annulation utilisateur — silencieux
        console.log("[Login] Apple Sign In canceled by user");
      } else if (error?.message === "APPLE_SIGNIN_TIMEOUT") {
        Alert.alert(
          "Délai dépassé",
          "La connexion avec Apple prend trop de temps. Essayez la connexion par email ou continuez sans compte.",
          [
            { text: "Connexion par email", onPress: () => setShowEmailForm(true) },
            { text: "Réessayer", style: "cancel" },
          ],
        );
      } else {
        console.error("[Login] Apple Sign In error:", error);
        Alert.alert(
          "Erreur de connexion",
          "La connexion avec Apple a échoué. Utilisez la connexion par email ou continuez sans compte.",
          [
            { text: "Connexion par email", onPress: () => setShowEmailForm(true) },
            { text: "OK", style: "cancel" },
          ],
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Connexion email / password via Supabase (chemin utilisé par App Review) ──
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Champs requis", "Veuillez renseigner votre email et votre mot de passe.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        console.error("[Login] Email sign-in error:", error);
        Alert.alert(
          "Connexion impossible",
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect."
            : "Impossible de se connecter. Vérifiez votre connexion internet et réessayez.",
        );
        return;
      }
      if (data.session?.user) {
        const u = data.session.user;
        await Auth.setUserInfo({
          id: 0,
          openId: `supabase_${u.id}`,
          name: u.user_metadata?.name || u.user_metadata?.full_name || u.email?.split("@")[0] || null,
          email: u.email ?? null,
          loginMethod: u.app_metadata?.provider ?? "email",
          lastSignedIn: new Date(),
        });
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace("/");
      }
    } catch (e: any) {
      console.error("[Login] Email sign-in exception:", e);
      Alert.alert("Erreur", e?.message ?? "Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
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
          {Platform.OS === "ios" && appleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={4}
              style={styles.appleBtn}
              onPress={handleAppleSignIn}
            />
          )}

          {/* ── Bloc connexion email/password (toggle) ──────────────────── */}
          {showEmailForm ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={20}
            >
              <View style={[styles.emailForm, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  textContentType="password"
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleEmailSignIn}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, marginTop: 8 }]}
                />
                <TouchableOpacity
                  onPress={handleEmailSignIn}
                  disabled={isLoading}
                  style={[styles.loginBtn, { backgroundColor: colors.foreground, marginTop: 12 }]}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={[styles.loginBtnText, { color: colors.background }]}>
                      SE CONNECTER
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowEmailForm(false)} style={{ marginTop: 8 }}>
                  <Text style={[styles.skipBtnText, { color: colors.muted, textAlign: "center" }]}>
                    Retour
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <>
              {/* Connexion par email (Supabase password) */}
              <TouchableOpacity
                onPress={() => setShowEmailForm(true)}
                disabled={isLoading}
                style={[
                  styles.loginBtn,
                  { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
                ]}
                activeOpacity={0.85}
              >
                <IconSymbol name="envelope.fill" size={18} color={colors.foreground} />
                <Text style={[styles.loginBtnText, { color: colors.foreground }]}>
                  CONTINUER AVEC UN EMAIL
                </Text>
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
            </>
          )}
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
  emailForm: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
