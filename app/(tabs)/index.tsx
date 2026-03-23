import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TryOnHistoryEntry } from "@/app/(tabs)/tryon";

const HISTORY_KEY = "tryon_history";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Bijoux de démonstration CDN
const CDN = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";
const FEATURED_ITEMS = [
  { id: "1", uri: `${CDN}/AdlrDYXkOyPhDCRC.jpg`, label: "Boucles Étoile" },
  { id: "2", uri: `${CDN}/pmqnnFKjXVuQOvRn.jpg`, label: "Collier Perle" },
  { id: "3", uri: `${CDN}/stRulhTckXsGxDQi.jpg`, label: "Bracelet Or" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [recentTryOns, setRecentTryOns] = useState<TryOnHistoryEntry[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try {
          const all: TryOnHistoryEntry[] = JSON.parse(raw);
          setRecentTryOns(all.slice(0, 3));
        } catch {}
      }
    });
  }, []);

  const handleStartTryOn = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/tryon");
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <View style={styles.logoText}>
              <Text style={[styles.brandName, { color: colors.foreground }]}>L'ÉCRIN</Text>
              <Text style={[styles.brandSub, { color: colors.primary }]}>VIRTUEL</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {!isAuthenticated && (
              <TouchableOpacity
                onPress={() => router.push("/login")}
                style={[styles.loginChip, { borderColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginChipText, { color: colors.primary }]}>SE CONNECTER</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={[styles.profileBtn, { borderColor: colors.border }]}
            >
              <IconSymbol name="person.fill" size={18} color={isAuthenticated ? colors.primary : colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Séparateur or ────────────────────────────────────────────── */}
        <View style={[styles.goldLine, { backgroundColor: colors.primary }]} />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.foreground }]}>
          {/* Badge */}
          <View style={[styles.badge, { borderColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              ESSAYAGE VIRTUEL
            </Text>
          </View>

          {/* Titre principal */}
          <Text style={[styles.heroTitle, { color: colors.background }]}>
            Essayez{"\n"}l'inaccessible
          </Text>
          <Text style={[styles.heroItalic, { color: colors.primary }]}>
            Virtuellement.
          </Text>

          <Text style={[styles.heroDesc, { color: colors.background + "CC" }]}>
            Importez un bijou, choisissez votre photo, et laissez la magie opérer.
            Visualisez le résultat avant d'acheter ou juste pour rêver.
          </Text>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleStartTryOn}
            style={[styles.heroCta, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.heroCtaText, { color: colors.foreground }]}>
              Nouvel Essayage
            </Text>
            <IconSymbol name="chevron.right" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* ── Actions rapides ──────────────────────────────────────────── */}
        <View style={styles.actionsGrid}>
          <ActionCard
            label="Photographier"
            sub="Capturer un bijou"
            icon="camera.fill"
            onPress={() => router.push("/capture")}
            colors={colors}
          />
          <ActionCard
            label="Mon Écrin"
            sub="Ma collection"
            icon="diamond.fill"
            onPress={() => router.push("/ecrin")}
            colors={colors}
            accent
          />
          <ActionCard
            label="Boutique"
            sub="Créateurs"
            icon="storefront.fill"
            onPress={() => router.push("/boutique")}
            colors={colors}
          />
          <ActionCard
            label="Communauté"
            sub="Inspirations"
            icon="person.2.fill"
            onPress={() => router.push("/community")}
            colors={colors}
          />
        </View>

        {/* ── Séparateur ───────────────────────────────────────────────── */}
        <View style={[styles.sectionDivider, { borderColor: colors.border }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerLabel, { color: colors.muted }]}>COLLECTION</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Galerie démo ─────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galleryRow}
        >
          {FEATURED_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={handleStartTryOn}
              style={[styles.galleryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.85}
            >
              <ImageWithFallback
                source={{ uri: item.uri }}
                style={styles.galleryImg}
                contentFit="cover"
              />
              <View style={styles.galleryOverlay}>
                <Text style={styles.galleryLabel}>{item.label}</Text>
                <Text style={[styles.galleryAction, { color: colors.primary }]}>Essayer →</Text>
              </View>
            </TouchableOpacity>
          ))}
          {/* Carte "Voir tout" */}
          <TouchableOpacity
            onPress={() => router.push("/boutique")}
            style={[styles.galleryCardMore, { backgroundColor: colors.foreground }]}
            activeOpacity={0.85}
          >
            <IconSymbol name="chevron.right" size={28} color={colors.primary} />
            <Text style={[styles.galleryMoreText, { color: colors.primary }]}>Voir{"\n"}tout</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Essayages récents ─────────────────────────────────────────── */}
        {recentTryOns.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={[styles.recentTitle, { color: colors.foreground }]}>MES ESSAYAGES RÉCENTS</Text>
              <TouchableOpacity onPress={() => router.push("/tryon-history")} activeOpacity={0.7}>
                <Text style={[styles.recentSeeAll, { color: colors.primary }]}>Voir tout →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRow}
            >
              {recentTryOns.map((entry, idx) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => router.push("/tryon-history")}
                  style={[styles.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.85}
                >
                  <ImageWithFallback
                    source={{ uri: entry.resultImageUrl }}
                    style={styles.recentImg}
                    contentFit="cover"
                  />
                  <View style={styles.recentOverlay}>
                    <Text style={styles.recentItemName} numberOfLines={1}>{entry.itemName}</Text>
                    <Text style={[styles.recentDate, { color: colors.primary }]}>
                      {new Date(entry.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  {idx === 0 && (
                    <View style={[styles.recentBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.recentBadgeText}>DERNIER</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={handleStartTryOn}
                style={[styles.recentCardNew, { backgroundColor: colors.foreground }]}
                activeOpacity={0.85}
              >
                <IconSymbol name="wand.and.stars" size={24} color={colors.primary} />
                <Text style={[styles.recentNewText, { color: colors.primary }]}>Nouvel{"\n"}essayage</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <View style={[styles.goldLineThin, { backgroundColor: colors.primary }]} />
          <Text style={[styles.footerText, { color: colors.muted }]}>
            L'ÉCRIN VIRTUEL © 2025
          </Text>
          <Text style={[styles.footerSub, { color: colors.muted }]}>
            LUXE & TECHNOLOGIE
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

// ── Composant ActionCard ────────────────────────────────────────────────────
function ActionCard({
  label,
  sub,
  icon,
  onPress,
  colors,
  accent = false,
}: {
  label: string;
  sub: string;
  icon: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionCard,
        {
          backgroundColor: accent ? colors.foreground : colors.surface,
          borderColor: accent ? colors.primary : colors.border,
        },
      ]}
      activeOpacity={0.82}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: accent ? colors.primary + "30" : colors.border + "60" }]}>
        <IconSymbol
          name={icon as any}
          size={22}
          color={accent ? colors.primary : colors.muted}
        />
      </View>
      <Text style={[styles.actionLabel, { color: accent ? colors.background : colors.foreground }]}>
        {label}
      </Text>
      <Text style={[styles.actionSub, { color: accent ? colors.background + "99" : colors.muted }]}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 6 },
  logoText: { gap: 0 },
  brandName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 3,
    lineHeight: 20,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 4,
    lineHeight: 14,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loginChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 2,
  },
  loginChipText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Ligne or
  goldLine: { height: 1, marginHorizontal: 20, marginBottom: 20, opacity: 0.6 },
  goldLineThin: { height: 0.5, width: 60, alignSelf: "center", marginBottom: 12, opacity: 0.6 },

  // Hero
  hero: {
    marginHorizontal: 16,
    borderRadius: 4,
    padding: 28,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2.5,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: "300",
    letterSpacing: 0.5,
    lineHeight: 40,
    marginBottom: 4,
  },
  heroItalic: {
    fontSize: 34,
    fontStyle: "italic",
    fontWeight: "300",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "300",
    marginBottom: 24,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 28,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  actionSub: {
    fontSize: 11,
    fontWeight: "300",
    letterSpacing: 0.2,
  },

  // Divider
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 0.5 },
  dividerLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 3,
  },

  // Gallery
  galleryRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  galleryCard: {
    width: 140,
    height: 180,
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: 1,
  },
  galleryImg: {
    width: "100%",
    height: "100%",
  },
  galleryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 10,
  },
  galleryLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  galleryAction: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  galleryCardMore: {
    width: 80,
    height: 180,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  galleryMoreText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },

  // Footer
  footer: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 8,
    gap: 4,
  },
  footerText: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 3,
  },
  footerSub: {
    fontSize: 8,
    fontWeight: "300",
    letterSpacing: 2,
  },

  // Essayages récents
  recentSection: {
    marginTop: 28,
    marginBottom: 8,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
  recentSeeAll: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  recentRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  recentCard: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  recentImg: {
    width: "100%",
    height: "100%",
  },
  recentOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
  },
  recentItemName: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  recentDate: {
    fontSize: 9,
    fontWeight: "500",
    marginTop: 2,
  },
  recentBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recentBadgeText: {
    color: "#0A1A3B",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  recentCardNew: {
    width: 90,
    height: 160,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  recentNewText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
