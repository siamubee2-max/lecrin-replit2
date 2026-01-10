import { ScrollView, Text, View, TouchableOpacity, TextInput, StyleSheet, FlatList } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const JEWELRY_TYPES = ["All Types", "Necklace", "Earrings", "Ring", "Bracelet", "Brooch"];

const FILTERS = {
  metals: ["All Metals", "Gold", "Silver", "Platinum", "Rose Gold"],
  gems: ["All Gems", "Diamond", "Ruby", "Sapphire", "Emerald", "Pearl"],
  brands: ["All Brands", "Moniattitude", "Custom"],
  collections: ["All Collections", "Summer 2025", "Classic", "Modern"],
};

// Demo jewelry items
const DEMO_JEWELRY = [
  {
    id: "1",
    name: "Boucles Géométriques",
    type: "Earrings",
    brand: "Moniattitude",
    image: null,
    isFavorite: true,
  },
  {
    id: "2", 
    name: "Collier Pendentif Cristal",
    type: "Necklace",
    brand: "Custom",
    image: null,
    isFavorite: false,
  },
];

export default function EcrinScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [showFilters, setShowFilters] = useState(false);
  const [jewelry, setJewelry] = useState(DEMO_JEWELRY);

  const handleAddJewelry = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // TODO: Open add jewelry modal
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

  const filteredJewelry = jewelry.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "All Types" || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Mon Écrin</Text>
          <Text className="text-base text-muted mt-1">
            Cataloguez vos bijoux précieux. L'IA vous aidera à les organiser et à trouver des correspondances.
          </Text>
        </View>

        {/* Add Button */}
        <View className="px-4 py-3">
          <TouchableOpacity
            onPress={handleAddJewelry}
            className="flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: colors.foreground }}
          >
            <IconSymbol name="plus" size={20} color={colors.background} />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.background }}>
              Ajouter un bijou
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View className="px-4">
          {/* Search Bar */}
          <View 
            className="flex-row items-center px-4 py-3 rounded-xl mb-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name, tags, description..."
              placeholderTextColor={colors.muted}
              className="flex-1 ml-3 text-base"
              style={{ color: colors.foreground }}
            />
          </View>

          {/* Type Filter Pills */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            {JEWELRY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                className="px-4 py-2 rounded-full mr-2"
                style={[
                  { borderWidth: 1, borderColor: colors.border },
                  selectedType === type && { backgroundColor: colors.foreground }
                ]}
              >
                <Text 
                  className="text-sm font-medium"
                  style={{ color: selectedType === type ? colors.background : colors.foreground }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Advanced Filters */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            <FilterDropdown label="All Metals" colors={colors} />
            <FilterDropdown label="All Gems" colors={colors} />
            <FilterDropdown label="All Brands" colors={colors} />
            <FilterDropdown label="All Collections" colors={colors} />
            <FilterDropdown label="Price Range" colors={colors} />
          </View>
        </View>

        {/* Jewelry Grid */}
        {filteredJewelry.length > 0 ? (
          <FlatList
            data={filteredJewelry}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            renderItem={({ item }) => (
              <JewelryCard
                item={item}
                colors={colors}
                onToggleFavorite={() => toggleFavorite(item.id)}
              />
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-5xl mb-4">💎</Text>
            <Text className="text-xl font-semibold text-foreground text-center mb-2">
              Votre écrin est vide
            </Text>
            <Text className="text-base text-muted text-center">
              Ajoutez vos premiers bijoux pour commencer votre collection virtuelle.
            </Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

function FilterDropdown({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-3 py-2 rounded-lg"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      <Text className="text-sm text-foreground mr-1">{label}</Text>
      <IconSymbol name="chevron.down" size={14} color={colors.muted} />
    </TouchableOpacity>
  );
}

function JewelryCard({ 
  item, 
  colors,
  onToggleFavorite 
}: { 
  item: typeof DEMO_JEWELRY[0]; 
  colors: ReturnType<typeof useColors>;
  onToggleFavorite: () => void;
}) {
  return (
    <View 
      className="w-[48%] rounded-2xl overflow-hidden mb-3"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      {/* Image Placeholder */}
      <View 
        className="aspect-square items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <TouchableOpacity
          onPress={onToggleFavorite}
          className="absolute top-2 left-2 w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.surface }}
        >
          <IconSymbol 
            name={item.isFavorite ? "heart.fill" : "heart"} 
            size={18} 
            color={item.isFavorite ? "#EF4444" : colors.muted} 
          />
        </TouchableOpacity>
        <Text className="text-4xl">💍</Text>
      </View>
      
      {/* Info */}
      <View className="p-3">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted mt-1">{item.brand}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
