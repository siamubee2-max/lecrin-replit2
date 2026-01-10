import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_SIZE = SCREEN_WIDTH - 48;

/**
 * Types de filtres disponibles
 */
export type FilterType = 
  | "original"
  | "glamour"
  | "vintage"
  | "noir_blanc"
  | "dore"
  | "froid"
  | "rose"
  | "dramatique";

/**
 * Configuration d'un filtre
 */
export interface FilterConfig {
  id: FilterType;
  name: string;
  icon: string;
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia?: number;
    grayscale?: number;
    hue?: number;
  };
}

/**
 * Options de retouche
 */
export interface RetouchOptions {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  warmth: number;     // -100 to 100
  vignette: number;   // 0 to 100
}

/**
 * Props du composant PhotoEditor
 */
interface PhotoEditorProps {
  imageUri: string;
  onSave: (editedUri: string, options: RetouchOptions, filter: FilterType) => void;
  onCancel: () => void;
  visible: boolean;
}

/**
 * Filtres prédéfinis pour les photos d'essayage de bijoux
 */
const FILTERS: FilterConfig[] = [
  {
    id: "original",
    name: "Original",
    icon: "🔲",
    adjustments: { brightness: 0, contrast: 0, saturation: 0 },
  },
  {
    id: "glamour",
    name: "Glamour",
    icon: "✨",
    adjustments: { brightness: 10, contrast: 15, saturation: 20 },
  },
  {
    id: "vintage",
    name: "Vintage",
    icon: "📷",
    adjustments: { brightness: 5, contrast: -10, saturation: -20, sepia: 30 },
  },
  {
    id: "noir_blanc",
    name: "N&B",
    icon: "⬛",
    adjustments: { brightness: 5, contrast: 20, saturation: -100, grayscale: 100 },
  },
  {
    id: "dore",
    name: "Doré",
    icon: "🌟",
    adjustments: { brightness: 8, contrast: 10, saturation: 15, sepia: 15 },
  },
  {
    id: "froid",
    name: "Froid",
    icon: "❄️",
    adjustments: { brightness: 5, contrast: 5, saturation: -10, hue: -10 },
  },
  {
    id: "rose",
    name: "Rose",
    icon: "🌸",
    adjustments: { brightness: 10, contrast: 5, saturation: 10, hue: 15 },
  },
  {
    id: "dramatique",
    name: "Dramatique",
    icon: "🎭",
    adjustments: { brightness: -5, contrast: 30, saturation: 10 },
  },
];

/**
 * Valeurs par défaut des options de retouche
 */
const DEFAULT_RETOUCH: RetouchOptions = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  vignette: 0,
};

/**
 * Composant de slider personnalisé pour les ajustements
 */
interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  icon: string;
}

function AdjustmentSlider({ label, value, min, max, onChange, icon }: SliderProps) {
  const colors = useColors();
  const percentage = ((value - min) / (max - min)) * 100;

  const handlePress = (direction: "decrease" | "increase") => {
    const step = (max - min) / 20;
    const newValue = direction === "decrease" 
      ? Math.max(min, value - step)
      : Math.min(max, value + step);
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(Math.round(newValue));
  };

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderIcon}>{icon}</Text>
        <Text style={[styles.sliderLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.sliderValue, { color: colors.primary }]}>
          {value > 0 ? `+${value}` : value}
        </Text>
      </View>
      <View style={styles.sliderTrackContainer}>
        <TouchableOpacity
          onPress={() => handlePress("decrease")}
          style={[styles.sliderButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <IconSymbol name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>
        <View style={[styles.sliderTrack, { backgroundColor: colors.surface }]}>
          <View 
            style={[
              styles.sliderFill, 
              { 
                backgroundColor: colors.primary,
                width: `${percentage}%`,
              }
            ]} 
          />
          <View 
            style={[
              styles.sliderThumb, 
              { 
                backgroundColor: colors.primary,
                left: `${percentage}%`,
                marginLeft: -8,
              }
            ]} 
          />
        </View>
        <TouchableOpacity
          onPress={() => handlePress("increase")}
          style={[styles.sliderButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <IconSymbol name="plus" size={16} color={colors.foreground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Composant principal d'édition photo
 */
export function PhotoEditor({ imageUri, onSave, onCancel, visible }: PhotoEditorProps) {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"filters" | "retouch">("filters");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("original");
  const [retouchOptions, setRetouchOptions] = useState<RetouchOptions>(DEFAULT_RETOUCH);
  const [showComparison, setShowComparison] = useState(false);

  // Animation pour la comparaison avant/après
  const comparisonProgress = useSharedValue(0);

  const handleFilterSelect = useCallback((filterId: FilterType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedFilter(filterId);
    
    // Appliquer les ajustements du filtre aux options de retouche
    const filter = FILTERS.find(f => f.id === filterId);
    if (filter && filterId !== "original") {
      setRetouchOptions({
        brightness: filter.adjustments.brightness,
        contrast: filter.adjustments.contrast,
        saturation: filter.adjustments.saturation,
        warmth: 0,
        vignette: 0,
      });
    } else {
      setRetouchOptions(DEFAULT_RETOUCH);
    }
  }, []);

  const handleRetouchChange = useCallback((key: keyof RetouchOptions, value: number) => {
    setRetouchOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setSelectedFilter("original");
    setRetouchOptions(DEFAULT_RETOUCH);
  }, []);

  const handleSave = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave(imageUri, retouchOptions, selectedFilter);
  }, [imageUri, retouchOptions, selectedFilter, onSave]);

  const toggleComparison = useCallback(() => {
    setShowComparison(prev => !prev);
    comparisonProgress.value = withTiming(showComparison ? 0 : 1, { duration: 300 });
  }, [showComparison, comparisonProgress]);

  // Calculer le style CSS pour les filtres (web only)
  const webFilterStyle = useMemo(() => {
    const { brightness, contrast, saturation } = retouchOptions;
    const filter = FILTERS.find(f => f.id === selectedFilter);
    
    // Convertir les valeurs en pourcentages CSS
    const brightnessValue = 100 + brightness;
    const contrastValue = 100 + contrast;
    const saturationValue = 100 + saturation;
    const sepiaValue = filter?.adjustments.sepia || 0;
    const grayscaleValue = filter?.adjustments.grayscale || 0;
    
    return `brightness(${brightnessValue}%) contrast(${contrastValue}%) saturate(${saturationValue}%) sepia(${sepiaValue}%) grayscale(${grayscaleValue}%)`;
  }, [retouchOptions, selectedFilter]);

  // Style animé pour la vignette
  const vignetteStyle = useAnimatedStyle(() => {
    const opacity = interpolate(retouchOptions.vignette, [0, 100], [0, 0.6]);
    return {
      opacity,
    };
  }, [retouchOptions.vignette]);

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.muted }]}>Annuler</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Éditer</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.primary }]}>Appliquer</Text>
        </TouchableOpacity>
      </View>

      {/* Preview Image */}
      <View style={styles.previewContainer}>
        <View style={[styles.previewWrapper, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.previewImage,
              Platform.OS === "web" && { filter: webFilterStyle } as any,
            ]}
          >
            <Image
              source={{ uri: imageUri }}
              style={StyleSheet.absoluteFillObject}
              contentFit="contain"
            />
          </View>
          
          {/* Vignette Overlay */}
          {retouchOptions.vignette > 0 && (
            <Animated.View 
              style={[styles.vignetteOverlay, vignetteStyle]}
              pointerEvents="none"
            />
          )}

          {/* Comparison Toggle */}
          <TouchableOpacity
            onPress={toggleComparison}
            style={[styles.comparisonButton, { backgroundColor: colors.background + "CC" }]}
          >
            <Text style={[styles.comparisonText, { color: colors.foreground }]}>
              {showComparison ? "Modifié" : "Original"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reset Button */}
        <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
          <IconSymbol name="arrow.counterclockwise" size={16} color={colors.muted} />
          <Text style={[styles.resetText, { color: colors.muted }]}>Réinitialiser</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("filters")}
          style={[
            styles.tab,
            activeTab === "filters" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "filters" ? "#0A1A3B" : colors.muted },
            ]}
          >
            Filtres
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("retouch")}
          style={[
            styles.tab,
            activeTab === "retouch" && { backgroundColor: colors.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "retouch" ? "#0A1A3B" : colors.muted },
            ]}
          >
            Retouche
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === "filters" ? (
          <View style={styles.filtersGrid}>
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                onPress={() => handleFilterSelect(filter.id)}
                style={[
                  styles.filterItem,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: selectedFilter === filter.id ? colors.primary : colors.border,
                    borderWidth: selectedFilter === filter.id ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.filterPreview}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.filterThumbnail}
                    contentFit="cover"
                  />
                  <Text style={styles.filterIcon}>{filter.icon}</Text>
                </View>
                <Text 
                  style={[
                    styles.filterName, 
                    { 
                      color: selectedFilter === filter.id ? colors.primary : colors.foreground,
                      fontWeight: selectedFilter === filter.id ? "600" : "400",
                    }
                  ]}
                >
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.retouchContainer}>
            <AdjustmentSlider
              label="Luminosité"
              value={retouchOptions.brightness}
              min={-100}
              max={100}
              onChange={(v) => handleRetouchChange("brightness", v)}
              icon="☀️"
            />
            <AdjustmentSlider
              label="Contraste"
              value={retouchOptions.contrast}
              min={-100}
              max={100}
              onChange={(v) => handleRetouchChange("contrast", v)}
              icon="◐"
            />
            <AdjustmentSlider
              label="Saturation"
              value={retouchOptions.saturation}
              min={-100}
              max={100}
              onChange={(v) => handleRetouchChange("saturation", v)}
              icon="🎨"
            />
            <AdjustmentSlider
              label="Chaleur"
              value={retouchOptions.warmth}
              min={-100}
              max={100}
              onChange={(v) => handleRetouchChange("warmth", v)}
              icon="🔥"
            />
            <AdjustmentSlider
              label="Vignette"
              value={retouchOptions.vignette}
              min={0}
              max={100}
              onChange={(v) => handleRetouchChange("vignette", v)}
              icon="⭕"
            />
          </View>
        )}
      </ScrollView>
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
  },
  previewWrapper: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 100,
  },
  comparisonButton: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: "500",
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
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  filtersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  filterItem: {
    width: (SCREEN_WIDTH - 48 - 12) / 4,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  filterPreview: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  filterThumbnail: {
    width: "100%",
    height: "100%",
  },
  filterIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    fontSize: 16,
  },
  filterName: {
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 6,
  },
  retouchContainer: {
    gap: 20,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sliderLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 40,
    textAlign: "right",
  },
  sliderTrackContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    position: "relative",
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});

export default PhotoEditor;
