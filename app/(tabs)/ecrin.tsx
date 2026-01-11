import { ScrollView, Text, View, TouchableOpacity, TextInput, StyleSheet, FlatList, Platform, Modal, KeyboardAvoidingView, Alert } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

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

// Demo jewelry items with real images
const DEMO_JEWELRY = [
  {
    id: "1",
    name: "Collier Pendentif Or",
    type: "Necklace",
    brand: "Moniattitude",
    image: require("@/assets/examples/jewelry/necklace.png"),
    isFavorite: true,
    metal: "Gold",
    price: 12900,
  },
  {
    id: "2",
    name: "Boucles d'Oreilles Diamant",
    type: "Earrings",
    brand: "Moniattitude",
    image: require("@/assets/examples/jewelry/earrings.png"),
    isFavorite: false,
    metal: "Gold",
    price: 8900,
  },
  {
    id: "3",
    name: "Bague Solitaire",
    type: "Ring",
    brand: "Custom",
    image: require("@/assets/examples/jewelry/ring.png"),
    isFavorite: true,
    metal: "Gold",
    price: 15900,
  },
  {
    id: "4",
    name: "Bracelet Chaîne Or",
    type: "Bracelet",
    brand: "Moniattitude",
    image: require("@/assets/examples/jewelry/bracelet.png"),
    isFavorite: false,
    metal: "Gold",
    price: 6900,
  },
  {
    id: "5",
    name: "Chevillière Élégante",
    type: "Bracelet",
    brand: "Custom",
    image: require("@/assets/examples/jewelry/anklet.png"),
    isFavorite: false,
    metal: "Gold",
    price: 4900,
  },
];

export default function EcrinScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [showFilters, setShowFilters] = useState(false);
  const [jewelry, setJewelry] = useState(DEMO_JEWELRY);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJewelryName, setNewJewelryName] = useState("");
  const [newJewelryType, setNewJewelryType] = useState("Necklace");
  const [newJewelryBrand, setNewJewelryBrand] = useState("");
  const [newJewelryImage, setNewJewelryImage] = useState<string | null>(null);

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

  const handleSaveNewJewelry = () => {
    if (!newJewelryName.trim()) return;
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const newItem = {
      id: Date.now().toString(),
      name: newJewelryName.trim(),
      type: newJewelryType,
      brand: newJewelryBrand.trim() || "Custom",
      image: newJewelryImage,
      isFavorite: false,
      metal: "Gold",
      price: 0,
    };
    
    setJewelry(prev => [newItem, ...prev]);
    setNewJewelryName("");
    setNewJewelryType("Necklace");
    setNewJewelryBrand("");
    setNewJewelryImage(null);
    setShowAddModal(false);
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
                  { id: "necklace", label: "Collier", image: require("@/assets/examples/jewelry/necklace.png") },
                  { id: "earrings", label: "Boucles d'oreilles", image: require("@/assets/examples/jewelry/earrings.png") },
                  { id: "ring", label: "Bague", image: require("@/assets/examples/jewelry/ring.png") },
                  { id: "bracelet", label: "Bracelet", image: require("@/assets/examples/jewelry/bracelet.png") },
                  { id: "anklet", label: "Chevillière", image: require("@/assets/examples/jewelry/anklet.png") },
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
  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2).replace(".", ",") + " €";
  };

  return (
    <View 
      className="w-[48%] rounded-2xl overflow-hidden mb-3"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      {/* Image */}
      <View 
        className="aspect-square items-center justify-center relative"
        style={{ backgroundColor: colors.background }}
      >
        {item.image ? (
          <Image
            source={typeof item.image === "string" ? { uri: item.image } : item.image}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-4xl">💍</Text>
        )}
        <TouchableOpacity
          onPress={onToggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
        >
          <IconSymbol 
            name={item.isFavorite ? "heart.fill" : "heart"} 
            size={18} 
            color={item.isFavorite ? "#EF4444" : colors.muted} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Info */}
      <View className="p-3">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-xs text-muted">{item.brand}</Text>
          {item.price && (
            <Text className="text-xs font-semibold" style={{ color: colors.primary }}>
              {formatPrice(item.price)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
