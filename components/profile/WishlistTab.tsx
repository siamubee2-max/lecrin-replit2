/**
 * Wishlist Tab Component
 * Displays and manages the user's jewelry wishlist
 */

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, Modal, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  WishlistItem,
  loadWishlist,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
  PRIORITY_NAMES,
  PRIORITY_ICONS,
} from "@/services/style-preferences-service";

interface WishlistTabProps {
  onItemSelect?: (item: WishlistItem) => void;
}

const JEWELRY_TYPES = [
  { id: "necklace", name: "Collier", icon: "📿" },
  { id: "earrings", name: "Boucles d'oreilles", icon: "💎" },
  { id: "ring", name: "Bague", icon: "💍" },
  { id: "bracelet", name: "Bracelet", icon: "⌚" },
  { id: "anklet", name: "Chevillière", icon: "🦶" },
  { id: "brooch", name: "Broche", icon: "📌" },
];

const METAL_TYPES = [
  { id: "gold", name: "Or" },
  { id: "silver", name: "Argent" },
  { id: "rose_gold", name: "Or Rose" },
  { id: "platinum", name: "Platine" },
];

export function WishlistTab({ onItemSelect }: WishlistTabProps) {
  const colors = useColors();
  const { t } = useI18n();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  
  // Add form state
  const [newItem, setNewItem] = useState({
    name: "",
    type: "necklace",
    metal: "gold",
    price: "",
    notes: "",
    priority: "medium" as WishlistItem["priority"],
  });

  useEffect(() => {
    loadWishlistData();
  }, []);

  const loadWishlistData = async () => {
    setIsLoading(true);
    try {
      const loaded = await loadWishlist();
      setWishlist(loaded);
    } catch (error) {
      console.error("Error loading wishlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert(t.common?.error || "Erreur", "Veuillez entrer un nom pour le bijou.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const item = await addToWishlist({
        name: newItem.name.trim(),
        type: newItem.type,
        metal: newItem.metal,
        price: newItem.price ? parseFloat(newItem.price) : undefined,
        currency: "EUR",
        notes: newItem.notes.trim() || undefined,
        priority: newItem.priority,
      });
      
      setWishlist((prev) => [item, ...prev]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      Alert.alert(t.common?.error || "Erreur", "Impossible d'ajouter le bijou.");
    }
  };

  const handleRemoveItem = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      t.profile?.wishlist?.removeConfirm || "Retirer de la liste ?",
      "",
      [
        { text: t.common?.cancel || "Annuler", style: "cancel" },
        {
          text: t.common?.delete || "Supprimer",
          style: "destructive",
          onPress: async () => {
            await removeFromWishlist(id);
            setWishlist((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const handleUpdatePriority = async (id: string, priority: WishlistItem["priority"]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    await updateWishlistItem(id, { priority });
    setWishlist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, priority } : item))
    );
  };

  const handleVisitBrand = (url: string) => {
    Linking.openURL(url);
  };

  const resetForm = () => {
    setNewItem({
      name: "",
      type: "necklace",
      metal: "gold",
      price: "",
      notes: "",
      priority: "medium",
    });
  };

  const getTypeIcon = (type: string) => {
    return JEWELRY_TYPES.find((t) => t.id === type)?.icon || "💎";
  };

  const getTypeName = (type: string) => {
    return JEWELRY_TYPES.find((t) => t.id === type)?.name || type;
  };

  const getMetalName = (metal: string) => {
    return METAL_TYPES.find((m) => m.id === metal)?.name || metal;
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedItem(item);
        onItemSelect?.(item);
      }}
      className="rounded-xl mb-3 overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row">
        {/* Icon */}
        <View
          className="w-20 h-20 items-center justify-center"
          style={{ backgroundColor: colors.background }}
        >
          <Text className="text-3xl">{getTypeIcon(item.type)}</Text>
        </View>
        
        {/* Info */}
        <View className="flex-1 p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            <View className="flex-row items-center ml-2">
              <Text className="mr-1">{PRIORITY_ICONS[item.priority]}</Text>
            </View>
          </View>
          
          <Text className="text-sm text-muted mt-1">
            {getTypeName(item.type)} • {getMetalName(item.metal)}
          </Text>
          
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-muted">
              {formatDate(item.addedAt)}
            </Text>
            {item.price && (
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                {formatPrice(item.price, item.currency)}
              </Text>
            )}
          </View>
        </View>
        
        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id)}
          className="px-3 items-center justify-center"
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      {/* Notes */}
      {item.notes && (
        <View className="px-4 pb-3">
          <Text className="text-xs text-muted italic" numberOfLines={2}>
            {'"'}{item.notes}{'"'}
          </Text>
        </View>
      )}
      
      {/* Brand Link */}
      {item.externalUrl && (
        <TouchableOpacity
          onPress={() => handleVisitBrand(item.externalUrl!)}
          className="flex-row items-center justify-center py-2 mx-3 mb-3 rounded-lg"
          style={{ backgroundColor: colors.primary + "20" }}
        >
          <IconSymbol name="arrow.up.right" size={14} color={colors.primary} />
          <Text className="text-sm font-medium ml-2" style={{ color: colors.primary }}>
            {t.profile?.wishlist?.visitBrand || "Visiter la marque"}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Add Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        className="flex-row items-center justify-center py-3 rounded-xl mb-4"
        style={{ backgroundColor: colors.primary }}
      >
        <IconSymbol name="plus" size={20} color="#0A1A3B" />
        <Text className="text-base font-semibold ml-2" style={{ color: "#0A1A3B" }}>
          {t.profile?.wishlist?.addItem || "Ajouter un bijou"}
        </Text>
      </TouchableOpacity>

      {wishlist.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <View
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-4xl">💝</Text>
          </View>
          <Text className="text-lg font-semibold text-foreground mb-2">
            {t.profile?.wishlist?.empty || "Liste vide"}
          </Text>
          <Text className="text-sm text-muted text-center px-8">
            {t.profile?.wishlist?.emptyDescription || "Ajoutez des bijoux à votre liste d'envies pour les retrouver facilement."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item.id}
          renderItem={renderWishlistItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Modal Header */}
          <View
            className="flex-row items-center justify-between px-4 py-4 border-b"
            style={{ borderBottomColor: colors.border }}
          >
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text className="text-base" style={{ color: colors.primary }}>
                {t.common?.cancel || "Annuler"}
              </Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">
              {t.profile?.wishlist?.addItem || "Ajouter un bijou"}
            </Text>
            <TouchableOpacity onPress={handleAddItem}>
              <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                {t.common?.save || "Ajouter"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="flex-1 p-4">
            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Nom du bijou *</Text>
              <TextInput
                value={newItem.name}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, name: text }))}
                placeholder="Ex: Collier en or avec diamant"
                placeholderTextColor={colors.muted}
                className="px-4 py-3 rounded-xl text-foreground"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            {/* Type Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Type de bijou</Text>
              <View className="flex-row flex-wrap gap-2">
                {JEWELRY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setNewItem((prev) => ({ ...prev, type: type.id }))}
                    className="flex-row items-center px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: newItem.type === type.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: newItem.type === type.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="mr-1">{type.icon}</Text>
                    <Text
                      className="text-sm"
                      style={{ color: newItem.type === type.id ? "#0A1A3B" : colors.foreground }}
                    >
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Metal Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Métal</Text>
              <View className="flex-row flex-wrap gap-2">
                {METAL_TYPES.map((metal) => (
                  <TouchableOpacity
                    key={metal.id}
                    onPress={() => setNewItem((prev) => ({ ...prev, metal: metal.id }))}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: newItem.metal === metal.id ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: newItem.metal === metal.id ? colors.primary : colors.border,
                    }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: newItem.metal === metal.id ? "#0A1A3B" : colors.foreground }}
                    >
                      {metal.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                {t.profile?.wishlist?.priority || "Priorité"}
              </Text>
              <View className="flex-row gap-2">
                {(["high", "medium", "low"] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setNewItem((prev) => ({ ...prev, priority }))}
                    className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                    style={{
                      backgroundColor: newItem.priority === priority ? colors.primary : colors.surface,
                      borderWidth: 1,
                      borderColor: newItem.priority === priority ? colors.primary : colors.border,
                    }}
                  >
                    <Text className="mr-1">{PRIORITY_ICONS[priority]}</Text>
                    <Text
                      className="text-sm"
                      style={{ color: newItem.priority === priority ? "#0A1A3B" : colors.foreground }}
                    >
                      {PRIORITY_NAMES[priority]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Prix estimé (€)</Text>
              <TextInput
                value={newItem.price}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, price: text.replace(/[^0-9.]/g, "") }))}
                placeholder="Ex: 250"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                className="px-4 py-3 rounded-xl text-foreground"
                style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
              />
            </View>

            {/* Notes Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                {t.profile?.wishlist?.notes || "Notes"}
              </Text>
              <TextInput
                value={newItem.notes}
                onChangeText={(text) => setNewItem((prev) => ({ ...prev, notes: text }))}
                placeholder={t.profile?.wishlist?.notesPlaceholder || "Ajoutez des notes..."}
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                className="px-4 py-3 rounded-xl text-foreground"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
