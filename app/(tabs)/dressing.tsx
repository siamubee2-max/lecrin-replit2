import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

// Types
type Category = "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "bags" | "accessories" | "other";
type Season = "spring" | "summer" | "fall" | "winter" | "all";
type Occasion = "casual" | "work" | "formal" | "sport" | "party" | "all";

interface WardrobeItem {
  id: number;
  name: string;
  category: Category;
  brand?: string | null;
  color?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  season?: Season | null;
  occasion?: Occasion | null;
  isFavorite?: boolean | null;
}

// Constants
const CATEGORIES: { id: Category | "all"; label: string; icon: string }[] = [
  { id: "all", label: "Toutes", icon: "👗" },
  { id: "tops", label: "Hauts", icon: "👚" },
  { id: "bottoms", label: "Bas", icon: "👖" },
  { id: "dresses", label: "Robes", icon: "👗" },
  { id: "outerwear", label: "Vestes", icon: "🧥" },
  { id: "shoes", label: "Chaussures", icon: "👠" },
  { id: "bags", label: "Sacs", icon: "👜" },
  { id: "accessories", label: "Accessoires", icon: "🧣" },
  { id: "other", label: "Autres", icon: "📦" },
];

const COLORS = [
  { id: "all", label: "Toutes", hex: "#CCCCCC" },
  { id: "black", label: "Noir", hex: "#000000" },
  { id: "white", label: "Blanc", hex: "#FFFFFF" },
  { id: "red", label: "Rouge", hex: "#EF4444" },
  { id: "blue", label: "Bleu", hex: "#3B82F6" },
  { id: "green", label: "Vert", hex: "#22C55E" },
  { id: "yellow", label: "Jaune", hex: "#EAB308" },
  { id: "pink", label: "Rose", hex: "#EC4899" },
  { id: "purple", label: "Violet", hex: "#8B5CF6" },
  { id: "orange", label: "Orange", hex: "#F97316" },
  { id: "brown", label: "Marron", hex: "#92400E" },
  { id: "gray", label: "Gris", hex: "#6B7280" },
  { id: "beige", label: "Beige", hex: "#D4A574" },
  { id: "navy", label: "Marine", hex: "#1E3A5F" },
  { id: "gold", label: "Doré", hex: "#D4AF37" },
  { id: "silver", label: "Argenté", hex: "#C0C0C0" },
];

// Demo wardrobe items (shown when user is not logged in or has no items)
// No prices for demo items - they are just for trying out the app
const DEMO_WARDROBE: (WardrobeItem & { isDemo?: boolean })[] = [
  {
    id: -1,
    name: "Chemisier Soie Ivoire",
    category: "tops",
    brand: "Sandro",
    color: "beige",
    imageUrl: null,
    season: "all",
    occasion: "work",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -2,
    name: "Pantalon Tailleur Marine",
    category: "bottoms",
    brand: "Maje",
    color: "navy",
    imageUrl: null,
    season: "all",
    occasion: "work",
    isFavorite: false,
    isDemo: true,
  },
  {
    id: -3,
    name: "Robe Cocktail Noire",
    category: "dresses",
    brand: "Ba&sh",
    color: "black",
    imageUrl: null,
    season: "all",
    occasion: "party",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -4,
    name: "Blazer Camel",
    category: "outerwear",
    brand: "The Kooples",
    color: "beige",
    imageUrl: null,
    season: "fall",
    occasion: "work",
    isFavorite: false,
    isDemo: true,
  },
  {
    id: -5,
    name: "Escarpins Cuir Nude",
    category: "shoes",
    brand: "Jonak",
    color: "beige",
    imageUrl: null,
    season: "all",
    occasion: "formal",
    isFavorite: true,
    isDemo: true,
  },
];

// CDN base URL for demo images
const DEMO_CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK";

// Demo images mapping (using CDN URLs)
const DEMO_IMAGES: Record<number, any> = {
  [-1]: { uri: `${DEMO_CDN}/top_f0aa9195.png` },
  [-2]: { uri: `${DEMO_CDN}/bottom_35b18c4f.png` },
  [-3]: { uri: `${DEMO_CDN}/dress_357ec580.png` },
  [-4]: { uri: `${DEMO_CDN}/jacket_d81912f6.png` },
  [-5]: { uri: `${DEMO_CDN}/heels_99098445.png` },
};

export default function DressingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // API queries
  const { data: wardrobeItems = [], isLoading, refetch } = trpc.wardrobe.list.useQuery(
    undefined,
    { enabled: !!user }
  );

  const deleteItemMutation = trpc.wardrobe.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // Use demo items when user has no items or is not logged in
  const displayItems = useMemo(() => {
    if (!user || wardrobeItems.length === 0) {
      return DEMO_WARDROBE;
    }
    return wardrobeItems;
  }, [user, wardrobeItems]);

  const isShowingDemo = !user || wardrobeItems.length === 0;

  // Extract unique brands from items
  const brands = useMemo(() => {
    const uniqueBrands = new Set<string>();
    displayItems.forEach((item) => {
      if (item.brand) uniqueBrands.add(item.brand);
    });
    return ["all", ...Array.from(uniqueBrands).sort()];
  }, [displayItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return displayItems.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesBrand = item.brand?.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) return false;

      // Brand filter
      if (selectedBrand !== "all" && item.brand !== selectedBrand) return false;

      // Color filter
      if (selectedColor !== "all" && item.color !== selectedColor) return false;

      // Price filters
      if (minPrice && item.price && item.price < parseInt(minPrice) * 100) return false;
      if (maxPrice && item.price && item.price > parseInt(maxPrice) * 100) return false;

      return true;
    });
  }, [wardrobeItems, searchQuery, selectedCategory, selectedBrand, selectedColor, minPrice, maxPrice]);

  // Handlers
  const handleHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleAddItem = useCallback(() => {
    handleHaptic();
    setShowAddModal(true);
  }, [handleHaptic]);

  const handleAIStylist = useCallback(() => {
    handleHaptic();
    router.push("/ai-stylist" as any);
  }, [handleHaptic, router]);

  const toggleSelectionMode = useCallback(() => {
    handleHaptic();
    setSelectionMode(!selectionMode);
    setSelectedItems([]);
  }, [handleHaptic, selectionMode]);

  const toggleItemSelection = useCallback((id: number) => {
    handleHaptic();
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, [handleHaptic]);

  const handleDeleteSelected = useCallback(async () => {
    handleHaptic();
    for (const id of selectedItems) {
      await deleteItemMutation.mutateAsync({ id });
    }
    setSelectedItems([]);
    setSelectionMode(false);
  }, [handleHaptic, selectedItems, deleteItemMutation]);

  const clearFilters = useCallback(() => {
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedColor("all");
    setMinPrice("");
    setMaxPrice("");
  }, []);

  const hasActiveFilters = selectedCategory !== "all" || selectedBrand !== "all" || 
    selectedColor !== "all" || minPrice !== "" || maxPrice !== "";

  // Render item
  const renderItem = useCallback(({ item }: { item: WardrobeItem }) => (
    <TouchableOpacity
      className="w-[48%] mb-4 bg-surface rounded-xl overflow-hidden border border-border"
      style={{ opacity: selectionMode && !selectedItems.includes(item.id) ? 0.6 : 1 }}
      onPress={() => {
        if (selectionMode) {
          toggleItemSelection(item.id);
        } else {
          handleHaptic();
          // Navigate to item detail
        }
      }}
      activeOpacity={0.8}
    >
      {/* Selection indicator */}
      {selectionMode && (
        <View className="absolute top-2 right-2 z-10">
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              selectedItems.includes(item.id)
                ? "bg-primary border-primary"
                : "bg-white/80 border-gray-300"
            }`}
          >
            {selectedItems.includes(item.id) && (
              <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
        </View>
      )}

      {/* Image */}
      <View className="aspect-square bg-gray-100 relative">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : DEMO_IMAGES[item.id] ? (
          <Image
            source={DEMO_IMAGES[item.id]}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-4xl">
              {CATEGORIES.find((c) => c.id === item.category)?.icon || "👗"}
            </Text>
          </View>
        )}
        {/* Try-on badge for demo items */}
        {(item as any).isDemo && (
          <View 
            className="absolute bottom-2 left-2 right-2 rounded-lg py-1 px-2 flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <IconSymbol name="sparkles" size={12} color="#0A1A3B" />
            <Text className="text-xs font-semibold ml-1" style={{ color: "#0A1A3B" }}>Essayer</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View className="p-3">
        <Text className="text-foreground font-medium text-sm" numberOfLines={1}>
          {item.name}
        </Text>
        {item.brand && (
          <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
            {item.brand}
          </Text>
        )}
        <View className="flex-row items-center justify-between mt-2">
          {(item as any).isDemo ? (
            <View className="bg-primary/20 rounded px-2 py-0.5">
              <Text className="text-xs" style={{ color: colors.primary }}>Démo</Text>
            </View>
          ) : item.price ? (
            <Text className="text-primary font-semibold text-sm">
              {(item.price / 100).toFixed(0)}€
            </Text>
          ) : (
            <View />
          )}
          {item.color && (
            <View
              className="w-4 h-4 rounded-full border border-border"
              style={{
                backgroundColor: COLORS.find((c) => c.id === item.color)?.hex || "#CCCCCC",
              }}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), [selectionMode, selectedItems, toggleItemSelection, handleHaptic]);

  // Example items for empty state
  const EXAMPLE_ITEMS = [
    { id: "top", label: "Haut", image: { uri: `${DEMO_CDN}/top_f0aa9195.png` } },
    { id: "bottom", label: "Bas", image: { uri: `${DEMO_CDN}/bottom_35b18c4f.png` } },
    { id: "dress", label: "Robe", image: { uri: `${DEMO_CDN}/dress_357ec580.png` } },
    { id: "jacket", label: "Veste", image: { uri: `${DEMO_CDN}/jacket_d81912f6.png` } },
    { id: "shoes", label: "Chaussures", image: { uri: `${DEMO_CDN}/heels_99098445.png` } },
  ];

  // Empty state
  const renderEmptyState = () => (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="items-center py-8">
        <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
          <IconSymbol name="tshirt.fill" size={40} color={colors.muted} />
        </View>
        <Text className="text-xl font-semibold text-foreground mb-2">
          Votre dressing est vide
        </Text>
        <Text className="text-muted text-center px-8 mb-4">
          Ajoutez vos vêtements pour créer des looks parfaits avec vos bijoux
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full flex-row items-center mb-6"
          onPress={handleAddItem}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={20} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">Ajouter un vêtement</Text>
        </TouchableOpacity>
      </View>

      {/* Example items section */}
      <View className="px-4">
        <Text className="text-lg font-semibold text-foreground mb-2">
          Exemples de catégories
        </Text>
        <Text className="text-muted text-sm mb-4">
          Voici les types de vêtements que vous pouvez ajouter à votre dressing
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {EXAMPLE_ITEMS.map((item) => (
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
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-2xl font-bold text-foreground">Mon Dressing</Text>
            <Text className="text-muted text-sm mt-1">
              Gérez vos vêtements et créez des looks parfaits avec vos bijoux.
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: "#F5E6D3" }}
            onPress={handleAIStylist}
            activeOpacity={0.8}
          >
            <IconSymbol name="sparkles" size={20} color="#D4AF37" />
            <Text className="font-semibold ml-2" style={{ color: "#8B6914" }}>
              AI Stylist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-foreground"
            onPress={handleAddItem}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={20} color={colors.background} />
            <Text className="font-semibold ml-2" style={{ color: colors.background }}>
              Ajouter un vêtement
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and filters */}
      <View className="px-4 pb-3">
        {/* Search bar */}
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border">
          <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 ml-3 text-foreground"
            placeholder="Rechercher (robe rouge, chemise soie...)"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <IconSymbol name="xmark" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {/* Category dropdown */}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              selectedCategory !== "all" ? "bg-primary border-primary" : "bg-surface border-border"
            }`}
            onPress={() => setShowFilters(true)}
          >
            <Text
              className={`text-sm font-medium ${
                selectedCategory !== "all" ? "text-white" : "text-foreground"
              }`}
            >
              {CATEGORIES.find((c) => c.id === selectedCategory)?.label || "Catégories"}
            </Text>
            <IconSymbol
              name="chevron.down"
              size={14}
              color={selectedCategory !== "all" ? "#FFFFFF" : colors.foreground}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Brand dropdown */}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              selectedBrand !== "all" ? "bg-primary border-primary" : "bg-surface border-border"
            }`}
            onPress={() => setShowFilters(true)}
          >
            <Text
              className={`text-sm font-medium ${
                selectedBrand !== "all" ? "text-white" : "text-foreground"
              }`}
            >
              {selectedBrand !== "all" ? selectedBrand : "Marques"}
            </Text>
            <IconSymbol
              name="chevron.down"
              size={14}
              color={selectedBrand !== "all" ? "#FFFFFF" : colors.foreground}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Color dropdown */}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              selectedColor !== "all" ? "bg-primary border-primary" : "bg-surface border-border"
            }`}
            onPress={() => setShowFilters(true)}
          >
            {selectedColor !== "all" && (
              <View
                className="w-4 h-4 rounded-full mr-2 border border-white/30"
                style={{
                  backgroundColor: COLORS.find((c) => c.id === selectedColor)?.hex,
                }}
              />
            )}
            <Text
              className={`text-sm font-medium ${
                selectedColor !== "all" ? "text-white" : "text-foreground"
              }`}
            >
              {selectedColor !== "all"
                ? COLORS.find((c) => c.id === selectedColor)?.label
                : "Couleurs"}
            </Text>
            <IconSymbol
              name="chevron.down"
              size={14}
              color={selectedColor !== "all" ? "#FFFFFF" : colors.foreground}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Price range */}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full border ${
              minPrice || maxPrice ? "bg-primary border-primary" : "bg-surface border-border"
            }`}
            onPress={() => setShowFilters(true)}
          >
            <Text
              className={`text-sm font-medium ${
                minPrice || maxPrice ? "text-white" : "text-foreground"
              }`}
            >
              {minPrice || maxPrice
                ? `${minPrice || "0"}€ - ${maxPrice || "∞"}€`
                : "Prix"}
            </Text>
            <IconSymbol
              name="chevron.down"
              size={14}
              color={minPrice || maxPrice ? "#FFFFFF" : colors.foreground}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Clear filters */}
          {hasActiveFilters && (
            <TouchableOpacity
              className="flex-row items-center px-4 py-2 rounded-full bg-error/10 border border-error/20"
              onPress={clearFilters}
            >
              <IconSymbol name="xmark" size={14} color={colors.error} />
              <Text className="text-sm font-medium text-error ml-1">Effacer</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Selection mode toggle */}
        {wardrobeItems.length > 0 && (
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-muted text-sm">
              {filteredItems.length} article{filteredItems.length !== 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              className="flex-row items-center"
              onPress={toggleSelectionMode}
            >
              <Text className={`text-sm font-medium ${selectionMode ? "text-primary" : "text-muted"}`}>
                {selectionMode ? "Annuler" : "Sélectionner"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Demo banner */}
      {isShowingDemo && (
        <View className="mx-4 mb-3 p-3 rounded-xl" style={{ backgroundColor: "#FEF3C7" }}>
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">✨</Text>
            <View className="flex-1">
              <Text className="text-sm font-medium" style={{ color: "#92400E" }}>
                Mode démonstration
              </Text>
              <Text className="text-xs" style={{ color: "#B45309" }}>
                Connectez-vous pour ajouter vos propres vêtements
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredItems.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Selection action bar */}
      {selectionMode && selectedItems.length > 0 && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-4 py-4"
          style={{ paddingBottom: Platform.OS === "ios" ? 34 : 16 }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-foreground font-medium">
              {selectedItems.length} sélectionné{selectedItems.length !== 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              className="flex-row items-center bg-error px-4 py-2 rounded-full"
              onPress={handleDeleteSelected}
            >
              <IconSymbol name="trash.fill" size={18} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text className="text-primary font-medium">Annuler</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">Filtres</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text className="text-error font-medium">Effacer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Categories */}
            <Text className="text-foreground font-semibold mb-3">Catégories</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCategory === cat.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === cat.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Brands */}
            <Text className="text-foreground font-semibold mb-3">Marques</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  className={`px-4 py-2 rounded-full border ${
                    selectedBrand === brand
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedBrand(brand)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedBrand === brand ? "text-white" : "text-foreground"
                    }`}
                  >
                    {brand === "all" ? "Toutes" : brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Colors */}
            <Text className="text-foreground font-semibold mb-3">Couleurs</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  className={`flex-row items-center px-3 py-2 rounded-full border ${
                    selectedColor === color.id
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedColor(color.id)}
                >
                  {color.id !== "all" && (
                    <View
                      className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                  <Text
                    className={`text-sm font-medium ${
                      selectedColor === color.id ? "text-white" : "text-foreground"
                    }`}
                  >
                    {color.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price range */}
            <Text className="text-foreground font-semibold mb-3">Prix (€)</Text>
            <View className="flex-row items-center gap-4 mb-6">
              <View className="flex-1">
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Min"
                  placeholderTextColor={colors.muted}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                />
              </View>
              <Text className="text-muted">-</Text>
              <View className="flex-1">
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Max"
                  placeholderTextColor={colors.muted}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>

          {/* Apply button */}
          <View className="px-4 py-4 border-t border-border">
            <TouchableOpacity
              className="bg-primary py-4 rounded-xl items-center"
              onPress={() => setShowFilters(false)}
            >
              <Text className="text-white font-semibold text-lg">
                Appliquer les filtres
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal - Placeholder for now */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddItemModal onClose={() => setShowAddModal(false)} onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }} />
      </Modal>
    </ScreenContainer>
  );
}

// Add Item Modal Component
function AddItemModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("tops");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addItemMutation = trpc.wardrobe.add.useMutation();
  const uploadImageMutation = trpc.wardrobe.uploadImage.useMutation();

  const handlePickImage = async () => {
    try {
      // Dynamic import to avoid issues on web
      const ImagePicker = await import("expo-image-picker");
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);

        // Upload to server
        if (asset.base64) {
          setIsUploading(true);
          try {
            const uploadResult = await uploadImageMutation.mutateAsync({
              base64Data: asset.base64,
              mimeType: asset.mimeType || "image/jpeg",
            });
            setImageUri(uploadResult.url);
          } catch (error) {
            console.error("Failed to upload image:", error);
            // Keep local URI as fallback
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error) {
      console.error("Failed to pick image:", error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Permission d'accès à la caméra requise");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);

        if (asset.base64) {
          setIsUploading(true);
          try {
            const uploadResult = await uploadImageMutation.mutateAsync({
              base64Data: asset.base64,
              mimeType: asset.mimeType || "image/jpeg",
            });
            setImageUri(uploadResult.url);
          } catch (error) {
            console.error("Failed to upload image:", error);
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error) {
      console.error("Failed to take photo:", error);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addItemMutation.mutateAsync({
        name: name.trim(),
        category,
        brand: brand.trim() || undefined,
        color: color || undefined,
        price: price ? parseInt(price) * 100 : undefined,
        imageUrl: imageUri || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <TouchableOpacity onPress={onClose}>
          <Text className="text-primary font-medium">Annuler</Text>
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-foreground">Nouveau vêtement</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={!name.trim() || isSubmitting || isUploading}>
          <Text className={`font-medium ${name.trim() && !isSubmitting && !isUploading ? "text-primary" : "text-muted"}`}>
            {isSubmitting ? "..." : "Ajouter"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Photo */}
        <View className="mb-6">
          {imageUri ? (
            <View className="relative">
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 16 }}
                contentFit="cover"
              />
              {isUploading && (
                <View className="absolute inset-0 bg-black/50 rounded-2xl items-center justify-center">
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text className="text-white mt-2">Upload en cours...</Text>
                </View>
              )}
              <TouchableOpacity
                className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                onPress={() => setImageUri(null)}
              >
                <IconSymbol name="xmark" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center border-2 border-dashed border-border"
                onPress={handlePickImage}
              >
                <IconSymbol name="photo.fill" size={36} color={colors.muted} />
                <Text className="text-muted mt-2 text-sm">Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 aspect-square bg-surface rounded-2xl items-center justify-center border-2 border-dashed border-border"
                onPress={handleTakePhoto}
              >
                <IconSymbol name="camera.fill" size={36} color={colors.muted} />
                <Text className="text-muted mt-2 text-sm">Caméra</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Name */}
        <Text className="text-foreground font-medium mb-2">Nom *</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="Ex: Robe noire Zara"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />

        {/* Category */}
        <Text className="text-foreground font-medium mb-2">Catégorie *</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
            <TouchableOpacity
              key={cat.id}
              className={`px-4 py-2 rounded-full border ${
                category === cat.id ? "bg-primary border-primary" : "bg-surface border-border"
              }`}
              onPress={() => setCategory(cat.id as Category)}
            >
              <Text
                className={`text-sm font-medium ${
                  category === cat.id ? "text-white" : "text-foreground"
                }`}
              >
                {cat.icon} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Brand */}
        <Text className="text-foreground font-medium mb-2">Marque</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="Ex: Zara, H&M, Chanel..."
          placeholderTextColor={colors.muted}
          value={brand}
          onChangeText={setBrand}
        />

        {/* Color */}
        <Text className="text-foreground font-medium mb-2">Couleur</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {COLORS.filter((c) => c.id !== "all").map((c) => (
            <TouchableOpacity
              key={c.id}
              className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                color === c.id ? "border-primary" : "border-transparent"
              }`}
              onPress={() => setColor(c.id)}
            >
              <View
                className="w-8 h-8 rounded-full border border-gray-200"
                style={{ backgroundColor: c.hex }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Price */}
        <Text className="text-foreground font-medium mb-2">Prix (€)</Text>
        <TextInput
          className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-4"
          placeholder="Ex: 49"
          placeholderTextColor={colors.muted}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
      </ScrollView>
    </View>
  );
}
