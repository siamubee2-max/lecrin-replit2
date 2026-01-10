import { Text, View, TouchableOpacity, ScrollView, FlatList, Dimensions, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import ViewShot from "react-native-view-shot";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ShareModal } from "@/components/share-modal";
import { useFavorites } from "@/lib/favorites-context";
import { useScreenshot } from "@/hooks/use-screenshot";
import { trpc } from "@/lib/trpc";
import { PhotoEditor, type FilterType, type RetouchOptions } from "@/components/photo-editor";
import { ImageCropper, type TransformOptions } from "@/components/image-cropper";
import { AIPositionedJewelry } from "@/components/ai-positioned-jewelry";
import { type JewelryType as AIJewelryType, type JewelryPosition } from "@/hooks/use-ai-positioning";

// Jewelry styles (metal types)
type JewelryStyle = "gold" | "silver" | "rosegold";

const JEWELRY_STYLES: { id: JewelryStyle; name: string; color: string }[] = [
  { id: "gold", name: "Or", color: "#FFD700" },
  { id: "silver", name: "Argent", color: "#C0C0C0" },
  { id: "rosegold", name: "Or Rose", color: "#E8B4B8" },
];

// Import jewelry images by style
const JEWELRY_IMAGES_BY_STYLE: Record<JewelryStyle, Record<string, any>> = {
  gold: {
    necklace: require("@/assets/images/jewelry/gold/necklace.png"),
    earrings: require("@/assets/images/jewelry/gold/earrings.png"),
    ring: require("@/assets/images/jewelry/gold/ring.png"),
    bracelet: require("@/assets/images/jewelry/gold/bracelet.png"),
    anklet: require("@/assets/images/jewelry/gold/anklet.png"),
    brooch: require("@/assets/images/jewelry/gold/necklace.png"), // Use necklace for full set
  },
  silver: {
    necklace: require("@/assets/images/jewelry/silver/necklace.png"),
    earrings: require("@/assets/images/jewelry/silver/earrings.png"),
    ring: require("@/assets/images/jewelry/silver/ring.png"),
    bracelet: require("@/assets/images/jewelry/silver/bracelet.png"),
    anklet: require("@/assets/images/jewelry/silver/anklet.png"),
    brooch: require("@/assets/images/jewelry/silver/necklace.png"),
  },
  rosegold: {
    necklace: require("@/assets/images/jewelry/rosegold/necklace.png"),
    earrings: require("@/assets/images/jewelry/rosegold/earrings.png"),
    ring: require("@/assets/images/jewelry/rosegold/ring.png"),
    bracelet: require("@/assets/images/jewelry/rosegold/bracelet.png"),
    anklet: require("@/assets/images/jewelry/rosegold/anklet.png"),
    brooch: require("@/assets/images/jewelry/rosegold/necklace.png"),
  },
};

// Legacy import for fallback
const JEWELRY_IMAGES = {
  necklace: require("@/assets/images/jewelry/necklace.png"),
  earrings: require("@/assets/images/jewelry/earrings.png"),
  ring: require("@/assets/images/jewelry/ring.png"),
  bracelet: require("@/assets/images/jewelry/bracelet.png"),
  anklet: require("@/assets/images/jewelry/anklet.png"),
  brooch: require("@/assets/images/jewelry/necklace.png"),
};

// Mapping between jewelry types and body part types
const JEWELRY_TO_BODY_PART: Record<string, string> = {
  necklace: "neck",
  earrings: "earrings",
  ring: "ring",
  bracelet: "wrist",
  brooch: "full",
  anklet: "foot",
};

// Jewelry positioning configuration for each type (percentages as decimals)
const JEWELRY_POSITIONS: Record<string, { topPercent: number; size: number; offsetX: number }> = {
  necklace: { topPercent: 0.35, size: 180, offsetX: 0 },
  earrings: { topPercent: 0.20, size: 120, offsetX: 0 },
  ring: { topPercent: 0.55, size: 80, offsetX: 0 },
  bracelet: { topPercent: 0.45, size: 140, offsetX: 0 },
  anklet: { topPercent: 0.65, size: 120, offsetX: 0 },
  brooch: { topPercent: 0.40, size: 200, offsetX: 0 },
};

const JEWELRY_TYPES = [
  { id: "necklace", name: "Collier / Pendentif", icon: "📿", bodyType: "neck" },
  { id: "earrings", name: "Boucles d'oreilles", icon: "💎", bodyType: "earrings" },
  { id: "ring", name: "Bague", icon: "💍", bodyType: "ring" },
  { id: "bracelet", name: "Bracelet", icon: "⌚", bodyType: "wrist" },
  { id: "anklet", name: "Chevillière", icon: "🦶", bodyType: "foot" },
  { id: "brooch", name: "Parure complète", icon: "✨", bodyType: "full" },
];

interface BodyPart {
  id: number;
  externalId: string | null;
  name: string;
  type: "face" | "neck" | "bust_with_hands" | "left_ear_profile" | "right_ear_profile" | "left_wrist" | "right_wrist" | "left_hand" | "right_hand" | "left_ankle" | "right_ankle" | "full_body" | "earrings" | "ring" | "wrist" | "foot" | "full";
  imageUrl: string;
  userId: number | null;
  isDemo: boolean | null;
  createdAt: Date;
}

// Edit flow steps
type EditStep = "none" | "crop" | "filter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function TryOnScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("necklace");
  const [selectedStyle, setSelectedStyle] = useState<JewelryStyle>("gold");
  const [selectedModel, setSelectedModel] = useState<BodyPart | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [jewelrySize, setJewelrySize] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [useAIPositioning, setUseAIPositioning] = useState(true);
  const [aiPosition, setAiPosition] = useState<JewelryPosition | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  
  // Photo Editor state
  const [editStep, setEditStep] = useState<EditStep>("none");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);
  const [appliedFilter, setAppliedFilter] = useState<FilterType>("original");
  const [appliedRetouch, setAppliedRetouch] = useState<RetouchOptions | null>(null);
  const [appliedTransform, setAppliedTransform] = useState<TransformOptions | null>(null);
  
  const { addFavorite, incrementTryOnCount } = useFavorites();
  const { viewShotRef, isCapturing, capture, shareCapture, saveToGallery, lastCaptureUri } = useScreenshot({ format: 'png', quality: 1 });

  // Fetch body parts from API
  const { data: allBodyParts, isLoading: isLoadingBodyParts } = trpc.bodyParts.list.useQuery();

  // Filter body parts by selected jewelry type
  const filteredModels = allBodyParts?.filter(
    (part) => part.type === JEWELRY_TO_BODY_PART[selectedType]
  ) || [];

  const handleTypeSelect = (typeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedType(typeId);
    setSelectedModel(null); // Reset model when type changes
  };

  const handleStyleSelect = (styleId: JewelryStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedStyle(styleId);
  };

  const handleModelSelect = (model: BodyPart) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedModel(model);
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (currentStep === 1 && selectedType) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedModel) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSizeChange = (delta: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setJewelrySize(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Capture and start edit flow (crop first, then filter)
  const handleCaptureForEdit = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const capturedUri = await capture();
    
    if (capturedUri) {
      setCapturedImageUri(capturedUri);
      setCroppedImageUri(null);
      setEditStep("crop"); // Start with cropping
    }
  };

  // After cropping, move to filter step
  const handleCropApply = (transformedUri: string, options: TransformOptions) => {
    setCroppedImageUri(transformedUri);
    setAppliedTransform(options);
    setEditStep("filter"); // Move to filter step
  };

  // Cancel cropping
  const handleCropCancel = () => {
    setEditStep("none");
    setCapturedImageUri(null);
    setCroppedImageUri(null);
  };

  // Save edited photo (after filtering)
  const handleSaveEditedPhoto = async (editedUri: string, options: RetouchOptions, filter: FilterType) => {
    setEditStep("none");
    setIsSaving(true);
    setAppliedFilter(filter);
    setAppliedRetouch(options);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    await incrementTryOnCount();
    
    // Sauvegarder dans la galerie
    await saveToGallery();
    
    setTimeout(() => {
      setIsSaving(false);
      setCapturedImageUri(null);
      setCroppedImageUri(null);
      router.push("/(tabs)/gallery");
    }, 1000);
  };

  // Cancel photo editing (from filter step)
  const handleFilterCancel = () => {
    // Go back to crop step
    setEditStep("crop");
    setCroppedImageUri(null);
  };

  // Quick save without editing
  const handleQuickSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsSaving(true);
    
    const capturedUri = await capture();
    
    if (capturedUri) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      await incrementTryOnCount();
      await saveToGallery();
      
      setTimeout(() => {
        setIsSaving(false);
        router.push("/(tabs)/gallery");
      }, 1000);
    } else {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleAddToFavorites = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    const selectedJewelry = JEWELRY_TYPES.find(j => j.id === selectedType);
    const selectedStyleInfo = JEWELRY_STYLES.find(s => s.id === selectedStyle);
    
    await addFavorite({
      jewelryType: `${selectedJewelry?.name || 'Bijou'} - ${selectedStyleInfo?.name || 'Or'}`,
      jewelryIcon: selectedJewelry?.icon || '💍',
      modelName: selectedModel?.name || 'Modèle',
      imageUri: selectedModel?.imageUrl || '',
    });
    
    setIsFavorited(true);
    setTimeout(() => setIsFavorited(false), 2000);
  };

  // Get jewelry image based on selected style
  const getJewelryImage = () => {
    try {
      return JEWELRY_IMAGES_BY_STYLE[selectedStyle][selectedType];
    } catch {
      // Fallback to legacy images
      return JEWELRY_IMAGES[selectedType as keyof typeof JEWELRY_IMAGES];
    }
  };

  const jewelryPosition = JEWELRY_POSITIONS[selectedType] || JEWELRY_POSITIONS.necklace;
  const jewelryImage = getJewelryImage();

  // Show Image Cropper
  if (editStep === "crop" && capturedImageUri) {
    return (
      <ImageCropper
        imageUri={capturedImageUri}
        onApply={handleCropApply}
        onCancel={handleCropCancel}
        visible={true}
      />
    );
  }

  // Show Photo Editor (after cropping)
  if (editStep === "filter" && (croppedImageUri || capturedImageUri)) {
    return (
      <PhotoEditor
        imageUri={croppedImageUri || capturedImageUri!}
        onSave={handleSaveEditedPhoto}
        onCancel={handleFilterCancel}
        visible={true}
      />
    );
  }

  // Step 3: AR Try-on View
  if (currentStep === 3 && selectedModel) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-2">
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center active:opacity-70"
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            
            <Text className="text-lg font-semibold text-foreground">
              Essayage Virtuel
            </Text>
            
            <View className="flex-row">
              <TouchableOpacity
                onPress={handleAddToFavorites}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70 mr-2"
                style={{ backgroundColor: isFavorited ? '#EF4444' : colors.surface }}
              >
                <IconSymbol 
                  name={isFavorited ? "heart.fill" : "heart"} 
                  size={20} 
                  color={isFavorited ? "#FFFFFF" : colors.foreground} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleShare}
                className="w-10 h-10 rounded-full bg-surface items-center justify-center active:opacity-70"
              >
                <IconSymbol name="square.and.arrow.up" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Style Selector - Horizontal Pills */}
          <View className="px-4 py-2">
            <View className="flex-row justify-center gap-2">
              {JEWELRY_STYLES.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  onPress={() => handleStyleSelect(style.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full border ${
                    selectedStyle === style.id ? 'border-primary' : 'border-border'
                  }`}
                  style={selectedStyle === style.id ? { backgroundColor: colors.primary + '20' } : { backgroundColor: colors.surface }}
                >
                  <View 
                    className="w-4 h-4 rounded-full mr-2 border border-border"
                    style={{ backgroundColor: style.color }}
                  />
                  <Text 
                    className={`text-sm font-medium ${selectedStyle === style.id ? 'text-primary' : 'text-foreground'}`}
                  >
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AR View with Real Model Image - Wrapped in ViewShot for capture */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ flex: 1, marginHorizontal: 16, marginVertical: 8 }}>
            <View className="flex-1 rounded-3xl overflow-hidden bg-surface border border-border">
              {useAIPositioning ? (
                /* AI-Powered Positioning */
                <AIPositionedJewelry
                  modelImageUrl={selectedModel.imageUrl}
                  jewelryImage={jewelryImage}
                  jewelryType={selectedType as AIJewelryType}
                  manualSize={jewelrySize}
                  onAnalysisComplete={(success, position) => {
                    setIsAIAnalyzing(false);
                    setAiPosition(position);
                  }}
                  showDebugOverlay={false}
                />
              ) : (
                /* Manual/Static Positioning (Fallback) */
                <View className="flex-1">
                  {/* Model Image */}
                  <Image
                    source={{ uri: selectedModel.imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={300}
                  />
                  
                  {/* Jewelry Overlay - Static positioning */}
                  <View 
                    className="absolute items-center justify-center"
                    style={{ 
                      top: `${jewelryPosition.topPercent * 100}%` as any,
                      left: '50%' as any,
                      transform: [
                        { translateX: -jewelryPosition.size * jewelrySize / 2 + jewelryPosition.offsetX },
                        { scale: jewelrySize },
                      ],
                    }}
                  >
                    <Image
                      source={jewelryImage}
                      style={{
                        width: jewelryPosition.size,
                        height: jewelryPosition.size,
                      }}
                      contentFit="contain"
                      transition={200}
                    />
                  </View>
                </View>
              )}

              {/* Info Overlay */}
              <View className="absolute bottom-4 left-4 right-4">
                <View className="bg-background/90 rounded-xl px-4 py-3">
                  <View className="flex-row items-center">
                    <View className="w-14 h-14 rounded-lg bg-surface items-center justify-center mr-3 overflow-hidden">
                      <Image
                        source={jewelryImage}
                        style={{ width: 40, height: 40 }}
                        contentFit="contain"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">
                        {JEWELRY_STYLES.find(s => s.id === selectedStyle)?.name.toUpperCase()} SUR :
                      </Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {selectedModel.name}
                      </Text>
                    </View>
                    {/* AI Toggle */}
                    <TouchableOpacity
                      onPress={() => setUseAIPositioning(!useAIPositioning)}
                      className={`px-3 py-1.5 rounded-full ${useAIPositioning ? 'bg-primary' : 'bg-surface border border-border'}`}
                    >
                      <Text className={`text-xs font-medium ${useAIPositioning ? 'text-background' : 'text-muted'}`}>
                        {useAIPositioning ? 'IA ✓' : 'IA'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ViewShot>

          {/* Controls */}
          <View className="px-6 pb-6">
            {/* Size Controls */}
            <View className="flex-row items-center justify-center mb-4">
              <TouchableOpacity
                onPress={() => handleSizeChange(-0.1)}
                className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
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
                className="w-12 h-12 rounded-full bg-surface border border-border items-center justify-center"
              >
                <IconSymbol name="plus" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                onPress={handleCaptureForEdit}
                disabled={isCapturing || isSaving}
                className="flex-1 bg-primary py-4 rounded-xl items-center active:opacity-80"
              >
                {isCapturing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-background font-semibold">
                    Éditer & Sauvegarder
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleQuickSave}
                disabled={isCapturing || isSaving}
                className="flex-1 bg-surface border border-border py-4 rounded-xl items-center active:opacity-80"
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.foreground} />
                ) : (
                  <Text className="text-foreground font-semibold">
                    Sauvegarde rapide
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Share Modal */}
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUri={lastCaptureUri || undefined}
          title={`${JEWELRY_TYPES.find(j => j.id === selectedType)?.name || "Bijou"} - ${JEWELRY_STYLES.find(s => s.id === selectedStyle)?.name || "Or"}`}
          message={`Découvrez mon essayage virtuel de ${JEWELRY_TYPES.find(j => j.id === selectedType)?.name || "bijou"} en ${JEWELRY_STYLES.find(s => s.id === selectedStyle)?.name || "or"} avec L'Écrin Virtuel ! 💍✨`}
        />
      </ScreenContainer>
    );
  }

  // Step 2: Select Model
  if (currentStep === 2) {
    return (
      <ScreenContainer edges={["top", "left", "right"]} className="p-6">
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={handleBack}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center mr-4 active:opacity-70"
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                Choisir un Modèle
              </Text>
              <Text className="text-sm text-muted">
                {JEWELRY_TYPES.find(j => j.id === selectedType)?.name}
              </Text>
            </View>
          </View>

          {/* Style Selector */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-muted mb-2">Style du bijou</Text>
            <View className="flex-row gap-2">
              {JEWELRY_STYLES.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  onPress={() => handleStyleSelect(style.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full border ${
                    selectedStyle === style.id ? 'border-primary' : 'border-border'
                  }`}
                  style={selectedStyle === style.id ? { backgroundColor: colors.primary + '20' } : { backgroundColor: colors.surface }}
                >
                  <View 
                    className="w-4 h-4 rounded-full mr-2 border border-border"
                    style={{ backgroundColor: style.color }}
                  />
                  <Text 
                    className={`text-sm font-medium ${selectedStyle === style.id ? 'text-primary' : 'text-foreground'}`}
                  >
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Models Grid */}
          {isLoadingBodyParts ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">Chargement des modèles...</Text>
            </View>
          ) : filteredModels.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-6xl mb-4">📷</Text>
              <Text className="text-lg font-semibold text-foreground text-center mb-2">
                Aucun modèle disponible
              </Text>
              <Text className="text-sm text-muted text-center">
                Ajoutez des photos dans l'onglet Galerie pour commencer
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredModels}
              numColumns={2}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 100 }}
              columnWrapperStyle={{ gap: 12 }}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleModelSelect(item)}
                  className={`flex-1 rounded-2xl overflow-hidden border-2 ${
                    selectedModel?.id === item.id ? "border-primary" : "border-transparent"
                  }`}
                  style={{ aspectRatio: 3/4 }}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    transition={200}
                  />
                  <View className="absolute bottom-0 left-0 right-0 bg-background/80 px-3 py-2">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isDemo && (
                      <Text className="text-xs text-muted">Démo</Text>
                    )}
                  </View>
                  {selectedModel?.id === item.id && (
                    <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary items-center justify-center">
                      <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}

          {/* Next Button */}
          <View className="absolute bottom-6 left-0 right-0 px-6">
            <TouchableOpacity
              onPress={handleNext}
              disabled={!selectedModel}
              className={`py-4 rounded-xl items-center ${
                selectedModel ? "bg-primary" : "bg-surface"
              }`}
            >
              <Text className={`font-semibold ${selectedModel ? "text-background" : "text-muted"}`}>
                Essayer ce bijou
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Step 1: Select Jewelry Type
  return (
    <ScreenContainer edges={["top", "left", "right"]} className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Essayage Virtuel
          </Text>
          <Text className="text-base text-muted">
            Sélectionnez le type de bijou à essayer
          </Text>
        </View>

        {/* Jewelry Types Grid */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="flex-row flex-wrap gap-4">
            {JEWELRY_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => handleTypeSelect(type.id)}
                className={`w-[47%] rounded-2xl p-4 border-2 ${
                  selectedType === type.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-surface"
                }`}
              >
                <Text className="text-4xl mb-3">{type.icon}</Text>
                <Text className="text-base font-semibold text-foreground">
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Style Preview */}
          {selectedType && (
            <View className="mt-6">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Aperçu des styles
              </Text>
              <View className="flex-row gap-3">
                {JEWELRY_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    onPress={() => handleStyleSelect(style.id)}
                    className={`flex-1 rounded-xl p-3 border-2 items-center ${
                      selectedStyle === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <View className="w-16 h-16 rounded-lg bg-background items-center justify-center mb-2 overflow-hidden">
                      <Image
                        source={JEWELRY_IMAGES_BY_STYLE[style.id][selectedType]}
                        style={{ width: 48, height: 48 }}
                        contentFit="contain"
                      />
                    </View>
                    <View 
                      className="w-6 h-6 rounded-full border border-border mb-1"
                      style={{ backgroundColor: style.color }}
                    />
                    <Text className={`text-sm font-medium ${selectedStyle === style.id ? 'text-primary' : 'text-foreground'}`}>
                      {style.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Next Button */}
        <View className="absolute bottom-6 left-0 right-0 px-6">
          <TouchableOpacity
            onPress={handleNext}
            disabled={!selectedType}
            className={`py-4 rounded-xl items-center ${
              selectedType ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text className={`font-semibold ${selectedType ? "text-background" : "text-muted"}`}>
              Continuer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
