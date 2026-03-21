import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function AccountDeletedScreen() {
  const colors = useColors();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    router.replace("/");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Icône */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.icon}>💎</Text>
          </View>

          {/* Titre */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Compte supprimé
          </Text>

          {/* Sous-titre */}
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Votre compte L{"'"}Écrin Virtuel a été supprimé avec succès.
          </Text>

          {/* Séparateur doré */}
          <View
            style={[styles.divider, { backgroundColor: colors.primary }]}
          />

          {/* Message de remerciement */}
          <Text style={[styles.message, { color: colors.muted }]}>
            Merci d{"'"}avoir utilisé L{"'"}Écrin Virtuel. Toutes vos données ont été
            définitivement supprimées conformément à notre politique de
            confidentialité.
          </Text>

          <Text style={[styles.message, { color: colors.muted, marginTop: 12 }]}>
            Si vous souhaitez revenir, vous pouvez créer un nouveau compte à
            tout moment.
          </Text>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleContinue}
            style={[styles.button, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: "#0A1A3B" }]}>
              Retour à l{"'"}accueil
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  divider: {
    width: 48,
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    marginTop: 36,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
