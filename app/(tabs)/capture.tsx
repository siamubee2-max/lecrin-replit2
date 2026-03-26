import { Text, View, TouchableOpacity, StyleSheet, Alert , Platform } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function CaptureScreen() {
  const colors = useColors();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à l'appareil photo est nécessaire pour capturer un bijou.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsCapturing(true);
    
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        // Navigate to ecrin screen with the captured image
        router.push({
          pathname: "/(tabs)/ecrin",
          params: { newJewelryImage: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à l'appareil photo.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGalleryImport = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Request media library permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la galerie est nécessaire pour importer une photo.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri);
        // Navigate to ecrin screen with the imported image
        router.push({
          pathname: "/(tabs)/ecrin",
          params: { newJewelryImage: result.assets[0].uri },
        });
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert("Erreur", "Impossible d'accéder à la galerie.");
    }
  };

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4">
          <Text className="text-2xl font-bold text-foreground text-center">
            Capturer un Bijou
          </Text>
          <Text className="text-base text-muted text-center mt-2">
            Photographiez un bijou en vitrine ou dans un magazine
          </Text>
        </View>

        {/* Camera Preview Area */}
        <View className="flex-1 mx-6 mb-6 rounded-3xl overflow-hidden bg-surface border-2 border-border">
          {/* Placeholder for camera view */}
          <View className="flex-1 items-center justify-center">
            {capturedImage ? (
              <Image
                source={{ uri: capturedImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View 
                className="w-64 h-64 rounded-full border-4 border-dashed items-center justify-center"
                style={{ borderColor: colors.primary }}
              >
                <Text className="text-6xl mb-4">💍</Text>
                <Text className="text-base text-muted text-center px-8">
                  Cadrez le bijou dans le cercle
                </Text>
              </View>
            )}
          </View>

          {/* Guide overlay */}
          <View className="absolute top-4 left-4 right-4">
            <View className="bg-background/80 rounded-xl px-4 py-2">
              <Text className="text-sm text-foreground text-center">
                💡 Conseil : Assurez-vous que le bijou est bien éclairé
              </Text>
            </View>
          </View>
        </View>

        {/* Controls */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-center gap-8">
            {/* Gallery Button */}
            <TouchableOpacity
              onPress={handleGalleryImport}
              className="w-14 h-14 rounded-full bg-surface border border-border items-center justify-center"
              activeOpacity={0.7}
            >
              <IconSymbol name="photo.fill" size={24} color={colors.foreground} />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isCapturing}
              activeOpacity={0.8}
              style={[
                styles.captureButton,
                { 
                  backgroundColor: colors.primary,
                  opacity: isCapturing ? 0.7 : 1,
                }
              ]}
            >
              <View 
                className="w-16 h-16 rounded-full border-4"
                style={{ borderColor: colors.background }}
              />
            </TouchableOpacity>

            {/* Placeholder for symmetry */}
            <View className="w-14 h-14" />
          </View>

          <Text className="text-sm text-muted text-center mt-4">
            Appuyez pour capturer ou importez depuis la galerie
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
