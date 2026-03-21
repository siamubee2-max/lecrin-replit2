import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

type Plan = "premium" | "premium_plus";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPurchasePremium: () => Promise<boolean>;
  onPurchasePremiumPlus: () => Promise<boolean>;
  onRestore: () => Promise<void>;
  /** Fonctionnalité qui a déclenché le paywall */
  featureName?: string;
  /** Nombre d'essayages gratuits restants */
  freeTriesLeft?: number;
};

const PREMIUM_FEATURES = [
  { emoji: "✦", label: "Essayages IA illimités", free: "3/mois" },
  { emoji: "👗", label: "Mode Tenue Complète", free: false },
  { emoji: "📸", label: "Effets Snapshot premium", free: "Basique" },
  { emoji: "🏆", label: "Badges exclusifs", free: false },
  { emoji: "🔔", label: "Alertes nouvelles collections", free: false },
];

const PREMIUM_PLUS_FEATURES = [
  { emoji: "✦", label: "Tout Premium inclus", highlight: true },
  { emoji: "⚡", label: "Génération IA prioritaire", highlight: false },
  { emoji: "🎨", label: "Décors Snapshot exclusifs", highlight: false },
  { emoji: "👑", label: "Badge ✦ Icône Communauté", highlight: false },
  { emoji: "💬", label: "Support prioritaire", highlight: false },
];

export function PaywallModal({
  visible,
  onClose,
  onPurchasePremium,
  onPurchasePremiumPlus,
  onRestore,
  featureName,
  freeTriesLeft,
}: Props) {
  const colors = useColors();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("premium");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handlePurchase = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const success =
        selectedPlan === "premium"
          ? await onPurchasePremium()
          : await onPurchasePremiumPlus();
      if (success) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await onRestore();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: colors.muted }]}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <Text style={styles.heroEmoji}>✦</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>ÉCRIN VIRTUEL</Text>
            <Text style={[styles.heroSubtitle, { color: "#C9A96E" }]}>PREMIUM</Text>
            {featureName && (
              <View style={[styles.featurePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.featurePillText, { color: colors.muted }]}>
                  {freeTriesLeft !== undefined && freeTriesLeft > 0
                    ? `Il vous reste ${freeTriesLeft} essayage${freeTriesLeft > 1 ? "s" : ""} gratuit${freeTriesLeft > 1 ? "s" : ""}`
                    : `"${featureName}" nécessite un abonnement`}
                </Text>
              </View>
            )}
          </View>

          {/* Sélecteur de plan */}
          <View style={styles.planSelector}>
            {(["premium", "premium_plus"] as Plan[]).map((plan) => (
              <TouchableOpacity
                key={plan}
                onPress={() => setSelectedPlan(plan)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: selectedPlan === plan ? "#C9A96E" : colors.border,
                    borderWidth: selectedPlan === plan ? 2 : 0.5,
                  },
                ]}
                activeOpacity={0.85}
              >
                {plan === "premium_plus" && (
                  <View style={[styles.popularBadge, { backgroundColor: "#C9A96E" }]}>
                    <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                  </View>
                )}
                <Text style={[styles.planName, { color: colors.foreground }]}>
                  {plan === "premium" ? "Premium" : "Premium +"}
                </Text>
                <Text style={[styles.planPrice, { color: "#C9A96E" }]}>
                  {plan === "premium" ? "4,99 €" : "9,99 €"}
                </Text>
                <Text style={[styles.planPeriod, { color: colors.muted }]}>/ mois</Text>
                {plan === "premium_plus" && (
                  <Text style={[styles.planSave, { color: "#22C55E" }]}>Économisez 20% annuel</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fonctionnalités */}
          <View style={[styles.featuresSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.featuresTitle, { color: colors.primary }]}>
              {selectedPlan === "premium" ? "✦ PREMIUM INCLUT" : "✦ PREMIUM + INCLUT"}
            </Text>
            {(selectedPlan === "premium" ? PREMIUM_FEATURES : PREMIUM_PLUS_FEATURES).map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                {"free" in f && f.free !== false && (
                  <Text style={[styles.freeLabel, { color: colors.muted }]}>
                    {f.free === true ? "✓" : f.free}
                  </Text>
                )}
                {"free" in f && f.free === false && (
                  <View style={[styles.premiumTag, { backgroundColor: "#C9A96E22" }]}>
                    <Text style={[styles.premiumTagText, { color: "#C9A96E" }]}>PREMIUM</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Comparaison gratuit vs premium */}
          {selectedPlan === "premium" && (
            <View style={[styles.compareSection, { borderColor: colors.border }]}>
              <View style={styles.compareHeader}>
                <Text style={[styles.compareCol, { color: colors.muted }]}>Fonctionnalité</Text>
                <Text style={[styles.compareColRight, { color: colors.muted }]}>Gratuit</Text>
                <Text style={[styles.compareColRight, { color: "#C9A96E" }]}>Premium</Text>
              </View>
              {PREMIUM_FEATURES.map((f, i) => (
                <View key={i} style={[styles.compareRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.compareLabel, { color: colors.foreground }]}>{f.label}</Text>
                  <Text style={[styles.compareColRight, { color: colors.muted }]}>
                    {f.free === false ? "✗" : f.free === true ? "✓" : String(f.free)}
                  </Text>
                  <Text style={[styles.compareColRight, { color: "#C9A96E" }]}>✓</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={isLoading}
            style={[styles.ctaBtn, { backgroundColor: "#C9A96E" }]}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaBtnText}>
                {selectedPlan === "premium" ? "COMMENCER PREMIUM — 4,99 €/mois" : "COMMENCER PREMIUM + — 9,99 €/mois"}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.legalText, { color: colors.muted }]}>
            Résiliable à tout moment. Renouvellement automatique. Paiement via App Store / Google Play.
          </Text>

          <TouchableOpacity onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <Text style={[styles.restoreBtnText, { color: colors.muted }]}>Restaurer mes achats</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 18,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 6,
  },
  heroEmoji: {
    fontSize: 40,
    color: "#C9A96E",
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 4,
  },
  heroSubtitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 2,
  },
  featurePill: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  featurePillText: {
    fontSize: 12,
    textAlign: "center",
  },
  planSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  popularBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
  },
  planPeriod: {
    fontSize: 11,
  },
  planSave: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
  featuresSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: "center",
  },
  featureLabel: {
    flex: 1,
    fontSize: 13,
  },
  freeLabel: {
    fontSize: 11,
  },
  premiumTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumTagText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  compareSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
    marginBottom: 20,
  },
  compareHeader: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
  },
  compareRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderTopWidth: 0.5,
  },
  compareCol: {
    flex: 1,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  compareColRight: {
    width: 56,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },
  compareLabel: {
    flex: 1,
    fontSize: 12,
  },
  ctaBtn: {
    marginHorizontal: 16,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  legalText: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 16,
    marginBottom: 8,
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreBtnText: {
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
