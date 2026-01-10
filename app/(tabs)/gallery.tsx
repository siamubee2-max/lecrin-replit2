import { Text, View, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Mock data for demonstration
const MOCK_TRYONS = [
  { id: "1", type: "Bague", date: "10 Jan 2026", emoji: "💍" },
  { id: "2", type: "Collier", date: "9 Jan 2026", emoji: "📿" },
  { id: "3", type: "Bracelet", date: "8 Jan 2026", emoji: "⌚" },
  { id: "4", type: "Boucles", date: "7 Jan 2026", emoji: "💎" },
];

export default function GalleryScreen() {
  const colors = useColors();
  const [tryOns, setTryOns] = useState(MOCK_TRYONS);

  const handleDelete = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setTryOns(prev => prev.filter(item => item.id !== id));
  };

  const handleShare = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement share functionality
  };

  const renderItem = ({ item }: { item: typeof MOCK_TRYONS[0] }) => (
    <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
      <View className="flex-row items-center">
        {/* Thumbnail placeholder */}
        <View 
          className="w-20 h-20 rounded-xl bg-background items-center justify-center mr-4"
          style={{ borderWidth: 1, borderColor: colors.border }}
        >
          <Text className="text-4xl">{item.emoji}</Text>
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">{item.type}</Text>
          <Text className="text-sm text-muted mt-1">{item.date}</Text>
        </View>

        {/* Actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleShare(item.id)}
            className="w-10 h-10 rounded-full bg-background items-center justify-center active:opacity-70"
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            className="w-10 h-10 rounded-full bg-background items-center justify-center active:opacity-70"
          >
            <IconSymbol name="trash.fill" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-6xl mb-4">📷</Text>
      <Text className="text-xl font-semibold text-foreground text-center mb-2">
        Aucun essayage
      </Text>
      <Text className="text-base text-muted text-center">
        Commencez par photographier un bijou pour l'essayer virtuellement
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-foreground">
            Mes Essayages
          </Text>
          <Text className="text-base text-muted mt-1">
            {tryOns.length} essayage{tryOns.length !== 1 ? "s" : ""} sauvegardé{tryOns.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* List */}
        {tryOns.length > 0 ? (
          <FlatList
            data={tryOns}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </ScreenContainer>
  );
}
