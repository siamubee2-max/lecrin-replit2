import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ExpoLinking from "expo-linking";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { supabase } from "@/lib/supabase";

function parseHashParams(url: string): Record<string, string> {
  const hash = url.split("#")[1] ?? "";
  return hash
    .split("&")
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const [k, v] = pair.split("=");
      if (k && v) acc[decodeURIComponent(k)] = decodeURIComponent(v);
      return acc;
    }, {});
}

export default function ResetPasswordScreen() {
  const colors = useColors();
  const liveUrl = ExpoLinking.useURL();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    token?: string;
    token_hash?: string;
    code?: string;
    type?: string;
  }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const processedKeyRef = useRef<string | null>(null);

  const hasMinLength = useMemo(() => newPassword.trim().length >= 6, [newPassword]);

  useEffect(() => {
    const bootstrapSessionFromLink = async () => {
      if (!supabase) {
        Alert.alert("Erreur", "Supabase n'est pas configuré.");
        setIsBootstrapping(false);
        return;
      }

      try {
        const initialUrl = (await ExpoLinking.getInitialURL()) ?? liveUrl ?? "";
        const hashParams = initialUrl ? parseHashParams(initialUrl) : {};
        const queryParams = initialUrl
          ? Object.fromEntries(
              new URL(initialUrl.replace("exp://", "https://exp.local/")).searchParams.entries(),
            )
          : {};

        const accessToken =
          (typeof params.access_token === "string" ? params.access_token : null) ??
          queryParams.access_token ??
          hashParams.access_token ??
          null;
        const refreshToken =
          (typeof params.refresh_token === "string" ? params.refresh_token : null) ??
          queryParams.refresh_token ??
          hashParams.refresh_token ??
          null;
        const tokenHashOrToken =
          (typeof params.token_hash === "string" ? params.token_hash : null) ??
          (typeof params.token === "string" ? params.token : null) ??
          queryParams.token_hash ??
          queryParams.token ??
          hashParams.token_hash ??
          hashParams.token ??
          null;
        const code =
          (typeof params.code === "string" ? params.code : null) ??
          queryParams.code ??
          hashParams.code ??
          null;
        const type =
          (typeof params.type === "string" ? params.type : null) ??
          queryParams.type ??
          hashParams.type ??
          null;
        const key = [code, tokenHashOrToken, accessToken, refreshToken, type].filter(Boolean).join("|");

        if (!key) {
          // Aucun token dans l'URL : ne pas bloquer l'utilisateur avec une fausse alerte.
          setIsBootstrapping(false);
          return;
        }

        // Evite de consommer deux fois le même token si l'effet se relance.
        if (processedKeyRef.current === key) {
          setIsBootstrapping(false);
          return;
        }
        processedKeyRef.current = key;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setIsBootstrapping(false);
          return;
        }

        if (tokenHashOrToken && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHashOrToken,
            type: "recovery",
          });
          if (error) throw error;
          setIsBootstrapping(false);
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setIsBootstrapping(false);
          return;
        }

        setIsBootstrapping(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible d'ouvrir ce lien.";
        Alert.alert("Erreur", message, [{ text: "OK", onPress: () => router.replace("/login") }]);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapSessionFromLink();
  }, [liveUrl, params.access_token, params.refresh_token, params.token_hash, params.token, params.code, params.type]);

  const handleSubmit = async () => {
    if (!supabase) return;
    if (!hasMinLength) {
      Alert.alert("Mot de passe trop court", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Confirmation incorrecte", "Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert("Mot de passe mis à jour", "Vous pouvez maintenant vous connecter.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de changer le mot de passe.";
      Alert.alert("Erreur", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <Text style={[styles.title, { color: colors.foreground }]}>Nouveau mot de passe</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Entrez un nouveau mot de passe pour votre compte.
          </Text>

          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={colors.muted}
            secureTextEntry
            editable={!isBootstrapping && !isSubmitting}
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground },
            ]}
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor={colors.muted}
            secureTextEntry
            editable={!isBootstrapping && !isSubmitting}
            style={[
              styles.input,
              { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground },
            ]}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isBootstrapping || isSubmitting}
            style={[styles.button, { backgroundColor: colors.foreground, opacity: isBootstrapping ? 0.6 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              {isBootstrapping ? "Validation du lien..." : isSubmitting ? "Mise à jour..." : "METTRE À JOUR"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});

