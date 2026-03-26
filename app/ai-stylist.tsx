import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { getCurrentWeather, getUserLocation } from "@/services/weather-service";
import { buildDailyGenderLook, type DailyGenderLook } from "@/services/daily-gender-look-service";
import { getStyleProfile } from "@/services/style-profile-service";

// Types
type Occasion = "casual" | "work" | "formal" | "sport" | "party" | "all";
type Season = "spring" | "summer" | "fall" | "winter" | "all";

interface LookSuggestion {
  name: string;
  description: string;
  occasion: Occasion;
  season: Season;
  wardrobeItemIds: number[];
  jewelryItemIds: number[];
  stylingTips: string;
  confidence: number;
}

// Constants
const OCCASIONS: { id: Occasion; label: string; icon: string }[] = [
  { id: "all", label: "Tous", icon: "✨" },
  { id: "casual", label: "Casual", icon: "👕" },
  { id: "work", label: "Travail", icon: "💼" },
  { id: "formal", label: "Soirée", icon: "🎩" },
  { id: "sport", label: "Sport", icon: "🏃" },
  { id: "party", label: "Fête", icon: "🎉" },
];

const SEASONS: { id: Season; label: string; icon: string }[] = [
  { id: "all", label: "Toutes", icon: "🌍" },
  { id: "spring", label: "Printemps", icon: "🌸" },
  { id: "summer", label: "Été", icon: "☀️" },
  { id: "fall", label: "Automne", icon: "🍂" },
  { id: "winter", label: "Hiver", icon: "❄️" },
];

export default function AIStylistScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>("all");
  const [selectedSeason, setSelectedSeason] = useState<Season>("all");
  const [suggestions, setSuggestions] = useState<LookSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLook, setSelectedLook] = useState<LookSuggestion | null>(null);
  const [dailyLook, setDailyLook] = useState<DailyGenderLook | null>(null);
  const [isLoadingDailyLook, setIsLoadingDailyLook] = useState(false);

  // API queries
  const { data: wardrobeItems = [] } = trpc.wardrobe.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: favorites = [] } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const generateLooksMutation = trpc.stylist.generateLooks.useMutation();
  const saveLookMutation = trpc.looks.create.useMutation();

  const loadDailyLook = useCallback(async () => {
    setIsLoadingDailyLook(true);
    try {
      const location = await getUserLocation();
      const weather = await getCurrentWeather(location);
      const profile = await getStyleProfile();
      setDailyLook(buildDailyGenderLook(weather, location, profile));
    } catch (error) {
      console.error("Failed to load daily weather look:", error);
      setDailyLook(null);
    } finally {
      setIsLoadingDailyLook(false);
    }
  }, []);

  useEffect(() => {
    loadDailyLook();
  }, [loadDailyLook]);

  // Handlers
  const handleHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleGenerateLooks = useCallback(async () => {
    if (wardrobeItems.length === 0) {
      alert("Ajoutez des vêtements à votre dressing pour générer des looks.");
      return;
    }

    handleHaptic();
    setIsGenerating(true);
    setSuggestions([]);

    try {
      const result = await generateLooksMutation.mutateAsync({
        occasion: selectedOccasion !== "all" ? selectedOccasion : undefined,
        season: selectedSeason !== "all" ? selectedSeason : undefined,
        count: 3,
      });

      setSuggestions(result.suggestions);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to generate looks:", error);
      alert("Erreur lors de la génération des looks. Réessayez.");
    } finally {
      setIsGenerating(false);
    }
  }, [wardrobeItems.length, selectedOccasion, selectedSeason, handleHaptic, generateLooksMutation]);

  const handleSaveLook = useCallback(async (look: LookSuggestion) => {
    handleHaptic();
    try {
      await saveLookMutation.mutateAsync({
        name: look.name,
        description: look.description,
        occasion: look.occasion,
        season: look.season,
        wardrobeItemIds: JSON.stringify(look.wardrobeItemIds),
        jewelryItemIds: JSON.stringify(look.jewelryItemIds),
        stylingTips: look.stylingTips,
        isAiGenerated: true,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      alert("Look sauvegardé !");
    } catch (error) {
      console.error("Failed to save look:", error);
      alert("Erreur lors de la sauvegarde.");
    }
  }, [handleHaptic, saveLookMutation]);

  // Get items for a look
  const getLookItems = useCallback((look: LookSuggestion) => {
    const clothes = wardrobeItems.filter((item) => 
      look.wardrobeItemIds.includes(item.id)
    );
    const jewelry = favorites.filter((item) => 
      look.jewelryItemIds.includes(item.id)
    );
    return { clothes, jewelry };
  }, [wardrobeItems, favorites]);

  // Render look card
  const renderLookCard = useCallback(({ item: look, index }: { item: LookSuggestion; index: number }) => {
    const { clothes, jewelry } = getLookItems(look);
    const occasionInfo = OCCASIONS.find((o) => o.id === look.occasion);
    const seasonInfo = SEASONS.find((s) => s.id === look.season);

    return (
      <TouchableOpacity
        className="bg-surface rounded-2xl border border-border overflow-hidden mb-4"
        onPress={() => {
          handleHaptic();
          setSelectedLook(look);
        }}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View className="p-4 border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{look.name}</Text>
              <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                {look.description}
              </Text>
            </View>
            <View className="items-center ml-3">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-2xl font-bold text-primary">{look.confidence}%</Text>
              </View>
              <Text className="text-xs text-muted mt-1">Confiance</Text>
            </View>
          </View>

          {/* Tags */}
          <View className="flex-row gap-2 mt-3">
            <View className="flex-row items-center bg-background px-3 py-1 rounded-full">
              <Text className="text-sm">{occasionInfo?.icon}</Text>
              <Text className="text-xs text-foreground ml-1">{occasionInfo?.label}</Text>
            </View>
            <View className="flex-row items-center bg-background px-3 py-1 rounded-full">
              <Text className="text-sm">{seasonInfo?.icon}</Text>
              <Text className="text-xs text-foreground ml-1">{seasonInfo?.label}</Text>
            </View>
          </View>
        </View>

        {/* Items preview */}
        <View className="p-4">
          <Text className="text-sm font-medium text-foreground mb-2">
            Pièces sélectionnées ({clothes.length + jewelry.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {clothes.map((item) => (
                <View key={`cloth-${item.id}`} className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-2xl">👕</Text>
                    </View>
                  )}
                </View>
              ))}
              {jewelry.map((item) => (
                <View key={`jewel-${item.id}`} className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden">
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-2xl">{item.jewelryIcon || "💎"}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Actions */}
        <View className="flex-row border-t border-border">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3 border-r border-border"
            onPress={() => handleSaveLook(look)}
          >
            <IconSymbol name="heart.fill" size={18} color={colors.primary} />
            <Text className="text-primary font-medium ml-2">Sauvegarder</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3"
            onPress={() => {
              handleHaptic();
              setSelectedLook(look);
            }}
          >
            <IconSymbol name="eye.fill" size={18} color={colors.foreground} />
            <Text className="text-foreground font-medium ml-2">Détails</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }, [getLookItems, handleHaptic, handleSaveLook, colors]);

  // Empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
        <IconSymbol name="sparkles" size={48} color={colors.primary} />
      </View>
      <Text className="text-xl font-semibold text-foreground mb-2 text-center">
        AI Stylist
      </Text>
      <Text className="text-muted text-center px-8 mb-6">
        {wardrobeItems.length === 0
          ? "Ajoutez des vêtements à votre dressing pour recevoir des suggestions de looks personnalisées."
          : "Sélectionnez vos préférences et laissez l'IA créer des looks parfaits pour vous."}
      </Text>
      {wardrobeItems.length === 0 ? (
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => router.push("/(tabs)/dressing" as any)}
        >
          <Text className="text-white font-semibold">Aller au Dressing</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full flex-row items-center"
          onPress={handleGenerateLooks}
        >
          <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">Générer des Looks</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-surface items-center justify-center mr-3"
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">AI Stylist</Text>
            <Text className="text-muted text-sm">
              Créez des looks parfaits avec vos vêtements et bijoux
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
            <Text className="text-2xl font-bold text-foreground">{wardrobeItems.length}</Text>
            <Text className="text-xs text-muted">Vêtements</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
            <Text className="text-2xl font-bold text-foreground">{favorites.length}</Text>
            <Text className="text-xs text-muted">Bijoux favoris</Text>
          </View>
        </View>

        {/* Look du jour meteo (femme + homme) */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-semibold text-foreground">Look du jour meteo</Text>
            <TouchableOpacity
              onPress={loadDailyLook}
              className="px-3 py-1 rounded-full border border-border"
              disabled={isLoadingDailyLook}
            >
              <Text className="text-xs text-foreground">{isLoadingDailyLook ? "..." : "Actualiser"}</Text>
            </TouchableOpacity>
          </View>

          {isLoadingDailyLook ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-muted text-xs mt-2">Analyse meteo en cours...</Text>
            </View>
          ) : dailyLook ? (
            <>
              <Text className="text-xs text-muted mb-2">
                {dailyLook.locationLabel} - {dailyLook.weatherLabel}
              </Text>
              {dailyLook.alerts.length > 0 && (
                <Text className="text-xs text-primary mb-3">
                  Alertes: {dailyLook.alerts.join(" • ")}
                </Text>
              )}

              <View className="bg-background rounded-xl p-3 border border-border mb-2">
                <Text className="text-sm font-semibold text-foreground mb-1">{dailyLook.femme.title}</Text>
                <Text className="text-xs text-foreground">Pieces: {dailyLook.femme.pieces.join(" + ")}</Text>
                {dailyLook.femme.outerwear ? (
                  <Text className="text-xs text-foreground mt-1">Couche: {dailyLook.femme.outerwear}</Text>
                ) : null}
                <Text className="text-xs text-foreground mt-1">Chaussures: {dailyLook.femme.shoes}</Text>
                <Text className="text-xs text-muted mt-1">Accessoires: {dailyLook.femme.accessories.join(", ")}</Text>
              </View>

              <View className="bg-background rounded-xl p-3 border border-border">
                <Text className="text-sm font-semibold text-foreground mb-1">{dailyLook.homme.title}</Text>
                <Text className="text-xs text-foreground">Pieces: {dailyLook.homme.pieces.join(" + ")}</Text>
                {dailyLook.homme.outerwear ? (
                  <Text className="text-xs text-foreground mt-1">Couche: {dailyLook.homme.outerwear}</Text>
                ) : null}
                <Text className="text-xs text-foreground mt-1">Chaussures: {dailyLook.homme.shoes}</Text>
                <Text className="text-xs text-muted mt-1">Accessoires: {dailyLook.homme.accessories.join(", ")}</Text>
              </View>
            </>
          ) : (
            <Text className="text-xs text-muted">
              Impossible de charger le look du jour pour le moment.
            </Text>
          )}
        </View>

        {/* Filters */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {OCCASIONS.map((occasion) => (
                <TouchableOpacity
                  key={occasion.id}
                  className={`flex-row items-center px-4 py-2 rounded-full border ${
                    selectedOccasion === occasion.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => {
                    handleHaptic();
                    setSelectedOccasion(occasion.id);
                  }}
                >
                  <Text className="text-sm mr-1">{occasion.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      selectedOccasion === occasion.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {occasion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Saison</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {SEASONS.map((season) => (
                <TouchableOpacity
                  key={season.id}
                  className={`flex-row items-center px-4 py-2 rounded-full border ${
                    selectedSeason === season.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => {
                    handleHaptic();
                    setSelectedSeason(season.id);
                  }}
                >
                  <Text className="text-sm mr-1">{season.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      selectedSeason === season.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {season.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Generate button */}
        <TouchableOpacity
          className={`flex-row items-center justify-center py-4 rounded-xl ${
            isGenerating ? "bg-primary/50" : "bg-primary"
          }`}
          onPress={handleGenerateLooks}
          disabled={isGenerating || wardrobeItems.length === 0}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Génération en cours...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Générer des Looks</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!user ? (
        <View className="flex-1 items-center justify-center px-6">
          <IconSymbol name="person.fill" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            Connectez-vous pour utiliser l{"'"}AI Stylist
          </Text>
        </View>
      ) : suggestions.length === 0 && !isGenerating ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={suggestions}
          renderItem={renderLookCard}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isGenerating ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-muted mt-4">L{"'"}IA analyse votre garde-robe...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Look Detail Modal */}
      {selectedLook && (
        <View className="absolute inset-0 bg-black/50">
          <View className="flex-1 justify-end">
            <View className="bg-background rounded-t-3xl max-h-[80%]">
              {/* Modal header */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <Text className="text-lg font-semibold text-foreground">{selectedLook.name}</Text>
                <TouchableOpacity onPress={() => setSelectedLook(null)}>
                  <IconSymbol name="xmark" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView className="px-4 py-4">
                {/* Description */}
                <Text className="text-foreground mb-4">{selectedLook.description}</Text>

                {/* Styling tips */}
                <View className="bg-primary/10 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-2">
                    <IconSymbol name="sparkles" size={20} color={colors.primary} />
                    <Text className="text-primary font-semibold ml-2">Conseils de style</Text>
                  </View>
                  <Text className="text-foreground">{selectedLook.stylingTips}</Text>
                </View>

                {/* Items */}
                <Text className="text-foreground font-semibold mb-3">Pièces du look</Text>
                {(() => {
                  const { clothes, jewelry } = getLookItems(selectedLook);
                  return (
                    <View className="gap-2 mb-6">
                      {clothes.map((item) => (
                        <View
                          key={`detail-cloth-${item.id}`}
                          className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                        >
                          <View className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden mr-3">
                            {item.imageUrl ? (
                              <Image
                                source={{ uri: item.imageUrl }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                              />
                            ) : (
                              <View className="flex-1 items-center justify-center">
                                <Text className="text-xl">👕</Text>
                              </View>
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-foreground font-medium">{item.name}</Text>
                            <Text className="text-muted text-sm">{item.category}</Text>
                          </View>
                        </View>
                      ))}
                      {jewelry.map((item) => (
                        <View
                          key={`detail-jewel-${item.id}`}
                          className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                        >
                          <View className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden mr-3">
                            {item.imageUri ? (
                              <Image
                                source={{ uri: item.imageUri }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                              />
                            ) : (
                              <View className="flex-1 items-center justify-center">
                                <Text className="text-xl">{item.jewelryIcon || "💎"}</Text>
                              </View>
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="text-foreground font-medium">
                              {item.modelName || item.jewelryType}
                            </Text>
                            <Text className="text-muted text-sm">Bijou</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}

                {/* Save button */}
                <TouchableOpacity
                  className="bg-primary py-4 rounded-xl items-center mb-4"
                  onPress={() => {
                    handleSaveLook(selectedLook);
                    setSelectedLook(null);
                  }}
                >
                  <Text className="text-white font-semibold">Sauvegarder ce look</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
