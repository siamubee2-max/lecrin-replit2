import React, { useEffect, useState, useCallback } from "react";
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
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TryOnHistoryEntry } from "@/app/(tabs)/tryon";
import { getCurrentWeather, getUserLocation, getWeatherForecast, type WeatherData } from "@/services/weather-service";
import { buildDailyGenderLook, type DailyGenderLook } from "@/services/daily-gender-look-service";
import { getStyleProfile, setStyleProfile, type StyleProfile } from "@/services/style-profile-service";
import { adaptDailyLookWithLearning } from "@/services/look-learning-service";
import {
  getCachedDailyLook,
  getCachedWeeklyPlan,
  getCachedFavoritesCount,
  setCachedDailyLook,
  setCachedWeeklyPlan,
  setCachedFavoritesCount,
  type WeeklyPlanCacheItem,
} from "@/services/offline-style-cache-service";
import { buildWeeklyEventPlan } from "@/services/style-planner-service";
import {
  getOrCreateAbAssignments,
  getDefaultAbAssignments,
  recordAbConversion,
  type AbAssignments,
} from "@/services/ab-testing-service";
import {
  buildWardrobeRecommendations,
  type WardrobeRecommendation,
} from "@/services/local-wardrobe-recommendation-service";
import { trackEmergencyLookUsed, trackWardrobeRecommendationApplied } from "@/lib/analytics";

const HISTORY_KEY = "tryon_history";
const LOCAL_COLLECTION_KEY = "@ecrin_local_collection";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STYLE_OPTIONS: { id: StyleProfile; label: string }[] = [
  { id: "elegant", label: "Elegant" },
  { id: "minimal", label: "Minimal" },
  { id: "street", label: "Street" },
  { id: "business", label: "Business" },
];

// Bijoux de démonstration CDN
const CDN = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";
const FEATURED_ITEMS = [
  { id: "1", uri: `${CDN}/AdlrDYXkOyPhDCRC.jpg`, label: "Boucles Étoile" },
  { id: "2", uri: `${CDN}/pmqnnFKjXVuQOvRn.jpg`, label: "Collier Perle" },
  { id: "3", uri: `${CDN}/stRulhTckXsGxDQi.jpg`, label: "Bracelet Or" },
];

type WeeklyLookPlanItem = {
  id: string;
  dayLabel: string;
  weatherLabel: string;
  femme: string;
  homme: string;
  severity: number;
  order: number;
  event: "bureau" | "soiree" | "weekend";
};

const OCCASION_QUICK_ACTIONS: { id: "mariage" | "entretien" | "date" | "voyage"; label: string; icon: string }[] = [
  { id: "mariage", label: "Mariage", icon: "💒" },
  { id: "entretien", label: "Entretien", icon: "💼" },
  { id: "date", label: "Date", icon: "✨" },
  { id: "voyage", label: "Voyage", icon: "✈️" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [recentTryOns, setRecentTryOns] = useState<TryOnHistoryEntry[]>([]);
  const [dailyLook, setDailyLook] = useState<DailyGenderLook | null>(null);
  const [isLoadingDailyLook, setIsLoadingDailyLook] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyLookPlanItem[]>([]);
  const [styleProfile, setStyleProfileState] = useState<StyleProfile>("elegant");
  const [offlineFallbackActive, setOfflineFallbackActive] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [abAssignments, setAbAssignments] = useState<AbAssignments>(getDefaultAbAssignments());
  const [wardrobeRecommendations, setWardrobeRecommendations] = useState<WardrobeRecommendation[]>([]);

  const loadRecentTryOns = useCallback(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (raw) {
        try {
          const all: TryOnHistoryEntry[] = JSON.parse(raw);
          setRecentTryOns(all.slice(0, 3));
        } catch {}
      }
    });
  }, []);

  const loadFavoriteCount = useCallback(() => {
    AsyncStorage.getItem(LOCAL_COLLECTION_KEY)
      .then(async (raw) => {
        if (!raw) {
          const cached = await getCachedFavoritesCount();
          setFavoriteCount(cached);
          return;
        }
        try {
          const items = JSON.parse(raw) as Array<{ isFavorite?: boolean }>;
          const count = Array.isArray(items)
            ? items.filter((i) => i?.isFavorite !== false).length
            : 0;
          setFavoriteCount(count);
          await setCachedFavoritesCount(count);
        } catch {
          const cached = await getCachedFavoritesCount();
          setFavoriteCount(cached);
        }
      })
      .catch(async () => {
        const cached = await getCachedFavoritesCount();
        setFavoriteCount(cached);
      });
  }, []);

  useEffect(() => {
    loadRecentTryOns();
    loadFavoriteCount();
  }, [loadRecentTryOns, loadFavoriteCount]);

  useFocusEffect(
    useCallback(() => {
      loadRecentTryOns();
      loadFavoriteCount();
    }, [loadRecentTryOns, loadFavoriteCount]),
  );

  useEffect(() => {
    getStyleProfile().then(setStyleProfileState).catch(() => undefined);
  }, []);

  useEffect(() => {
    getOrCreateAbAssignments().then(setAbAssignments).catch(() => undefined);
  }, []);

  const loadWardrobeRecommendations = useCallback(async (look: DailyGenderLook | null) => {
    if (!look) {
      setWardrobeRecommendations([]);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(LOCAL_COLLECTION_KEY);
      const items = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
      setWardrobeRecommendations(buildWardrobeRecommendations(look, items));
    } catch {
      setWardrobeRecommendations([]);
    }
  }, []);

  useEffect(() => {
    const loadDailyLook = async () => {
      setIsLoadingDailyLook(true);
      try {
        const location = await getUserLocation();
        const [weather, forecast] = await Promise.all([
          getCurrentWeather(location),
          getWeatherForecast(location, 7),
        ]);
        const rawDailyLook = buildDailyGenderLook(weather, location, styleProfile);
        const adaptedDaily = await adaptDailyLookWithLearning(rawDailyLook);
        setDailyLook(adaptedDaily);
        const weeklyItems = forecast.daily.slice(0, 7).map((day, idx) => {
          const conditionSeverity =
            day.condition === "stormy" ? 5 :
            day.condition === "snowy" ? 4 :
            day.condition === "rainy" ? 3 :
            day.condition === "windy" ? 3 :
            day.condition === "cold" ? 2 :
            day.condition === "hot" ? 2 : 1;
          const thermalSeverity = day.temperatureMax >= 32 || day.temperatureMin <= 0 ? 2 : 0;
          const severity = conditionSeverity + thermalSeverity;
          const syntheticWeather: WeatherData = {
            temperature: Math.round((day.temperatureMax + day.temperatureMin) / 2),
            apparentTemperature: Math.round((day.temperatureMax + day.temperatureMin) / 2),
            condition: day.condition,
            humidity: 50,
            windSpeed: 15,
            windGusts: 20,
            precipitation: day.condition === "rainy" || day.condition === "stormy" ? 2 : 0,
            uvIndex: 4,
            description: day.description,
            icon: day.icon,
            isDay: true,
            city: location.city,
            country: location.country,
          };
          const look = buildDailyGenderLook(syntheticWeather, location, styleProfile, day.date);
          const weekday = day.date.getDay();
          const event: "bureau" | "soiree" | "weekend" =
            weekday === 0 || weekday === 6 ? "weekend" : weekday === 5 ? "soiree" : "bureau";
          return {
            id: `${idx}-${day.date.toISOString()}`,
            dayLabel: day.date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
            weatherLabel: `${day.icon} ${day.temperatureMin}°/${day.temperatureMax}°`,
            femme: `${look.femme.pieces[0]} + ${look.femme.shoes}`,
            homme: `${look.homme.pieces[0]} + ${look.homme.shoes}`,
            severity,
            order: idx,
            event,
          };
        }).sort((a, b) => {
          const parseWeekday = (label: string) => {
            const normalized = label.toLowerCase();
            if (normalized.startsWith("lun")) return 1;
            if (normalized.startsWith("mar")) return 2;
            if (normalized.startsWith("mer")) return 3;
            if (normalized.startsWith("jeu")) return 4;
            if (normalized.startsWith("ven")) return 5;
            if (normalized.startsWith("sam")) return 6;
            return 7; // dimanche
          };
          return parseWeekday(a.dayLabel) - parseWeekday(b.dayLabel);
        });
        setOfflineFallbackActive(false);
        setWeeklyPlan(weeklyItems);
        await loadWardrobeRecommendations(adaptedDaily);
        await Promise.all([
          setCachedDailyLook(adaptedDaily),
          setCachedWeeklyPlan(weeklyItems as WeeklyPlanCacheItem[]),
        ]);
      } catch (error) {
        console.error("[Home] Failed to load daily look:", error);
        const [cachedDaily, cachedWeekly] = await Promise.all([
          getCachedDailyLook(),
          getCachedWeeklyPlan(),
        ]);
        if (cachedDaily) {
          setDailyLook(cachedDaily);
          await loadWardrobeRecommendations(cachedDaily);
          setWeeklyPlan(
            cachedWeekly.map((item, idx) => ({
              ...item,
              event: item.event ?? buildWeeklyEventPlan(new Date(), 7)[idx]?.event ?? "bureau",
            })) as WeeklyLookPlanItem[],
          );
          setOfflineFallbackActive(true);
        } else {
          setDailyLook(null);
          setWardrobeRecommendations([]);
          setWeeklyPlan([]);
          setOfflineFallbackActive(true);
        }
      } finally {
        setIsLoadingDailyLook(false);
      }
    };
    loadDailyLook();
  }, [styleProfile, loadWardrobeRecommendations]);

  const hasEmergencyWeather = Boolean(
    dailyLook &&
      (dailyLook.alerts.includes("Pluie") ||
        dailyLook.alerts.includes("Neige") ||
        dailyLook.alerts.includes("Gel") ||
        dailyLook.alerts.includes("Vent")),
  );

  const handleStartTryOn = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void recordAbConversion("homeCta", abAssignments.homeCta);
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
              accessibilityLabel="Logo L'Écrin Virtuel"
            />
            <View style={styles.logoText}>
              <Text style={[styles.brandName, { color: colors.foreground }]}>L'ÉCRIN</Text>
              <Text style={[styles.brandSub, { color: colors.primary }]}>VIRTUEL</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push("/observability")}
              style={[styles.profileBtn, { borderColor: colors.border }]}
            >
              <IconSymbol name="chart.bar.fill" size={18} color={colors.primary} />
            </TouchableOpacity>
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
              {abAssignments.homeCta === "A" ? "Nouvel Essayage" : "Essayer Maintenant"}
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
            variant={abAssignments.homeCards}
          />
          <ActionCard
            label="Mon Écrin"
            sub="Ma collection"
            icon="diamond.fill"
            onPress={() => router.push("/ecrin")}
            colors={colors}
            accent
            variant={abAssignments.homeCards}
          />
          <ActionCard
            label="Boutique"
            sub="Créateurs"
            icon="storefront.fill"
            onPress={() => router.push("/boutique")}
            colors={colors}
            variant={abAssignments.homeCards}
          />
          <ActionCard
            label="Communauté"
            sub="Inspirations"
            icon="person.2.fill"
            onPress={() => router.push("/community")}
            colors={colors}
            variant={abAssignments.homeCards}
          />
        </View>

        {/* ── Look du jour météo (Accueil) ─────────────────────────────── */}
        <View style={[styles.dailyLookSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyLookHeader}>
            <View style={styles.dailyLookTitleRow}>
              <Text style={styles.dailyLookTitleIcon}>✦</Text>
              <Text style={[styles.dailyLookTitle, { color: colors.foreground }]}>LOOK DU JOUR MÉTÉO</Text>
            </View>
            {isLoadingDailyLook ? (
              <Text style={[styles.dailyLookMeta, { color: colors.muted }]}>Chargement...</Text>
            ) : (
              <Text style={[styles.dailyLookMeta, { color: colors.primary }]}>
                {dailyLook?.weatherLabel ?? "Indisponible"}
              </Text>
            )}
          </View>

          {dailyLook ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  void recordAbConversion("dailyLookDetail", abAssignments.dailyLookDetail);
                  router.push("/daily-look");
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dailyLookDetailsLink, { color: colors.primary }]}>
                  {abAssignments.dailyLookDetail === "A"
                    ? "Voir le détail complet →"
                    : "Ouvrir le look détaillé →"}
                </Text>
              </TouchableOpacity>
              <View style={styles.dailyMetaRow}>
                <Text style={[styles.dailyMetaItem, { color: colors.muted }]}>
                  Favoris locaux: {favoriteCount}
                </Text>
                {offlineFallbackActive && (
                  <Text style={[styles.dailyMetaItem, { color: colors.primary }]}>Mode hors-ligne actif</Text>
                )}
              </View>
              {hasEmergencyWeather && (
                <TouchableOpacity
                  onPress={() => {
                    const reason = dailyLook?.alerts.join(" • ") ?? "Alerte météo";
                    trackEmergencyLookUsed({ reason, source: "home" });
                    router.push({
                      pathname: "/(tabs)/tryon",
                      params: {
                        section: dailyLook?.alerts.includes("Neige") || dailyLook?.alerts.includes("Pluie") ? "shoes" : "clothing",
                        itemId:
                          dailyLook?.alerts.includes("Neige") || dailyLook?.alerts.includes("Pluie")
                            ? "boots-black"
                            : "blazer-camel",
                        itemName: "Mode urgence météo",
                      },
                    });
                  }}
                  style={[styles.emergencyButton, { borderColor: colors.primary, backgroundColor: colors.primary + "18" }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.emergencyButtonText, { color: colors.foreground }]}>⚡ Mode urgence météo (1 tap)</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.dailyLookLocation, { color: colors.muted }]}>{dailyLook.locationLabel}</Text>
              {dailyLook.alerts.length > 0 && (
                <Text style={[styles.dailyLookAlerts, { color: colors.primary }]}>
                  Alertes: {dailyLook.alerts.join(" • ")}
                </Text>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weatherHighlightsRow}>
                {dailyLook.weatherHighlights.map((h) => (
                  <View key={h} style={[styles.weatherHighlightChip, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <Text style={[styles.weatherHighlightText, { color: colors.muted }]}>{h}</Text>
                  </View>
                ))}
              </ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleProfileRow}>
                {STYLE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={async () => {
                      setStyleProfileState(option.id);
                      await setStyleProfile(option.id);
                    }}
                    style={[
                      styles.styleProfileChip,
                      {
                        borderColor: styleProfile === option.id ? colors.primary : colors.border,
                        backgroundColor: styleProfile === option.id ? colors.primary + "20" : colors.background,
                      },
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: styleProfile === option.id ? colors.foreground : colors.muted, fontSize: 10, fontWeight: "700" }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.dailyLookGrid}>
                <View style={[styles.dailyLookCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.dailyLookCardTitle, { color: colors.foreground }]}>Femme</Text>
                  <Text style={[styles.dailyLookLine, { color: colors.foreground }]}>
                    {dailyLook.femme.pieces.join(" + ")}
                  </Text>
                  {dailyLook.femme.outerwear ? (
                    <Text style={[styles.dailyLookLine, { color: colors.foreground }]}>
                      Couche: {dailyLook.femme.outerwear}
                    </Text>
                  ) : null}
                  <Text style={[styles.dailyLookLine, { color: colors.foreground }]}>
                    Chaussures: {dailyLook.femme.shoes}
                  </Text>
                </View>
                <View style={[styles.dailyLookCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.dailyLookCardTitle, { color: colors.foreground }]}>Homme</Text>
                  <Text style={[styles.dailyLookLine, { color: colors.foreground }]}>
                    {dailyLook.homme.pieces.join(" + ")}
                  </Text>
                  {dailyLook.homme.outerwear ? (
                    <Text style={[styles.dailyLookLine, { color: colors.foreground }]}>
                      Couche: {dailyLook.homme.outerwear}
                    </Text>
                  ) : null}
                  <Text style={[styles.dailyLookLine, { color: colors.foreground }]}>
                    Chaussures: {dailyLook.homme.shoes}
                  </Text>
                </View>
              </View>
              {weeklyPlan.length > 0 && (
                <View style={[styles.weeklyPlanSection, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.weeklyPlanTitle, { color: colors.foreground }]}>Plan looks 7 jours</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weeklyPlanRow}>
                    {weeklyPlan.map((item) => (
                      <View key={item.id} style={[styles.weeklyPlanCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                        {item.severity >= 5 && (
                          <View style={[styles.weeklyPriorityBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.weeklyPriorityBadgeText, { color: colors.foreground }]}>⚠️ Prioritaire</Text>
                          </View>
                        )}
                        <Text style={[styles.weeklyPlanDay, { color: colors.foreground }]}>{item.dayLabel}</Text>
                        <Text style={[styles.weeklyPlanEvent, { color: colors.muted }]}>
                          {item.event === "bureau" ? "Bureau" : item.event === "soiree" ? "Soirée" : "Weekend"}
                        </Text>
                        <Text style={[styles.weeklyPlanWeather, { color: colors.primary }]}>{item.weatherLabel}</Text>
                        <Text style={[styles.weeklyPlanLine, { color: colors.foreground }]}>♀ {item.femme}</Text>
                        <Text style={[styles.weeklyPlanLine, { color: colors.foreground }]}>♂ {item.homme}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={[styles.weeklyPlanSection, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.weeklyPlanTitle, { color: colors.foreground }]}>Assistant occasion</Text>
                <View style={styles.occasionQuickRow}>
                  {OCCASION_QUICK_ACTIONS.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      onPress={() =>
                        router.push({
                          pathname: "/daily-look",
                          params: { occasion: action.id },
                        })
                      }
                      style={[styles.occasionQuickChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.occasionQuickIcon}>{action.icon}</Text>
                      <Text style={[styles.occasionQuickText, { color: colors.foreground }]}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {wardrobeRecommendations.length > 0 && (
                <View style={[styles.weeklyPlanSection, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.weeklyPlanTitle, { color: colors.foreground }]}>Déjà dans votre dressing</Text>
                  <View style={styles.occasionQuickRow}>
                    {wardrobeRecommendations.map((rec) => (
                      <TouchableOpacity
                        key={rec.id}
                        onPress={() => {
                          trackWardrobeRecommendationApplied({ type: rec.type, source: "home" });
                          router.push("/(tabs)/dressing");
                        }}
                        style={[styles.occasionQuickChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.occasionQuickIcon}>🧷</Text>
                        <View>
                          <Text style={[styles.occasionQuickText, { color: colors.foreground }]}>{rec.name}</Text>
                          <Text style={{ color: colors.muted, fontSize: 10 }}>{rec.reason}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.dailyLookFallback, { color: colors.muted }]}>
              Impossible de charger le conseil météo pour le moment.
            </Text>
          )}
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
              <Image
                source={{ uri: item.uri }}
                style={styles.galleryImg}
                contentFit="cover"
                accessibilityLabel={item.label}
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
                  <Image
                    source={{ uri: entry.resultImageUrl }}
                    style={styles.recentImg}
                    contentFit="cover"
                    accessibilityLabel={`Essayage récent : ${entry.itemName}`}
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
  variant = "A",
}: {
  label: string;
  sub: string;
  icon: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  accent?: boolean;
  variant?: "A" | "B";
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionCard,
        {
          backgroundColor: accent ? colors.foreground : colors.surface,
          borderColor: accent ? colors.primary : colors.border,
          borderRadius: variant === "B" ? 16 : 2,
          shadowColor: variant === "B" ? "#000" : "transparent",
          shadowOpacity: variant === "B" ? 0.12 : 0,
          shadowOffset: variant === "B" ? { width: 0, height: 8 } : { width: 0, height: 0 },
          shadowRadius: variant === "B" ? 14 : 0,
          elevation: variant === "B" ? 3 : 0,
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

  // Daily weather looks
  dailyLookSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  dailyLookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  dailyLookTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dailyLookTitleIcon: {
    fontSize: 12,
    color: "#C9A96E",
  },
  dailyLookTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
  },
  dailyLookDetailsLink: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dailyMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  dailyMetaItem: {
    fontSize: 10,
    fontWeight: "600",
  },
  weatherHighlightsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  weatherHighlightChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  weatherHighlightText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  dailyLookMeta: {
    fontSize: 10,
    fontWeight: "600",
  },
  dailyLookLocation: {
    fontSize: 11,
    fontWeight: "400",
  },
  dailyLookAlerts: {
    fontSize: 11,
    fontWeight: "600",
  },
  dailyLookGrid: {
    flexDirection: "row",
    gap: 8,
  },
  styleProfileRow: {
    gap: 6,
    paddingVertical: 4,
  },
  styleProfileChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  dailyLookCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  dailyLookCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dailyLookLine: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "400",
  },
  dailyLookFallback: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "400",
  },
  emergencyButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  emergencyButtonText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  weeklyPlanSection: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  weeklyPlanTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  weeklyPlanRow: {
    gap: 8,
  },
  weeklyPlanCard: {
    width: 172,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    gap: 4,
    overflow: "hidden",
  },
  weeklyPriorityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 2,
  },
  weeklyPriorityBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  weeklyPlanDay: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  weeklyPlanEvent: {
    fontSize: 10,
    fontWeight: "600",
  },
  weeklyPlanWeather: {
    fontSize: 11,
    fontWeight: "600",
  },
  weeklyPlanLine: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  occasionQuickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  occasionQuickChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  occasionQuickIcon: {
    fontSize: 12,
  },
  occasionQuickText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
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
