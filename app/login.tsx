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
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getLoginUrl } from "@/constants/oauth";

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
      const loginUrl = getLoginUrl();

      if (Platform.OS === "web") {
        window.location.href = loginUrl;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(loginUrl, undefined, {
          showInRecents: true,
        });
        if (result.type === "success") {
          console.log("[Login] OAuth session completed successfully");
        }
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      Alert.alert(
        "Erreur de connexion",
        errorMessage,
        [{ text: "OK", style: "default" }]
      );
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
          {/* Connexion principale */}
          <TouchableOpacity
            onPress={handleLogin}
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
