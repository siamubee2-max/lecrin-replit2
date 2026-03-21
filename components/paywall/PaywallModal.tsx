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

// ─── Plans disponibles (alignés sur RevenueCat) ───────────────────────────────
type Plan = "jewelry" | "premium_monthly" | "premium_yearly";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPurchasePremium: () => Promise<boolean>;       // premium mensuel
  onPurchasePremiumPlus: () => Promise<boolean>;   // premium annuel
  onPurchaseJewelry?: () => Promise<boolean>;      // jewelry mensuel
  onPurchaseCredits?: (pack: "50" | "100" | "250" | "500") => Promise<boolean>;
  onRestore: () => Promise<void>;
  featureName?: string;
  freeTriesLeft?: number;
  /** Si true, affiche aussi les packs de crédits */
  showCredits?: boolean;
};

// ─── Contenu des plans ────────────────────────────────────────────────────────
const JEWELRY_FEATURES = [
  { emoji: "💎", label: "100 essayages bijoux / mois" },
  { emoji: "🔔", label: "Alertes nouvelles collections" },
  { emoji: "📸", label: "Snapshot cadres basiques" },
  { emoji: "🏅", label: "Badge Communauté Bijoux" },
];

const PREMIUM_FEATURES = [
  { emoji: "✦",  label: "Tout Jewelry inclus" },
  { emoji: "💎", label: "150 essayages / mois (mensuel)" },
  { emoji: "🗓️", label: "1 500 essayages / an (annuel)" },
  { emoji: "👗", label: "Essayage vêtements & chaussures" },
  { emoji: "🧥", label: "Mode Tenue Complète — 15 slots" },
  { emoji: "📸", label: "Effets Snapshot premium" },
  { emoji: "🎬", label: "Cadre Story 9:16 Instagram" },
  { emoji: "🏆", label: "Badges exclusifs Communauté" },
];

const CREDIT_PACKS: { pack: "50" | "100" | "250" | "500"; label: string; price: string; bonus?: string }[] = [
  { pack: "50",  label: "50 crédits",  price: "4,99 €" },
  { pack: "100", label: "100 crédits", price: "9,99 €",  bonus: "+10%" },
  { pack: "250", label: "250 crédits", price: "19,99 €", bonus: "+25%" },
  { pack: "500", label: "500 crédits", price: "35,99 €", bonus: "+40%" },
];

export function PaywallModal({
  visible,
  onClose,
  onPurchasePremium,
  onPurchasePremiumPlus,
  onPurchaseJewelry,
  onPurchaseCredits,
  onRestore,
  featureName,
  freeTriesLeft,
  showCredits = false,
}: Props) {
  const colors = useColors();
  const [selectedPlan, setSelectedPlan] = useState<Plan>("premium_monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState<"plans" | "credits">(showCredits ? "credits" : "plans");

  const handlePurchase = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      let success = false;
      if (selectedPlan === "jewelry" && onPurchaseJewelry) {
        success = await onPurchaseJewelry();
      } else if (selectedPlan === "premium_monthly") {
        success = await onPurchasePremium();
      } else if (selectedPlan === "premium_yearly") {
        success = await onPurchasePremiumPlus();
      }
      if (success) {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = async (pack: "50" | "100" | "250" | "500") => {
    if (!onPurchaseCredits) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    try {
      const success = await onPurchaseCredits(pack);
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
    try { await onRestore(); } finally { setIsRestoring(false); }
  };

  const planLabel = {
    jewelry: "ESSENTIEL — 14,99 €/mois",
    premium_monthly: "PREMIUM — 24,99 €/mois",
    premium_yearly: "PREMIUM ANNUEL — 199,99 €/an",
  }[selectedPlan];

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
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>L'ÉCRIN VIRTUEL</Text>
            <Text style={[styles.heroSubtitle, { color: "#C9A96E" }]}>ACCÈS PREMIUM</Text>
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

          {/* Onglets Plans / Crédits */}
          <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
            {(["plans", "credits"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, activeTab === tab && { borderBottomColor: "#C9A96E", borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? "#C9A96E" : colors.muted }]}>
                  {tab === "plans" ? "ABONNEMENTS" : "CRÉDITS"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === "plans" ? (
            <>
              {/* Sélecteur de plan */}
              <View style={styles.planSelector}>
                {/* Jewelry */}
                <TouchableOpacity
                  onPress={() => setSelectedPlan("jewelry")}
                  style={[styles.planCard, { backgroundColor: colors.surface, borderColor: selectedPlan === "jewelry" ? "#C9A96E" : colors.border, borderWidth: selectedPlan === "jewelry" ? 2 : 0.5 }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.planName, { color: colors.foreground }]}>💎 Essentiel</Text>
                  <Text style={[styles.planPrice, { color: "#C9A96E" }]}>14,99 €</Text>
                  <Text style={[styles.planPeriod, { color: colors.muted }]}>/ mois</Text>
                  <Text style={[styles.planDesc, { color: colors.muted }]}>Bijoux illimités</Text>
                </TouchableOpacity>

                {/* Premium Mensuel */}
                <TouchableOpacity
                  onPress={() => setSelectedPlan("premium_monthly")}
                  style={[styles.planCard, { backgroundColor: colors.surface, borderColor: selectedPlan === "premium_monthly" ? "#C9A96E" : colors.border, borderWidth: selectedPlan === "premium_monthly" ? 2 : 0.5 }]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.popularBadge, { backgroundColor: "#C9A96E" }]}>
                    <Text style={styles.popularBadgeText}>POPULAIRE</Text>
                  </View>
                  <Text style={[styles.planName, { color: colors.foreground, marginTop: 10 }]}>✦ Premium</Text>
                  <Text style={[styles.planPrice, { color: "#C9A96E" }]}>24,99 €</Text>
                  <Text style={[styles.planPeriod, { color: colors.muted }]}>/ mois</Text>
                  <Text style={[styles.planDesc, { color: colors.muted }]}>Tout inclus</Text>
                </TouchableOpacity>

                {/* Premium Annuel */}
                <TouchableOpacity
                  onPress={() => setSelectedPlan("premium_yearly")}
                  style={[styles.planCard, { backgroundColor: colors.surface, borderColor: selectedPlan === "premium_yearly" ? "#C9A96E" : colors.border, borderWidth: selectedPlan === "premium_yearly" ? 2 : 0.5 }]}
                  activeOpacity={0.85}
                >
                  <View style={[styles.saveBadge, { backgroundColor: "#22C55E22" }]}>
                    <Text style={[styles.saveBadgeText, { color: "#22C55E" }]}>−33%</Text>
                  </View>
                  <Text style={[styles.planName, { color: colors.foreground, marginTop: 10 }]}>✦ Annuel</Text>
                  <Text style={[styles.planPrice, { color: "#C9A96E" }]}>199,99 €</Text>
                  <Text style={[styles.planPeriod, { color: colors.muted }]}>/ an</Text>
                  <Text style={[styles.planDesc, { color: "#22C55E" }]}>16,67 €/mois</Text>
                </TouchableOpacity>
              </View>

              {/* Fonctionnalités du plan sélectionné */}
              <View style={[styles.featuresSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.featuresTitle, { color: colors.primary }]}>
                  {selectedPlan === "jewelry" ? "💎 ESSENTIEL INCLUT" : "✦ PREMIUM INCLUT"}
                </Text>
                {(selectedPlan === "jewelry" ? JEWELRY_FEATURES : PREMIUM_FEATURES).map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Text style={styles.featureEmoji}>{f.emoji}</Text>
                    <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                  </View>
                ))}
              </View>

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
                  <Text style={styles.ctaBtnText}>COMMENCER — {planLabel}</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.legalText, { color: colors.muted }]}>
                7 jours d'essai gratuit · Résiliable à tout moment · App Store / Google Play
              </Text>
            </>
          ) : (
            <>
              {/* Packs de crédits */}
              <View style={styles.creditsSection}>
                <Text style={[styles.creditsIntro, { color: colors.muted }]}>
                  Les crédits permettent d'effectuer des essayages à l'unité, sans abonnement.
                </Text>
                {CREDIT_PACKS.map(({ pack, label, price, bonus }) => (
                  <TouchableOpacity
                    key={pack}
                    onPress={() => handleBuyCredits(pack)}
                    disabled={isLoading}
                    style={[styles.creditRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.creditLabel, { color: colors.foreground }]}>{label}</Text>
                      {bonus && (
                        <Text style={[styles.creditBonus, { color: "#22C55E" }]}>Bonus {bonus}</Text>
                      )}
                    </View>
                    <Text style={[styles.creditPrice, { color: "#C9A96E" }]}>{price}</Text>
                    <Text style={[styles.creditArrow, { color: colors.muted }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Restaurer */}
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
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  closeBtnText: { fontSize: 18 },
  heroSection: { alignItems: "center", paddingVertical: 24, gap: 6 },
  heroEmoji: { fontSize: 36, color: "#C9A96E" },
  heroTitle: { fontSize: 11, fontWeight: "300", letterSpacing: 4 },
  heroSubtitle: { fontSize: 26, fontWeight: "700", letterSpacing: 2 },
  featurePill: {
    marginTop: 8, borderRadius: 20, borderWidth: 0.5,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  featurePillText: { fontSize: 12, textAlign: "center" },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    marginBottom: 16,
  },
  tab: {
    flex: 1, alignItems: "center", paddingVertical: 12,
  },
  tabText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  planSelector: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  planCard: {
    flex: 1, borderRadius: 14, padding: 12,
    alignItems: "center", gap: 2, position: "relative",
  },
  popularBadge: {
    position: "absolute", top: -10,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  popularBadgeText: { color: "#fff", fontSize: 7, fontWeight: "700", letterSpacing: 0.5 },
  saveBadge: {
    position: "absolute", top: -10,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  saveBadgeText: { fontSize: 9, fontWeight: "700" },
  planName: { fontSize: 12, fontWeight: "600" },
  planPrice: { fontSize: 20, fontWeight: "700" },
  planPeriod: { fontSize: 10 },
  planDesc: { fontSize: 9, marginTop: 2 },
  featuresSection: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 0.5,
    padding: 16, gap: 10, marginBottom: 16,
  },
  featuresTitle: { fontSize: 9, fontWeight: "600", letterSpacing: 2, marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureEmoji: { fontSize: 15, width: 22, textAlign: "center" },
  featureLabel: { flex: 1, fontSize: 13 },
  ctaBtn: {
    marginHorizontal: 16, borderRadius: 30,
    paddingVertical: 16, alignItems: "center", marginBottom: 10,
  },
  ctaBtnText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  legalText: {
    fontSize: 10, textAlign: "center",
    paddingHorizontal: 24, lineHeight: 16, marginBottom: 8,
  },
  creditsSection: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  creditsIntro: { fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 8 },
  creditRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 0.5,
    paddingHorizontal: 16, paddingVertical: 14, gap: 8,
  },
  creditLabel: { fontSize: 14, fontWeight: "600" },
  creditBonus: { fontSize: 11, marginTop: 2 },
  creditPrice: { fontSize: 16, fontWeight: "700" },
  creditArrow: { fontSize: 20, marginLeft: 4 },
  restoreBtn: { alignItems: "center", paddingVertical: 12 },
  restoreBtnText: { fontSize: 12, textDecorationLine: "underline" },
});
