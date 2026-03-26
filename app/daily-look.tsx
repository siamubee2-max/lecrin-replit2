import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { DEFAULT_LOCATION, getCurrentWeather, getUserLocation, type WeatherData } from "@/services/weather-service";
import {
  buildDailyGenderLook,
  buildDailyLookVariants,
  type DailyGenderLook,
  type DailyLookVariant,
} from "@/services/daily-gender-look-service";
import { getStyleProfile } from "@/services/style-profile-service";
import { buildOccasionLook, type OccasionType } from "@/services/style-planner-service";
import { getCachedDailyLook, setCachedDailyLook } from "@/services/offline-style-cache-service";
import { getOrCreateAbAssignments, getDefaultAbAssignments, recordAbConversion, type AbAssignments } from "@/services/ab-testing-service";
import { trackDailyLookViewed, trackEmergencyLookUsed, trackWardrobeRecommendationApplied } from "@/lib/analytics";
import {
  buildWardrobeRecommendations,
  type WardrobeRecommendation,
} from "@/services/local-wardrobe-recommendation-service";

export default function DailyLookScreen() {
  const params = useLocalSearchParams<{ occasion?: string }>();
  const colors = useColors();
  const scrollRef = useRef<ScrollView>(null);
  const occasionBlockYRef = useRef(0);
  const [dailyLook, setDailyLook] = useState<DailyGenderLook | null>(null);
  const [variants, setVariants] = useState<DailyLookVariant[]>([]);
  const initialOccasion = useMemo<OccasionType>(() => {
    const occ = (params.occasion ?? "").toString().toLowerCase();
    if (occ === "mariage" || occ === "entretien" || occ === "date" || occ === "voyage") {
      return occ;
    }
    return "mariage";
  }, [params.occasion]);
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>(initialOccasion);
  const [loading, setLoading] = useState(false);
  const [abAssignments, setAbAssignments] = useState<AbAssignments>(getDefaultAbAssignments());
  const hasTrackedViewRef = useRef(false);
  const [wardrobeRecommendations, setWardrobeRecommendations] = useState<WardrobeRecommendation[]>([]);

  useEffect(() => {
    setSelectedOccasion(initialOccasion);
  }, [initialOccasion]);

  useEffect(() => {
    getOrCreateAbAssignments().then(setAbAssignments).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!params.occasion) return;
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, occasionBlockYRef.current - 16), animated: true });
    }, 180);
    return () => clearTimeout(timer);
  }, [params.occasion, loading]);

  const weatherTone = dailyLook?.alerts.includes("Pluie")
    ? "#0A7EA4"
    : dailyLook?.alerts.includes("Neige")
      ? "#6A9CCF"
      : dailyLook?.alerts.includes("Gel")
        ? "#5B7EA4"
        : dailyLook?.alerts.includes("UV fort")
          ? "#C9A96E"
          : "#7A8A99";
  const hasEmergencyWeather = Boolean(
    dailyLook &&
      (dailyLook.alerts.includes("Pluie") ||
        dailyLook.alerts.includes("Neige") ||
        dailyLook.alerts.includes("Gel") ||
        dailyLook.alerts.includes("Vent")),
  );

  const applyVariant = (variant: DailyLookVariant) => {
    void recordAbConversion("dailyLookDetail", abAssignments.dailyLookDetail);
    if (variant.id === "bureau") {
      router.push({
        pathname: "/(tabs)/tryon",
        params: {
          section: "clothing",
          itemId: "blazer-camel",
          itemName: "Blazer bureau",
        },
      });
      return;
    }
    if (variant.id === "soir") {
      router.push({
        pathname: "/(tabs)/tryon",
        params: {
          section: "jewelry",
          itemId: "moni-necklace",
          itemName: "Collier soirée",
          presetSubType: "necklace",
        },
      });
      return;
    }
    router.push({
      pathname: "/(tabs)/tryon",
      params: {
        section: "accessories",
        itemId: "scarf-beige",
        itemName: "Accessoire pluie",
        presetSubType: "scarf",
      },
    });
  };

  const buildGuidedSteps = (variant: DailyLookVariant) => {
    if (variant.id === "bureau") {
      return [
        { section: "clothing", itemId: "blazer-camel", itemName: "Blazer bureau", presetSubType: "" },
        { section: "accessories", itemId: "belt-gold", itemName: "Ceinture dorée", presetSubType: "belt" },
        { section: "jewelry", itemId: "geometrique", itemName: "Boucles géométriques", presetSubType: "earrings" },
      ];
    }
    if (variant.id === "soir") {
      return [
        { section: "clothing", itemId: "dress-black", itemName: "Robe noire", presetSubType: "" },
        { section: "jewelry", itemId: "moni-necklace", itemName: "Collier soirée", presetSubType: "necklace" },
        { section: "shoes", itemId: "heels-gold", itemName: "Escarpins dorés", presetSubType: "" },
      ];
    }
    return [
      { section: "clothing", itemId: "blazer-camel", itemName: "Veste déperlante chic", presetSubType: "" },
      { section: "accessories", itemId: "scarf-beige", itemName: "Écharpe pluie", presetSubType: "scarf" },
      { section: "shoes", itemId: "boots-black", itemName: "Bottines pluie", presetSubType: "" },
    ];
  };

  const startGuidedVariant = (variant: DailyLookVariant) => {
    void recordAbConversion("dailyLookDetail", abAssignments.dailyLookDetail);
    const steps = buildGuidedSteps(variant);
    const first = steps[0];
    router.push({
      pathname: "/(tabs)/tryon",
      params: {
        section: first.section,
        itemId: first.itemId,
        itemName: first.itemName,
        ...(first.presetSubType ? { presetSubType: first.presetSubType } : {}),
        guideSteps: JSON.stringify(steps),
        guideIndex: "0",
      },
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [location, profile] = await Promise.all([getUserLocation(), getStyleProfile()]);
      const weather = await getCurrentWeather(location);
      const base = buildDailyGenderLook(weather, location, profile);
      setDailyLook(base);
      setVariants(buildDailyLookVariants(base));
      const localCollectionRaw = await AsyncStorage.getItem("@ecrin_local_collection");
      const localCollection = localCollectionRaw ? (JSON.parse(localCollectionRaw) as Array<Record<string, unknown>>) : [];
      setWardrobeRecommendations(buildWardrobeRecommendations(base, localCollection));
      await setCachedDailyLook(base);
      if (!hasTrackedViewRef.current) {
        trackDailyLookViewed({
          source: params.occasion ? "occasion" : "home",
          occasion: params.occasion ? String(params.occasion) : undefined,
        });
        hasTrackedViewRef.current = true;
      }
    } catch (error) {
      console.error("[DailyLook] Load failed:", error);
      const cached = await getCachedDailyLook();
      if (cached) {
        setDailyLook(cached);
        setVariants(buildDailyLookVariants(cached));
        const localCollectionRaw = await AsyncStorage.getItem("@ecrin_local_collection");
        const localCollection = localCollectionRaw ? (JSON.parse(localCollectionRaw) as Array<Record<string, unknown>>) : [];
        setWardrobeRecommendations(buildWardrobeRecommendations(cached, localCollection));
        if (!hasTrackedViewRef.current) {
          trackDailyLookViewed({
            source: params.occasion ? "occasion" : "home",
            occasion: params.occasion ? String(params.occasion) : undefined,
          });
          hasTrackedViewRef.current = true;
        }
      } else {
        const profile = await getStyleProfile().catch(() => "elegant" as const);
        const offlineWeather: WeatherData = {
          temperature: 20,
          apparentTemperature: 20,
          condition: "mild",
          humidity: 50,
          windSpeed: 10,
          windGusts: 15,
          precipitation: 0,
          uvIndex: 3,
          description: "Mode hors-ligne",
          icon: "🌤️",
          isDay: true,
          city: DEFAULT_LOCATION.city,
          country: DEFAULT_LOCATION.country,
        };
        const base = buildDailyGenderLook(offlineWeather, DEFAULT_LOCATION, profile);
        setDailyLook(base);
        setVariants(buildDailyLookVariants(base));
        const localCollectionRaw = await AsyncStorage.getItem("@ecrin_local_collection");
        const localCollection = localCollectionRaw ? (JSON.parse(localCollectionRaw) as Array<Record<string, unknown>>) : [];
        setWardrobeRecommendations(buildWardrobeRecommendations(base, localCollection));
        if (!hasTrackedViewRef.current) {
          trackDailyLookViewed({
            source: params.occasion ? "occasion" : "home",
            occasion: params.occasion ? String(params.occasion) : undefined,
          });
          hasTrackedViewRef.current = true;
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground ml-2">Détail Look du Jour</Text>
        </View>
        <TouchableOpacity
          onPress={load}
          className="px-3 py-1 rounded-full"
          style={{ borderWidth: 1, borderColor: colors.border }}
          disabled={loading}
        >
          <Text className="text-xs text-foreground">{loading ? "..." : "Actualiser"}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}>
          {dailyLook ? (
            <>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: weatherTone,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", letterSpacing: 0.5 }}>
                  {dailyLook.weatherLabel}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                  {dailyLook.locationLabel} • Style: {dailyLook.styleProfile}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {dailyLook.weatherHighlights.map((line) => (
                    <View
                      key={line}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.background,
                      }}
                    >
                      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "600" }}>{line}</Text>
                    </View>
                  ))}
                </View>
                {dailyLook.alerts.length > 0 && (
                  <Text style={{ color: colors.primary, fontSize: 12, marginTop: 8 }}>
                    Alertes: {dailyLook.alerts.join(" • ")}
                  </Text>
                )}
                {hasEmergencyWeather && (
                  <TouchableOpacity
                    onPress={() => {
                      trackEmergencyLookUsed({
                        reason: dailyLook.alerts.join(" • "),
                        source: "daily-look",
                      });
                      router.push({
                        pathname: "/(tabs)/tryon",
                        params: {
                          section:
                            dailyLook.alerts.includes("Neige") || dailyLook.alerts.includes("Pluie")
                              ? "shoes"
                              : "clothing",
                          itemId:
                            dailyLook.alerts.includes("Neige") || dailyLook.alerts.includes("Pluie")
                              ? "boots-black"
                              : "blazer-camel",
                          itemName: "Mode urgence météo",
                        },
                      });
                    }}
                    style={{
                      marginTop: 10,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + "20",
                      borderRadius: 10,
                      paddingVertical: 9,
                      alignItems: "center",
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "700" }}>
                      ⚡ Basculer en mode urgence météo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {wardrobeRecommendations.length > 0 && (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    gap: 8,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>
                    Recos depuis votre dressing
                  </Text>
                  {wardrobeRecommendations.map((rec) => (
                    <TouchableOpacity
                      key={rec.id}
                      onPress={() => {
                        trackWardrobeRecommendationApplied({ type: rec.type, source: "daily-look" });
                        router.push("/(tabs)/dressing");
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        backgroundColor: colors.background,
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>
                        {rec.name}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 11 }}>{rec.reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {variants.map((variant) => (
                <View
                  key={variant.id}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>{variant.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{variant.subtitle}</Text>
                  </View>

                  <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: colors.background }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>Femme</Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, marginTop: 2 }}>
                      Pieces: {variant.femme.pieces.join(" + ")}
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 12 }}>
                      Chaussures: {variant.femme.shoes}
                    </Text>
                    {variant.femme.outerwear ? (
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>
                        Couche: {variant.femme.outerwear}
                      </Text>
                    ) : null}
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                      Accessoires: {variant.femme.accessories.join(", ")}
                    </Text>
                  </View>

                  <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: colors.background }}>
                    <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "700" }}>Homme</Text>
                    <Text style={{ color: colors.foreground, fontSize: 12, marginTop: 2 }}>
                      Pieces: {variant.homme.pieces.join(" + ")}
                    </Text>
                    <Text style={{ color: colors.foreground, fontSize: 12 }}>
                      Chaussures: {variant.homme.shoes}
                    </Text>
                    {variant.homme.outerwear ? (
                      <Text style={{ color: colors.foreground, fontSize: 12 }}>
                        Couche: {variant.homme.outerwear}
                      </Text>
                    ) : null}
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>
                      Accessoires: {variant.homme.accessories.join(", ")}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => applyVariant(variant)}
                    style={{
                      marginTop: 2,
                      borderWidth: 1,
                      borderColor: weatherTone,
                      backgroundColor: weatherTone + "22",
                      borderRadius: 10,
                      paddingVertical: 11,
                      alignItems: "center",
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
                      {abAssignments.dailyLookDetail === "A"
                        ? "APPLIQUER CE LOOK DANS ESSAYER"
                        : "ESSAYER DIRECTEMENT CE LOOK"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => startGuidedVariant(variant)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      borderRadius: 10,
                      paddingVertical: 11,
                      alignItems: "center",
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
                      DÉMARRER LOOK COMPLET (3 ÉTAPES)
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {dailyLook && (
                <View
                  onLayout={(e) => {
                    occasionBlockYRef.current = e.nativeEvent.layout.y;
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: "700" }}>
                    Assistant occasion (1 clic)
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {(["mariage", "entretien", "date", "voyage"] as OccasionType[]).map((occ) => (
                      <TouchableOpacity
                        key={occ}
                        onPress={() => setSelectedOccasion(occ)}
                        style={{
                          borderWidth: 1,
                          borderColor: selectedOccasion === occ ? colors.primary : colors.border,
                          backgroundColor: selectedOccasion === occ ? colors.primary + "20" : colors.background,
                          borderRadius: 999,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={{ color: selectedOccasion === occ ? colors.foreground : colors.muted, fontSize: 11, fontWeight: "700" }}>
                          {occ === "mariage"
                            ? "Mariage"
                            : occ === "entretien"
                              ? "Entretien"
                              : occ === "date"
                                ? "Date"
                                : "Voyage"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {(() => {
                    const plan = buildOccasionLook(dailyLook, selectedOccasion);
                    return (
                      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, backgroundColor: colors.background, gap: 6 }}>
                        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700" }}>{plan.title}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{plan.subtitle}</Text>
                        <Text style={{ color: colors.foreground, fontSize: 11 }}>
                          Femme: {plan.femme.pieces.slice(0, 2).join(" + ")} • {plan.femme.shoes}
                        </Text>
                        <Text style={{ color: colors.foreground, fontSize: 11 }}>
                          Homme: {plan.homme.pieces.slice(0, 2).join(" + ")} • {plan.homme.shoes}
                        </Text>
                        <Text style={{ color: colors.primary, fontSize: 11 }}>
                          Checklist: {plan.checklist.join(" • ")}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/tryon",
                              params: {
                                section: "clothing",
                                itemId: selectedOccasion === "mariage" ? "dress-black" : selectedOccasion === "entretien" ? "blazer-camel" : selectedOccasion === "date" ? "dress-black" : "blazer-camel",
                                itemName: `Look ${plan.title}`,
                              },
                            })
                          }
                          style={{
                            borderWidth: 1,
                            borderColor: colors.primary,
                            backgroundColor: colors.primary + "22",
                            borderRadius: 10,
                            paddingVertical: 10,
                            alignItems: "center",
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
                            APPLIQUER CETTE OCCASION
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </View>
              )}
            </>
          ) : (
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>
              Impossible de charger le détail du look du jour.
            </Text>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
