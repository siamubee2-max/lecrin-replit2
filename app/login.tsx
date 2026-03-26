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
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import type { AuthError } from "@supabase/supabase-js";
import * as ExpoLinking from "expo-linking";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const getAuthErrorMessage = (error: AuthError): string => {
    const msg = error.message.toLowerCase();

    if (msg.includes("invalid login credentials")) {
      return "Email ou mot de passe incorrect. Si vous n'avez pas encore de compte, passez en mode 'Créer un compte'.";
    }
    if (msg.includes("email not confirmed")) {
      return "Votre email n'est pas encore confirmé.";
    }
    if (msg.includes("user already registered")) {
      return "Un compte existe déjà avec cet email. Utilisez 'Se connecter'.";
    }
    if (msg.includes("password should be at least")) {
      return "Le mot de passe doit contenir au moins 6 caractères.";
    }
    return error.message;
  };

  const handleAuth = async () => {
    if (!supabase) {
      Alert.alert("Erreur", "Supabase n'est pas configuré.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner votre email et votre mot de passe.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mot de passe trop court", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        Alert.alert("Compte créé", "Vous êtes maintenant connecté !", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.back();
      }
    } catch (err) {
      console.error("[Login] Error:", err);
      const msg =
        err && typeof err === "object" && "message" in err
          ? getAuthErrorMessage(err as AuthError)
          : "Une erreur est survenue";
      Alert.alert("Erreur de connexion", msg);
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

  const handleForgotPassword = async () => {
    if (!supabase) {
      Alert.alert("Erreur", "Supabase n'est pas configuré.");
      return;
    }
    if (!email.trim()) {
      Alert.alert(
        "Email requis",
        "Renseignez votre email, puis appuyez de nouveau sur 'Mot de passe oublié ?'.",
      );
      return;
    }

    try {
      const redirectTo = ExpoLinking.createURL("/reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;
      Alert.alert(
        "Email envoyé",
        "Si un compte existe pour cet email, vous allez recevoir un lien de réinitialisation.",
      );
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? getAuthErrorMessage(err as AuthError)
          : "Impossible d'envoyer l'email de réinitialisation.";
      Alert.alert("Erreur", msg);
    }
  };

  return (
    <ScreenContainer
      edges={["top", "left", "right", "bottom"]}
      containerClassName="bg-background"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Logo */}
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
                {isSignUp ? "Créez votre compte" : "Connectez-vous à votre compte"}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mot de passe"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              />

              <TouchableOpacity
                onPress={handleAuth}
                disabled={isLoading}
                style={[styles.loginBtn, { backgroundColor: colors.foreground }]}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <>
                    <IconSymbol name="person.fill" size={18} color={colors.background} />
                    <Text style={[styles.loginBtnText, { color: colors.background }]}>
                      {isSignUp ? "CRÉER MON COMPTE" : "SE CONNECTER"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsSignUp(!isSignUp)}
                style={styles.toggleBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleText, { color: colors.primary }]}>
                  {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un compte"}
                </Text>
              </TouchableOpacity>

              {!isSignUp && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.forgotText, { color: colors.primary }]}>
                    Mot de passe oublié ?
                  </Text>
                </TouchableOpacity>
              )}

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

            {/* Legal */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
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
    paddingVertical: 20,
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
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    gap: 12,
    marginTop: 8,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
  },
  loginBtn: {
    paddingVertical: 18,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  toggleBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  forgotBtn: {
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 6,
  },
  forgotText: {
    fontSize: 13,
    letterSpacing: 0.2,
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
