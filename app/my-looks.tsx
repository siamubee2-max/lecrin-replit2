import { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { LookShareCard } from "@/components/look-share-card";
import { ShareModal } from "@/components/share-modal";

// Types
type Occasion = "casual" | "work" | "formal" | "sport" | "party" | "all";
type Season = "spring" | "summer" | "fall" | "winter" | "all";
type SortOption = "date" | "name" | "favorites";

interface SavedLook {
  id: number;
  name: string;
  description: string | null;
  occasion: string | null;
  season: string | null;
  wardrobeItemIds: string | null;
  jewelryItemIds: string | null;
  previewImageUrl: string | null;
  stylingTips: string | null;
  isAiGenerated: boolean | null;
  isFavorite: boolean | null;
  createdAt: Date;
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

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "date", label: "Plus récents" },
  { id: "name", label: "Nom A-Z" },
  { id: "favorites", label: "Favoris d'abord" },
];

export default function MyLooksScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  // Refs
  const shareCardRef = useRef<ViewShot>(null);

  // State
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>("all");
  const [selectedSeason, setSelectedSeason] = useState<Season>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedLook, setSelectedLook] = useState<SavedLook | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUri, setShareImageUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // API queries
  const { data: looks = [], isLoading, refetch } = trpc.looks.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: wardrobeItems = [] } = trpc.wardrobe.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: favorites = [] } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const updateLookMutation = trpc.looks.update.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteLookMutation = trpc.looks.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // Handlers
  const handleHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleToggleFavorite = useCallback(async (look: SavedLook) => {
    handleHaptic();
    try {
      await updateLookMutation.mutateAsync({
        id: look.id,
        isFavorite: !look.isFavorite,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }, [handleHaptic, updateLookMutation]);

  const handleDeleteLook = useCallback((look: SavedLook) => {
    handleHaptic();
    Alert.alert(
      "Supprimer le look",
      `Êtes-vous sûr de vouloir supprimer "${look.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteLookMutation.mutateAsync({ id: look.id });
              setSelectedLook(null);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error("Failed to delete look:", error);
            }
          },
        },
      ]
    );
  }, [handleHaptic, deleteLookMutation]);

  // Handle share look
  const handleShareLook = useCallback(async (look: SavedLook) => {
    handleHaptic();
    setIsCapturing(true);
    
    // Wait for the share card to render
    setTimeout(async () => {
      try {
        if (shareCardRef.current) {
          const uri = await shareCardRef.current.capture?.();
          if (uri) {
            setShareImageUri(uri);
            setShowShareModal(true);
          }
        }
      } catch (error) {
        console.error("Failed to capture look card:", error);
        Alert.alert("Erreur", "Impossible de générer l'image du look.");
      } finally {
        setIsCapturing(false);
      }
    }, 100);
  }, [handleHaptic]);

  // Handle save to gallery
  const handleSaveToGallery = useCallback(async () => {
    if (!shareImageUri) return;
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Veuillez autoriser l'accès à la galerie.");
        return;
      }
      
      const asset = await MediaLibrary.createAssetAsync(shareImageUri);
      const album = await MediaLibrary.getAlbumAsync("Écrin Virtuel");
      
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("Écrin Virtuel", asset, false);
      }
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Succès", "Le look a été sauvegardé dans votre galerie.");
    } catch (error) {
      console.error("Failed to save to gallery:", error);
      Alert.alert("Erreur", "Impossible de sauvegarder l'image.");
    }
  }, [shareImageUri]);

  // Handle native share
  const handleNativeShare = useCallback(async () => {
    if (!shareImageUri) return;
    
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(shareImageUri, {
          mimeType: "image/png",
          dialogTitle: "Partager mon look",
        });
      } else {
        Alert.alert("Non disponible", "Le partage n'est pas disponible sur cet appareil.");
      }
    } catch (error) {
      console.error("Failed to share:", error);
    }
  }, [shareImageUri]);

  // Filter and sort looks
  const filteredLooks = useMemo(() => {
    let result = [...looks];

    // Filter by occasion
    if (selectedOccasion !== "all") {
      result = result.filter((look) => look.occasion === selectedOccasion);
    }

    // Filter by season
    if (selectedSeason !== "all") {
      result = result.filter((look) => look.season === selectedSeason);
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "favorites":
        result.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case "date":
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [looks, selectedOccasion, selectedSeason, sortBy]);

  // Get items for a look
  const getLookItems = useCallback((look: SavedLook) => {
    const wardrobeIds: number[] = look.wardrobeItemIds 
      ? JSON.parse(look.wardrobeItemIds) 
      : [];
    const jewelryIds: number[] = look.jewelryItemIds 
      ? JSON.parse(look.jewelryItemIds) 
      : [];

    const clothes = wardrobeItems.filter((item) => wardrobeIds.includes(item.id));
    const jewelry = favorites.filter((item) => jewelryIds.includes(item.id));

    return { clothes, jewelry };
  }, [wardrobeItems, favorites]);

  // Render look card
  const renderLookCard = useCallback(({ item: look }: { item: SavedLook }) => {
    const { clothes, jewelry } = getLookItems(look);
    const occasionInfo = OCCASIONS.find((o) => o.id === look.occasion);
    const seasonInfo = SEASONS.find((s) => s.id === look.season);
    const totalItems = clothes.length + jewelry.length;

    return (
      <TouchableOpacity
        className="bg-surface rounded-2xl border border-border overflow-hidden mb-4"
        onPress={() => {
          handleHaptic();
          setSelectedLook(look);
        }}
        activeOpacity={0.8}
      >
        {/* Preview images */}
        <View className="flex-row h-32">
          {clothes.slice(0, 2).map((item, index) => (
            <View 
              key={`cloth-${item.id}`} 
              className={`flex-1 bg-gray-100 ${index === 0 ? "border-r border-border" : ""}`}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-3xl">👕</Text>
                </View>
              )}
            </View>
          ))}
          {clothes.length < 2 && jewelry.slice(0, 2 - clothes.length).map((item, index) => (
            <View 
              key={`jewel-${item.id}`} 
              className={`flex-1 bg-gray-100 ${clothes.length + index === 0 ? "border-r border-border" : ""}`}
            >
              {item.imageUri ? (
                <Image
                  source={{ uri: item.imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-3xl">{item.jewelryIcon || "💎"}</Text>
                </View>
              )}
            </View>
          ))}
          {totalItems === 0 && (
            <View className="flex-1 bg-gray-100 items-center justify-center">
              <IconSymbol name="sparkles" size={32} color={colors.muted} />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-lg font-semibold text-foreground flex-1" numberOfLines={1}>
                  {look.name}
                </Text>
                {look.isAiGenerated && (
                  <View className="bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                    <Text className="text-xs text-primary font-medium">IA</Text>
                  </View>
                )}
              </View>
              {look.description && (
                <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                  {look.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              className="ml-2 p-2"
              onPress={() => handleToggleFavorite(look)}
            >
              <IconSymbol
                name={look.isFavorite ? "heart.fill" : "heart"}
                size={24}
                color={look.isFavorite ? colors.error : colors.muted}
              />
            </TouchableOpacity>
          </View>

          {/* Tags */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {occasionInfo && occasionInfo.id !== "all" && (
              <View className="flex-row items-center bg-background px-3 py-1 rounded-full">
                <Text className="text-sm">{occasionInfo.icon}</Text>
                <Text className="text-xs text-foreground ml-1">{occasionInfo.label}</Text>
              </View>
            )}
            {seasonInfo && seasonInfo.id !== "all" && (
              <View className="flex-row items-center bg-background px-3 py-1 rounded-full">
                <Text className="text-sm">{seasonInfo.icon}</Text>
                <Text className="text-xs text-foreground ml-1">{seasonInfo.label}</Text>
              </View>
            )}
            <View className="flex-row items-center bg-background px-3 py-1 rounded-full">
              <Text className="text-xs text-muted">{totalItems} pièces</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getLookItems, handleHaptic, handleToggleFavorite, colors]);

  // Empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
        <IconSymbol name="sparkles" size={48} color={colors.primary} />
      </View>
      <Text className="text-xl font-semibold text-foreground mb-2 text-center">
        Aucun look sauvegardé
      </Text>
      <Text className="text-muted text-center px-8 mb-6">
        Utilisez l{"'"}AI Stylist pour générer des suggestions de looks et les sauvegarder ici.
      </Text>
      <TouchableOpacity
        className="bg-primary px-6 py-3 rounded-full flex-row items-center"
        onPress={() => router.push("/ai-stylist" as any)}
      >
        <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
        <Text className="text-white font-semibold ml-2">Ouvrir AI Stylist</Text>
      </TouchableOpacity>
    </View>
  );

  // Stats
  const stats = useMemo(() => {
    const total = looks.length;
    const favoritesCount = looks.filter((l) => l.isFavorite).length;
    const aiGenerated = looks.filter((l) => l.isAiGenerated).length;
    return { total, favoritesCount, aiGenerated };
  }, [looks]);

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
            <Text className="text-2xl font-bold text-foreground">Mes Looks</Text>
            <Text className="text-muted text-sm">
              Vos tenues sauvegardées et créations
            </Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            onPress={() => router.push("/ai-stylist" as any)}
          >
            <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
            <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
            <Text className="text-xs text-muted">Looks</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
            <Text className="text-2xl font-bold text-error">{stats.favoritesCount}</Text>
            <Text className="text-xs text-muted">Favoris</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-3 border border-border">
            <Text className="text-2xl font-bold text-primary">{stats.aiGenerated}</Text>
            <Text className="text-xs text-muted">Générés IA</Text>
          </View>
        </View>

        {/* Filters */}
        <View className="mb-3">
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

        <View className="mb-3">
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

        {/* Sort */}
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted">
            {filteredLooks.length} look{filteredLooks.length !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            className="flex-row items-center bg-surface px-3 py-2 rounded-lg border border-border"
            onPress={() => {
              handleHaptic();
              setShowSortMenu(!showSortMenu);
            }}
          >
            <IconSymbol name="arrow.up.arrow.down" size={16} color={colors.foreground} />
            <Text className="text-sm text-foreground ml-2">
              {SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sort menu */}
        {showSortMenu && (
          <View className="absolute right-4 top-full mt-1 bg-surface rounded-xl border border-border shadow-lg z-50">
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                className={`px-4 py-3 border-b border-border last:border-b-0 ${
                  sortBy === option.id ? "bg-primary/10" : ""
                }`}
                onPress={() => {
                  handleHaptic();
                  setSortBy(option.id);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  className={`text-sm ${
                    sortBy === option.id ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content */}
      {!user ? (
        <View className="flex-1 items-center justify-center px-6">
          <IconSymbol name="person.fill" size={48} color={colors.muted} />
          <Text className="text-lg font-semibold text-foreground mt-4 text-center">
            Connectez-vous pour voir vos looks
          </Text>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredLooks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredLooks}
          renderItem={renderLookCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Look Detail Modal */}
      {selectedLook && (
        <View className="absolute inset-0 bg-black/50">
          <View className="flex-1 justify-end">
            <View className="bg-background rounded-t-3xl max-h-[85%]">
              {/* Modal header */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
                <View className="flex-row items-center flex-1">
                  <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                    {selectedLook.name}
                  </Text>
                  {selectedLook.isAiGenerated && (
                    <View className="bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                      <Text className="text-xs text-primary font-medium">IA</Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => handleToggleFavorite(selectedLook)}
                  >
                    <IconSymbol
                      name={selectedLook.isFavorite ? "heart.fill" : "heart"}
                      size={24}
                      color={selectedLook.isFavorite ? colors.error : colors.muted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedLook(null)}>
                    <IconSymbol name="xmark" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView className="px-4 py-4">
                {/* Description */}
                {selectedLook.description && (
                  <Text className="text-foreground mb-4">{selectedLook.description}</Text>
                )}

                {/* Tags */}
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {(() => {
                    const occasionInfo = OCCASIONS.find((o) => o.id === selectedLook.occasion);
                    const seasonInfo = SEASONS.find((s) => s.id === selectedLook.season);
                    return (
                      <>
                        {occasionInfo && occasionInfo.id !== "all" && (
                          <View className="flex-row items-center bg-surface px-3 py-1.5 rounded-full border border-border">
                            <Text className="text-sm">{occasionInfo.icon}</Text>
                            <Text className="text-sm text-foreground ml-1">{occasionInfo.label}</Text>
                          </View>
                        )}
                        {seasonInfo && seasonInfo.id !== "all" && (
                          <View className="flex-row items-center bg-surface px-3 py-1.5 rounded-full border border-border">
                            <Text className="text-sm">{seasonInfo.icon}</Text>
                            <Text className="text-sm text-foreground ml-1">{seasonInfo.label}</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>

                {/* Styling tips */}
                {selectedLook.stylingTips && (
                  <View className="bg-primary/10 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-2">
                      <IconSymbol name="sparkles" size={20} color={colors.primary} />
                      <Text className="text-primary font-semibold ml-2">Conseils de style</Text>
                    </View>
                    <Text className="text-foreground">{selectedLook.stylingTips}</Text>
                  </View>
                )}

                {/* Items */}
                <Text className="text-foreground font-semibold mb-3">Pièces du look</Text>
                {(() => {
                  const { clothes, jewelry } = getLookItems(selectedLook);
                  return (
                    <View className="gap-2 mb-6">
                      {clothes.length === 0 && jewelry.length === 0 && (
                        <Text className="text-muted text-center py-4">
                          Aucune pièce associée à ce look
                        </Text>
                      )}
                      {clothes.map((item) => (
                        <View
                          key={`detail-cloth-${item.id}`}
                          className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                        >
                          <View className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden mr-3">
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
                          <View className="bg-background px-2 py-1 rounded-full">
                            <Text className="text-xs text-muted">Vêtement</Text>
                          </View>
                        </View>
                      ))}
                      {jewelry.map((item) => (
                        <View
                          key={`detail-jewel-${item.id}`}
                          className="flex-row items-center bg-surface rounded-xl p-3 border border-border"
                        >
                          <View className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden mr-3">
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
                          <View className="bg-primary/10 px-2 py-1 rounded-full">
                            <Text className="text-xs text-primary">Bijou</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}

                {/* Date */}
                <Text className="text-muted text-sm text-center mb-4">
                  Créé le {new Date(selectedLook.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>

                {/* Actions */}
                <View className="gap-3 mb-6">
                  {/* Share button */}
                  <TouchableOpacity
                    className="bg-primary py-4 rounded-xl items-center flex-row justify-center"
                    onPress={() => handleShareLook(selectedLook)}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
                        <Text className="text-white font-semibold ml-2">Partager ce look</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  {/* Other actions */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-surface py-4 rounded-xl items-center border border-border"
                      onPress={() => handleDeleteLook(selectedLook)}
                    >
                      <Text className="text-error font-semibold">Supprimer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 bg-surface py-4 rounded-xl items-center border border-border"
                      onPress={() => setSelectedLook(null)}
                    >
                      <Text className="text-foreground font-semibold">Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* Hidden Share Card for capture */}
      {selectedLook && (
        <View style={{ position: "absolute", left: -1000, top: 0 }}>
          <LookShareCard
            ref={shareCardRef}
            name={selectedLook.name}
            description={selectedLook.description}
            occasion={selectedLook.occasion}
            season={selectedLook.season}
            stylingTips={selectedLook.stylingTips}
            wardrobeItems={getLookItems(selectedLook).clothes}
            jewelryItems={getLookItems(selectedLook).jewelry}
            isAiGenerated={selectedLook.isAiGenerated}
          />
        </View>
      )}

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareImageUri(null);
        }}
        imageUri={shareImageUri || undefined}
        title={selectedLook?.name || "Mon Look"}
        message={`Découvrez mon look "${selectedLook?.name}" créé avec L'Écrin Virtuel ! 💍✨`}
      />
    </ScreenContainer>
  );
}
