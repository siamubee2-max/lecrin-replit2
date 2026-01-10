import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TryOnScreen() {
  const colors = useColors();
  const router = useRouter();
  const [jewelrySize, setJewelrySize] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleSizeChange = (delta: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setJewelrySize(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleCapture = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      router.push("/gallery");
    }, 1500);
  };

  const handleShare = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement share
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-2">
          <TouchableOpacity
            onPress={handleClose}
            className="w-10 h-10 rounded-full bg-surface items-center justify-center active:opacity-70"
          >
            <IconSymbol name="xmark" size={20} color={colors.foreground} />
          </TouchableOpacity>
          
          <Text className="text-lg font-semibold text-foreground">
            Essayage Virtuel
          </Text>
          
          <TouchableOpacity
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-surface items-center justify-center active:opacity-70"
          >
            <IconSymbol name="square.and.arrow.up" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* AR View Placeholder */}
        <View className="flex-1 mx-4 my-4 rounded-3xl overflow-hidden bg-surface border border-border">
          <View className="flex-1 items-center justify-center">
            {/* Simulated AR view */}
            <View className="w-48 h-48 rounded-full bg-background/50 items-center justify-center mb-4">
              <Text className="text-6xl">👤</Text>
            </View>
            
            {/* Jewelry overlay */}
            <View 
              className="absolute items-center justify-center"
              style={{ 
                transform: [{ scale: jewelrySize }],
                top: '35%',
              }}
            >
              <Text className="text-5xl">💍</Text>
            </View>

            {/* AR Status */}
            <View className="absolute bottom-4 left-4 right-4">
              <View className="bg-background/90 rounded-xl px-4 py-3">
                <Text className="text-sm text-foreground text-center">
                  📍 Bijou positionné • Ajustez la taille ci-dessous
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View className="px-6 pb-6">
          {/* Size Controls */}
          <View className="flex-row items-center justify-center mb-6">
            <TouchableOpacity
              onPress={() => handleSizeChange(-0.1)}
              className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center active:opacity-70"
            >
              <IconSymbol name="minus" size={20} color={colors.foreground} />
            </TouchableOpacity>
            
            <View className="mx-6 items-center">
              <Text className="text-sm text-muted">Taille</Text>
              <Text className="text-lg font-semibold text-foreground">
                {Math.round(jewelrySize * 100)}%
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => handleSizeChange(0.1)}
              className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center active:opacity-70"
            >
              <IconSymbol name="plus" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Capture Button */}
          <TouchableOpacity
            onPress={handleCapture}
            disabled={isSaving}
            className="py-4 px-8 rounded-full items-center active:opacity-80"
            style={[
              styles.captureButton,
              { 
                backgroundColor: colors.primary,
                opacity: isSaving ? 0.7 : 1,
              }
            ]}
          >
            <Text className="text-background text-lg font-bold">
              {isSaving ? "Sauvegarde..." : "Sauvegarder l'Essayage"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  captureButton: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
