import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_SIZE = SCREEN_WIDTH - 48;

/**
 * Types de ratio de recadrage
 */
export type AspectRatioType = "free" | "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

/**
 * Configuration d'un ratio
 */
export interface AspectRatioConfig {
  id: AspectRatioType;
  label: string;
  ratio: number | null; // null = libre
  icon: string;
}

/**
 * Options de transformation
 */
export interface TransformOptions {
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  cropArea: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  } | null;
  aspectRatio: AspectRatioType;
}

/**
 * Props du composant ImageCropper
 */
interface ImageCropperProps {
  imageUri: string;
  onApply: (transformedUri: string, options: TransformOptions) => void;
  onCancel: () => void;
  visible: boolean;
}

/**
 * Ratios de recadrage disponibles
 */
const ASPECT_RATIOS: AspectRatioConfig[] = [
  { id: "free", label: "Libre", ratio: null, icon: "⬜" },
  { id: "1:1", label: "1:1", ratio: 1, icon: "⬛" },
  { id: "4:3", label: "4:3", ratio: 4 / 3, icon: "📱" },
  { id: "3:4", label: "3:4", ratio: 3 / 4, icon: "📷" },
  { id: "16:9", label: "16:9", ratio: 16 / 9, icon: "🖥️" },
  { id: "9:16", label: "9:16", ratio: 9 / 16, icon: "📲" },
];

/**
 * Valeurs par défaut des transformations
 */
const DEFAULT_TRANSFORM: TransformOptions = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  cropArea: null,
  aspectRatio: "free",
};

/**
 * Composant principal de recadrage et rotation
 */
export function ImageCropper({ imageUri, onApply, onCancel, visible }: ImageCropperProps) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"crop" | "rotate">("crop");
  const [transformOptions, setTransformOptions] = useState<TransformOptions>(DEFAULT_TRANSFORM);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation values for crop area
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Calculer la taille du preview selon le ratio
  const previewDimensions = useMemo(() => {
    const selectedRatio = ASPECT_RATIOS.find(r => r.id === transformOptions.aspectRatio);
    if (!selectedRatio?.ratio) {
      return { width: PREVIEW_SIZE, height: PREVIEW_SIZE };
    }
    
    if (selectedRatio.ratio > 1) {
      return { width: PREVIEW_SIZE, height: PREVIEW_SIZE / selectedRatio.ratio };
    } else {
      return { width: PREVIEW_SIZE * selectedRatio.ratio, height: PREVIEW_SIZE };
    }
  }, [transformOptions.aspectRatio]);

  // Rotation de 90 degrés
  const handleRotate90 = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTransformOptions(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  // Rotation de -90 degrés
  const handleRotateMinus90 = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTransformOptions(prev => ({
      ...prev,
      rotation: (prev.rotation - 90 + 360) % 360,
    }));
  }, []);

  // Retournement horizontal
  const handleFlipHorizontal = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTransformOptions(prev => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  }, []);

  // Retournement vertical
  const handleFlipVertical = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTransformOptions(prev => ({
      ...prev,
      flipVertical: !prev.flipVertical,
    }));
  }, []);

  // Sélection du ratio
  const handleRatioSelect = useCallback((ratioId: AspectRatioType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTransformOptions(prev => ({
      ...prev,
      aspectRatio: ratioId,
    }));
  }, []);

  // Réinitialiser les transformations
  const handleReset = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setTransformOptions(DEFAULT_TRANSFORM);
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
  }, [scale, translateX, translateY]);

  // Appliquer les transformations
  const handleApply = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setIsProcessing(true);
    
    try {
      const actions: ImageManipulator.Action[] = [];
      
      // Ajouter la rotation si nécessaire
      if (transformOptions.rotation !== 0) {
        actions.push({ rotate: transformOptions.rotation });
      }
      
      // Ajouter le retournement horizontal
      if (transformOptions.flipHorizontal) {
        actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      }
      
      // Ajouter le retournement vertical
      if (transformOptions.flipVertical) {
        actions.push({ flip: ImageManipulator.FlipType.Vertical });
      }
      
      // Si aucune action, retourner l'image originale
      if (actions.length === 0) {
        onApply(imageUri, transformOptions);
        return;
      }
      
      // Appliquer les transformations
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );
      
      onApply(result.uri, transformOptions);
    } catch (error) {
      console.error("Error applying transformations:", error);
      onApply(imageUri, transformOptions);
    } finally {
      setIsProcessing(false);
    }
  }, [imageUri, transformOptions, onApply]);

  // Style animé pour l'image
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // Style de rotation et flip
  const transformStyle = useMemo(() => {
    const transforms: any[] = [];
    
    if (transformOptions.rotation !== 0) {
      transforms.push({ rotate: `${transformOptions.rotation}deg` });
    }
    
    if (transformOptions.flipHorizontal) {
      transforms.push({ scaleX: -1 });
    }
    
    if (transformOptions.flipVertical) {
      transforms.push({ scaleY: -1 });
    }
    
    return transforms.length > 0 ? { transform: transforms } : {};
  }, [transformOptions]);

  // Gesture pour le pinch-to-zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(0.5, Math.min(3, event.scale));
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
      }
    });

  // Gesture pour le pan
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      // Limiter le déplacement
      const maxTranslate = PREVIEW_SIZE * 0.3;
      if (Math.abs(translateX.value) > maxTranslate) {
        translateX.value = withTiming(translateX.value > 0 ? maxTranslate : -maxTranslate);
      }
      if (Math.abs(translateY.value) > maxTranslate) {
        translateY.value = withTiming(translateY.value > 0 ? maxTranslate : -maxTranslate);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.muted }]}>Annuler</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Ajuster</Text>
        <TouchableOpacity 
          onPress={handleApply} 
          style={styles.headerButton}
          disabled={isProcessing}
        >
          <Text style={[styles.headerButtonText, { color: colors.primary, opacity: isProcessing ? 0.5 : 1 }]}>
            {isProcessing ? "..." : "Suivant"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview Image */}
      <View style={styles.previewContainer}>
        <GestureHandlerRootView style={styles.gestureContainer}>
          <View 
            style={[
              styles.cropFrame, 
              { 
                backgroundColor: colors.surface,
                width: previewDimensions.width,
                height: previewDimensions.height,
              }
            ]}
          >
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.previewImage, transformStyle]}
                  contentFit="contain"
                />
              </Animated.View>
            </GestureDetector>
            
            {/* Crop Grid Overlay */}
            <View style={styles.gridOverlay} pointerEvents="none">
              <View style={[styles.gridLine, styles.gridLineHorizontal1, { backgroundColor: colors.background + "40" }]} />
              <View style={[styles.gridLine, styles.gridLineHorizontal2, { backgroundColor: colors.background + "40" }]} />
              <View style={[styles.gridLine, styles.gridLineVertical1, { backgroundColor: colors.background + "40" }]} />
              <View style={[styles.gridLine, styles.gridLineVertical2, { backgroundColor: colors.background + "40" }]} />
            </View>
          </View>
        </GestureHandlerRootView>

        {/* Reset Button */}
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <IconSymbol name="arrow.counterclockwise" size={16} color={colors.muted} />
          <Text style={[styles.resetText, { color: colors.muted }]}>Réinitialiser</Text>
        </TouchableOpacity>

        {/* Rotation Info */}
        {transformOptions.rotation !== 0 && (
          <View style={[styles.infoTag, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.infoText, { color: colors.primary }]}>
              {transformOptions.rotation}°
            </Text>
          </View>
        )}
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("crop")}
          style={[
            styles.tab,
            activeTab === "crop" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "crop" ? "#0A1A3B" : colors.muted },
            ]}
          >
            Recadrer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("rotate")}
          style={[
            styles.tab,
            activeTab === "rotate" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "rotate" ? "#0A1A3B" : colors.muted },
            ]}
          >
            Rotation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "crop" ? (
          <View style={styles.ratioContainer}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Format
            </Text>
            <View style={styles.ratioGrid}>
              {ASPECT_RATIOS.map((ratio) => (
                <TouchableOpacity
                  key={ratio.id}
                  onPress={() => handleRatioSelect(ratio.id)}
                  style={[
                    styles.ratioItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: transformOptions.aspectRatio === ratio.id ? colors.primary : colors.border,
                      borderWidth: transformOptions.aspectRatio === ratio.id ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={styles.ratioIcon}>{ratio.icon}</Text>
                  <Text
                    style={[
                      styles.ratioLabel,
                      {
                        color: transformOptions.aspectRatio === ratio.id ? colors.primary : colors.foreground,
                        fontWeight: transformOptions.aspectRatio === ratio.id ? "600" : "400",
                      },
                    ]}
                  >
                    {ratio.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={[styles.hint, { color: colors.muted }]}>
              Pincez pour zoomer, glissez pour repositionner
            </Text>
          </View>
        ) : (
          <View style={styles.rotateContainer}>
            {/* Rotation Buttons */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Rotation
            </Text>
            <View style={styles.rotateButtonsRow}>
              <TouchableOpacity
                onPress={handleRotateMinus90}
                style={[styles.rotateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <IconSymbol name="arrow.counterclockwise" size={24} color={colors.foreground} />
                <Text style={[styles.rotateButtonText, { color: colors.foreground }]}>-90°</Text>
              </TouchableOpacity>
              
              <View style={[styles.rotationIndicator, { backgroundColor: colors.surface }]}>
                <Text style={[styles.rotationValue, { color: colors.primary }]}>
                  {transformOptions.rotation}°
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleRotate90}
                style={[styles.rotateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <IconSymbol name="arrow.clockwise" size={24} color={colors.foreground} />
                <Text style={[styles.rotateButtonText, { color: colors.foreground }]}>+90°</Text>
              </TouchableOpacity>
            </View>

            {/* Flip Buttons */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>
              Retournement
            </Text>
            <View style={styles.flipButtonsRow}>
              <TouchableOpacity
                onPress={handleFlipHorizontal}
                style={[
                  styles.flipButton,
                  {
                    backgroundColor: transformOptions.flipHorizontal ? colors.primary + "20" : colors.surface,
                    borderColor: transformOptions.flipHorizontal ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.flipIcon}>↔️</Text>
                <Text
                  style={[
                    styles.flipButtonText,
                    { color: transformOptions.flipHorizontal ? colors.primary : colors.foreground },
                  ]}
                >
                  Horizontal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleFlipVertical}
                style={[
                  styles.flipButton,
                  {
                    backgroundColor: transformOptions.flipVertical ? colors.primary + "20" : colors.surface,
                    borderColor: transformOptions.flipVertical ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.flipIcon}>↕️</Text>
                <Text
                  style={[
                    styles.flipButtonText,
                    { color: transformOptions.flipVertical ? colors.primary : colors.foreground },
                  ]}
                >
                  Vertical
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewContainer: {
    alignItems: "center",
    paddingVertical: 16,
    position: "relative",
  },
  gestureContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  cropFrame: {
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: "absolute",
  },
  gridLineHorizontal1: {
    left: 0,
    right: 0,
    top: "33.33%",
    height: 1,
  },
  gridLineHorizontal2: {
    left: 0,
    right: 0,
    top: "66.66%",
    height: 1,
  },
  gridLineVertical1: {
    top: 0,
    bottom: 0,
    left: "33.33%",
    width: 1,
  },
  gridLineVertical2: {
    top: 0,
    bottom: 0,
    left: "66.66%",
    width: 1,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetText: {
    fontSize: 14,
    marginLeft: 6,
  },
  infoTag: {
    position: "absolute",
    top: 24,
    right: 32,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  ratioContainer: {
    flex: 1,
  },
  ratioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  ratioItem: {
    width: (SCREEN_WIDTH - 48 - 24) / 3,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  ratioIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  ratioLabel: {
    fontSize: 12,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
  rotateContainer: {
    flex: 1,
  },
  rotateButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rotateButton: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rotateButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  rotationIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rotationValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  flipButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  flipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  flipIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  flipButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default ImageCropper;
