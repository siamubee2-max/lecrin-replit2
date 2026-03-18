import { ScrollView, Text, View, TouchableOpacity, TextInput, StyleSheet, FlatList, Platform, Modal, KeyboardAvoidingView, Alert, ActivityIndicator } from "react-native";
import { useState, useEffect, useCallback } from "react";
// Supabase import removed - using tRPC partnerJewelry instead
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

const JEWELRY_TYPES = ["Tous", "earrings", "necklace", "ring", "bracelet", "anklet", "brooch"];
const JEWELRY_TYPE_LABELS: Record<string, string> = {
  "Tous": "Tous",
  "earrings": "Boucles",
  "necklace": "Colliers",
  "ring": "Bagues",
  "bracelet": "Bracelets",
  "anklet": "Chevillieres",
  "brooch": "Broches",
};
const JEWELRY_TYPE_ICONS: Record<string, string> = {
  "Tous": "✦",
  "earrings": "◈",
  "necklace": "◉",
  "ring": "◎",
  "bracelet": "⊙",
  "anklet": "◌",
  "brooch": "✿",
};

const FILTERS = {
  metals: ["All Metals", "Gold", "Silver", "Platinum", "Rose Gold"],
  gems: ["All Gems", "Diamond", "Ruby", "Sapphire", "Emerald", "Pearl"],
  brands: ["All Brands", "Moniattitude", "Custom"],
  collections: ["All Collections", "Summer 2025", "Classic", "Modern"],
};

type JewelryItem = {
  id: string;
  name: string;
  type: string;
  brand: string | null;
  image: { uri: string } | null;
  isFavorite: boolean;
  metal: string | null;
  isDemo: boolean;
  collection: string | null;
  tags: string[] | null;
};

export default function EcrinScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const [jewelry, setJewelry] = useState<JewelryItem[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // tRPC hooks for persistent collection (requires auth)
  const collectionQuery = trpc.collection.list.useQuery(undefined, {
    enabled: !!user,
  });
  const addToCollectionMutation = trpc.collection.add.useMutation();
  const removeFromCollectionMutation = trpc.collection.remove.useMutation();
  const updateCollectionMutation = trpc.collection.update.useMutation();

  // Merge collection items when loaded
  useEffect(() => {
    if (!collectionQuery.data) return;
    const collectionItems: JewelryItem[] = collectionQuery.data.map((item) => ({
      id: `user_${item.id}`,
      name: item.name,
      type: item.type,
      brand: item.brand ?? null,
      image: item.imageUri ? { uri: item.imageUri } : null,
      isFavorite: item.isFavorite ?? false,
      metal: item.metal ?? null,
      isDemo: false,
      collection: item.collection ?? null,
      tags: item.tags ? [item.tags] : null,
    }));
    setJewelry(prev => {
      const demoItems = prev.filter(j => j.isDemo);
      return [...demoItems, ...collectionItems];
    });
  }, [collectionQuery.data]);

  // Load MONI'ATTITUDE jewelry from tRPC partnerJewelry
  const partnerJewelryQuery = trpc.partnerJewelry.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (partnerJewelryQuery.data) {
      const items: JewelryItem[] = partnerJewelryQuery.data.map((j: any) => ({
        id: `partner_${j.id}`,
        name: j.name,
        type: j.type,
        brand: "MONI'ATTITUDE",
        image: j.imageUrl ? { uri: j.imageUrl } : null,
        isFavorite: false,
        metal: j.metalType ?? null,
        isDemo: true,
        collection: j.collection ?? null,
        tags: j.tags ? (typeof j.tags === 'string' ? JSON.parse(j.tags) : j.tags) : null,
      }));
      setJewelry(items);
      setIsLoadingSupabase(false);
    } else if (!partnerJewelryQuery.isLoading) {
      setIsLoadingSupabase(false);
    }
  }, [partnerJewelryQuery.data, partnerJewelryQuery.isLoading]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJewelryName, setNewJewelryName] = useState("");
  const [newJewelryType, setNewJewelryType] = useState("Necklace");
  const [newJewelryBrand, setNewJewelryBrand] = useState("");
  const [newJewelryImage, setNewJewelryImage] = useState<string | null>(null);
  // Helper to convert image string to {uri} object for consistency
  const toImageSource = (img: string | null): { uri: string } | null => img ? { uri: img } : null;

  const handleAddJewelry = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowAddModal(true);
  };

  const pickImageFromGallery = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Veuillez autoriser l'accès à votre galerie pour importer une photo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewJewelryImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "Veuillez autoriser l'accès à votre appareil photo pour prendre une photo."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewJewelryImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setNewJewelryImage(null);
  };

  const handleSaveNewJewelry = async () => {
    if (!newJewelryName.trim()) return;
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Optimistic local update
    const tempId = `temp_${Date.now()}`;
    const newItem: JewelryItem = {
      id: tempId,
      name: newJewelryName.trim(),
      type: newJewelryType,
      brand: newJewelryBrand.trim() || "Custom",
      image: newJewelryImage ? { uri: newJewelryImage } : null,
      isFavorite: false,
      metal: "Gold",
      isDemo: false,
      collection: null,
      tags: null,
    };
    setJewelry(prev => [newItem, ...prev]);
    setNewJewelryName("");
    setNewJewelryType("Necklace");
    setNewJewelryBrand("");
    setNewJewelryImage(null);
    setShowAddModal(false);

    // Persist to server if authenticated
    if (user) {
      try {
        const result = await addToCollectionMutation.mutateAsync({
          name: newItem.name,
          type: newItem.type,
          brand: newItem.brand ?? undefined,
          imageUri: newItem.image?.uri ?? undefined,
          metal: newItem.metal ?? undefined,
        });
        // Replace temp ID with real server ID
        setJewelry(prev => prev.map(j =>
          j.id === tempId ? { ...j, id: `user_${result.id}` } : j
        ));
        collectionQuery.refetch();
      } catch (e) {
        console.warn("Failed to persist jewelry:", e);
      }
    }
  };

  const toggleFavorite = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setJewelry(prev => 
      prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleTryOnDemo = (item: JewelryItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Navigate to try-on screen with the demo jewelry item
    router.push({
      pathname: "/(tabs)/tryon",
      params: {
        demoJewelryId: item.id,
        demoJewelryName: item.name,
        demoJewelryType: item.type,
      },
    });
  };

  const filteredJewelry = jewelry.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.collection || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "Tous" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={{ flex: 1 }}>
        {/* Header luxe */}
        <View style={ecrinStyles.header}>
          <View>
            <Text style={[ecrinStyles.title, { color: colors.foreground }]}>MON ÉCRIN</Text>
            <Text style={[ecrinStyles.subtitle, { color: colors.primary }]}>
              {isLoadingSupabase ? "Chargement..." : `${jewelry.length} pièces`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAddJewelry}
            style={[ecrinStyles.addBtn, { borderColor: colors.primary }]}
          >
            <IconSymbol name="plus" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={[ecrinStyles.headerLine, { backgroundColor: colors.border }]} />

        {/* Search Bar */}
        <View style={[ecrinStyles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un bijou..."
            placeholderTextColor={colors.muted}
            style={[ecrinStyles.searchInput, { color: colors.foreground }]}
          />
        </View>

        {/* Type Filter avec compteurs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
        >
          {JEWELRY_TYPES.map((type) => {
            const count = type === "Tous"
              ? jewelry.length
              : jewelry.filter(j => j.type === type).length;
            if (type !== "Tous" && count === 0) return null;
            const isActive = selectedType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setSelectedType(type);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  ecrinStyles.filterChip,
                  {
                    borderColor: isActive ? colors.primary : colors.border,
                    backgroundColor: isActive ? colors.foreground : colors.surface,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, color: isActive ? colors.background : colors.primary }}>
                  {JEWELRY_TYPE_ICONS[type]}
                </Text>
                <Text
                  style={[
                    ecrinStyles.filterChipText,
                    { color: isActive ? colors.background : colors.muted },
                  ]}
                >
                  {JEWELRY_TYPE_LABELS[type] || type}
                </Text>
                <View style={[
                  ecrinStyles.countBadge,
                  { backgroundColor: isActive ? colors.primary : colors.border },
                ]}>
                  <Text style={[ecrinStyles.countBadgeText, { color: isActive ? colors.background : colors.muted }]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Jewelry Grid */}
        {isLoadingSupabase ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Chargement du catalogue MONI'ATTITUDE...</Text>
          </View>
        ) : filteredJewelry.length > 0 ? (
          <FlatList
            data={filteredJewelry}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <JewelryCard
                item={item}
                colors={colors}
                onToggleFavorite={() => toggleFavorite(item.id)}
                onTryOn={() => handleTryOnDemo(item as any)}
              />
            )}
          />
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
            <View className="items-center px-8 py-6">
              <Text className="text-5xl mb-4">💎</Text>
              <Text className="text-xl font-semibold text-foreground text-center mb-2">
                Votre écrin est vide
              </Text>
              <Text className="text-base text-muted text-center mb-4">
                Ajoutez vos premiers bijoux pour commencer votre collection virtuelle.
              </Text>
            </View>

            {/* Example jewelry section */}
            <View className="px-4">
              <Text className="text-lg font-semibold text-foreground mb-2">
                Exemples de bijoux
              </Text>
              <Text className="text-muted text-sm mb-4">
                Voici les types de bijoux que vous pouvez ajouter à votre écrin
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {[
                  { id: "necklace", label: "Collier", image: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/necklace_example_ddb00585.png" } },
                  { id: "earrings", label: "Boucles d'oreilles", image: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/earrings_example_bcf0dd76.png" } },
                  { id: "ring", label: "Bague", image: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/ring_example_7651ac1d.png" } },
                  { id: "bracelet", label: "Bracelet", image: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/bracelet_0cceb60d.png" } },
                  { id: "anklet", label: "Chevillière", image: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/anklet_25156a89.png" } },
                ].map((item) => (
                  <View
                    key={item.id}
                    className="w-[48%] bg-surface rounded-xl overflow-hidden border border-border mb-4"
                  >
                    <Image
                      source={item.image}
                      style={{ width: "100%", height: 150 }}
                      contentFit="cover"
                    />
                    <View className="p-3">
                      <Text className="text-sm font-medium text-foreground">{item.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Add Jewelry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-background">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text className="text-primary font-medium">Annuler</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">Nouveau bijou</Text>
              <TouchableOpacity onPress={handleSaveNewJewelry}>
                <Text className={`font-semibold ${newJewelryName.trim() ? "text-primary" : "text-muted"}`}>
                  Ajouter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView className="flex-1 px-4 py-6">
              {/* Name */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">Nom du bijou *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Ex: Collier en or rose"
                  placeholderTextColor={colors.muted}
                  value={newJewelryName}
                  onChangeText={setNewJewelryName}
                  returnKeyType="next"
                />
              </View>

              {/* Type */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">Type de bijou</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {["Necklace", "Earrings", "Ring", "Bracelet", "Brooch"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        className={`px-4 py-2 rounded-full border ${newJewelryType === type ? "bg-primary border-primary" : "bg-surface border-border"}`}
                        onPress={() => setNewJewelryType(type)}
                      >
                        <Text className={newJewelryType === type ? "text-white font-medium" : "text-foreground"}>
                          {type === "Necklace" ? "Collier" : type === "Earrings" ? "Boucles" : type === "Ring" ? "Bague" : type === "Bracelet" ? "Bracelet" : "Broche"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Brand */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">Marque (optionnel)</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Ex: Moniattitude, Cartier..."
                  placeholderTextColor={colors.muted}
                  value={newJewelryBrand}
                  onChangeText={setNewJewelryBrand}
                  returnKeyType="done"
                />
              </View>

              {/* Photo Section */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-3">Photo du bijou</Text>
                
                {newJewelryImage ? (
                  <View className="items-center">
                    <View className="relative">
                      <Image
                        source={{ uri: newJewelryImage }}
                        style={{ width: 200, height: 200, borderRadius: 16 }}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        onPress={removeImage}
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-error items-center justify-center"
                        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
                      >
                        <IconSymbol name="xmark" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-muted mt-2">Appuyez sur × pour supprimer</Text>
                  </View>
                ) : (
                  <View className="flex-row gap-3">
                    {/* Take Photo Button */}
                    <TouchableOpacity
                      onPress={takePhoto}
                      className="flex-1 bg-surface border border-border rounded-xl p-4 items-center"
                      activeOpacity={0.7}
                    >
                      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
                        <IconSymbol name="camera.fill" size={24} color={colors.primary} />
                      </View>
                      <Text className="text-sm font-medium text-foreground">Prendre une photo</Text>
                      <Text className="text-xs text-muted mt-1">Appareil photo</Text>
                    </TouchableOpacity>

                    {/* Import from Gallery Button */}
                    <TouchableOpacity
                      onPress={pickImageFromGallery}
                      className="flex-1 bg-surface border border-border rounded-xl p-4 items-center"
                      activeOpacity={0.7}
                    >
                      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
                        <IconSymbol name="photo.fill" size={24} color={colors.primary} />
                      </View>
                      <Text className="text-sm font-medium text-foreground">Importer</Text>
                      <Text className="text-xs text-muted mt-1">Depuis la galerie</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Info */}
              <View className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">💡</Text>
                  <Text className="text-sm font-medium text-foreground">Conseil</Text>
                </View>
                <Text className="text-xs text-muted">
                  Pour un meilleur rendu, photographiez votre bijou sur un fond uni et bien éclairé.
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

function FilterDropdown({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      style={[ecrinStyles.filterChip, { borderColor: colors.border }]}
    >
      <Text style={[ecrinStyles.filterChipText, { color: colors.muted }]}>{label}</Text>
      <IconSymbol name="chevron.down" size={12} color={colors.muted} />
    </TouchableOpacity>
  );
}

function JewelryCard({ 
  item, 
  colors,
  onToggleFavorite,
  onTryOn,
}: { 
  item: JewelryItem; 
  colors: ReturnType<typeof useColors>;
  onToggleFavorite: () => void;
  onTryOn?: () => void;
}) {
  return (
    <View style={[ecrinStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Image */}
      <TouchableOpacity
        style={[ecrinStyles.cardImage, { backgroundColor: colors.background }]}
        onPress={onTryOn}
        activeOpacity={0.85}
      >
        {item.image ? (
          <Image
            source={typeof item.image === "string" ? { uri: item.image } : item.image}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <IconSymbol name="diamond.fill" size={32} color={colors.border} />
        )}
        {/* Favori */}
        <TouchableOpacity
          onPress={onToggleFavorite}
          style={ecrinStyles.favoriteBtn}
        >
          <IconSymbol
            name={item.isFavorite ? "heart.fill" : "heart"}
            size={14}
            color={item.isFavorite ? "#C9A96E" : colors.muted}
          />
        </TouchableOpacity>
        {/* Badge Essayer */}
        {item.isDemo && (
          <View style={[ecrinStyles.tryBadge, { backgroundColor: colors.primary }]}>
            <Text style={[ecrinStyles.tryBadgeText, { color: colors.foreground }]}>ESSAYER</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={ecrinStyles.cardInfo}>
        <Text style={[ecrinStyles.cardName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[ecrinStyles.cardBrand, { color: colors.muted }]} numberOfLines={1}>
          {item.brand || ""}
        </Text>
      </View>
    </View>
  );
}

const ecrinStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 4,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "400",
    letterSpacing: 3,
    marginTop: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLine: {
    height: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "300",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterChipText: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  card: {
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardImage: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  favoriteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  tryBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 5,
    alignItems: "center",
  },
  tryBadgeText: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 2,
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  cardBrand: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({});
