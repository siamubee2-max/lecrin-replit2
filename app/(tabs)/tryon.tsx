import { Text, View, TouchableOpacity, ScrollView, FlatList, Dimensions, StyleSheet, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import ViewShot from "react-native-view-shot";
import { useRouter, useLocalSearchParams } from "expo-router";
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
import { WatermarkFull } from "@/components/watermark";

// Jewelry styles (metal types)
type JewelryStyle = "gold" | "silver" | "rosegold";

const JEWELRY_STYLES: { id: JewelryStyle; name: string; color: string }[] = [
  { id: "gold", name: "Or", color: "#FFD700" },
  { id: "silver", name: "Argent", color: "#C0C0C0" },
  { id: "rosegold", name: "Or Rose", color: "#E8B4B8" },
];

// CDN base URL for jewelry images
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK";

// Import jewelry images by style (using CDN URLs)
const JEWELRY_IMAGES_BY_STYLE: Record<JewelryStyle, Record<string, any>> = {
  gold: {
    necklace: { uri: `${CDN}/necklace_7177dd4f.png` },
    earrings: { uri: `${CDN}/earrings_d519be16.png` },
    ring: { uri: `${CDN}/ring_98bc5b36.png` },
    bracelet: { uri: `${CDN}/bracelet_a20f8e1b.png` },
    anklet: { uri: `${CDN}/anklet_898db7b9.png` },
    brooch: { uri: `${CDN}/necklace_7177dd4f.png` }, // Use necklace for full set
  },
  silver: {
    necklace: { uri: `${CDN}/necklace_272e5538.png` },
    earrings: { uri: `${CDN}/earrings_5f6e88c0.png` },
    ring: { uri: `${CDN}/ring_98d1f1c4.png` },
    bracelet: { uri: `${CDN}/bracelet_2e01c216.png` },
    anklet: { uri: `${CDN}/anklet_49ad301c.png` },
    brooch: { uri: `${CDN}/necklace_272e5538.png` },
  },
  rosegold: {
    necklace: { uri: `${CDN}/necklace_17a308e7.png` },
    earrings: { uri: `${CDN}/earrings_d76acdc3.png` },
    ring: { uri: `${CDN}/ring_c4986919.png` },
    bracelet: { uri: `${CDN}/bracelet_8332e426.png` },
    anklet: { uri: `${CDN}/anklet_ce49b8e0.png` },
    brooch: { uri: `${CDN}/necklace_17a308e7.png` },
  },
};

// Legacy import for fallback (CDN URLs)
const JEWELRY_IMAGES = {
  necklace: { uri: `${CDN}/necklace_bd6660e2.png` },
  earrings: { uri: `${CDN}/earrings_ca44164c.png` },
  ring: { uri: `${CDN}/ring_1387f5ad.png` },
  bracelet: { uri: `${CDN}/bracelet_9eb16d6e.png` },
  anklet: { uri: `${CDN}/anklet_a3ab66ce.png` },
  brooch: { uri: `${CDN}/necklace_bd6660e2.png` },
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
  const params = useLocalSearchParams<{ demoJewelryId?: string; demoJewelryName?: string; demoJewelryType?: string }>();
  
  // Check if we're in demo mode (coming from Mon Écrin with a demo jewelry)
  const isDemoMode = !!params.demoJewelryId;
  const demoJewelryName = params.demoJewelryName || "";
  
  // Map demo jewelry type to internal type
  const mapDemoTypeToInternal = (demoType?: string): string => {
    const mapping: Record<string, string> = {
      "Necklace": "necklace",
      "Earrings": "earrings",
      "Ring": "ring",
      "Bracelet": "bracelet",
      "Brooch": "brooch",
    };
    return mapping[demoType || ""] || "necklace";
  };
  
  const [selectedType, setSelectedType] = useState<string>(mapDemoTypeToInternal(params.demoJewelryType));
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

  // Demo images using AI-generated body part photos (no jewelry, suitable for virtual try-on)
  const LOCAL_DEMO_IMAGES: Record<string, any> = {
    "earrings": [
      { id: "demo_ear_1", name: "Oreille 1", type: "earrings", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_ear_female_light-oKyQzhjaEeMaTVQE2RSjzv.png" }, isDemo: true },
      { id: "demo_ear_2", name: "Oreille 2", type: "earrings", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_ear_female_dark-b3hHnGt8vPVuRfUentdNM5.png" }, isDemo: true },
    ],
    "neck": [
      { id: "demo_neck_1", name: "Cou 1", type: "neck", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_neck_female_light-fi7h3coGBhB7QXE5m8Ubdd.png" }, isDemo: true },
      { id: "demo_neck_2", name: "Cou 2", type: "neck", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_neck_female_medium-V6NKontzEYLKqDzsbp5b6i.png" }, isDemo: true },
      { id: "demo_neck_3", name: "Cou 3", type: "neck", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_neck_female_dark-dUGtrfRqepNU8BoNZR8LSB.png" }, isDemo: true },
      { id: "demo_neck_4", name: "Cou Homme", type: "neck", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_neck_male_light-4JdnQugvs9BoU6rsnXh4Yi.png" }, isDemo: true },
    ],
    "ring": [
      { id: "demo_ring_1", name: "Main 1", type: "ring", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_hand_female_light-2PbB4bSWex8tzUnZHJD9te.png" }, isDemo: true },
      { id: "demo_ring_2", name: "Main Homme", type: "ring", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_hand_male_light-huy4w46aFJPQan5jbwUG5M.png" }, isDemo: true },
    ],
    "wrist": [
      { id: "demo_wrist_1", name: "Poignet 1", type: "wrist", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_wrist_female_light-PwZU2jSds6D2sgBQSMaqYG.png" }, isDemo: true },
    ],
    "foot": [
      { id: "demo_foot_1", name: "Cheville 1", type: "foot", imageUrl: { uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/body_ankle_female_light-YZJjUmhcgVcmwqT7UqoGWz.png" }, isDemo: true },
    ],
  };

  // Filter body parts by selected jewelry type
  // Use local demo images as fallback
  const bodyPartType = JEWELRY_TO_BODY_PART[selectedType];
  const apiModels = allBodyParts?.filter((part) => part.type === bodyPartType) || [];
  const filteredModels = apiModels.length > 0 ? apiModels : (LOCAL_DEMO_IMAGES[bodyPartType] || []);

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

  // Capture l'image et ouvre le modal de partage
  const handleShareWithCapture = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Capturer l'image d'abord
    const capturedUri = await capture();
    
    if (capturedUri) {
      // Ouvrir le modal de partage avec l'image capturée
      setShowShareModal(true);
    }
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
                    source={
                      typeof selectedModel.imageUrl === 'number' 
                        ? selectedModel.imageUrl 
                        : (typeof selectedModel.imageUrl === 'object' && 'uri' in selectedModel.imageUrl)
                          ? selectedModel.imageUrl
                          : { uri: selectedModel.imageUrl }
                    }
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

              {/* Watermark */}
              <WatermarkFull position="top-right" opacity={0.6} theme="light" />

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

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShareWithCapture}
              disabled={isCapturing || isSaving}
              className="flex-row items-center justify-center bg-surface border border-primary py-4 rounded-xl active:opacity-80"
            >
              <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
              <Text className="text-primary font-semibold ml-2">
                Partager sur les réseaux sociaux
              </Text>
            </TouchableOpacity>
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
                Ajoutez des photos dans l{"'"}onglet Galerie pour commencer
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
              renderItem={({ item }) => {
                // Support both local require() images and remote URLs
                // If imageUrl is already an object {uri: ...}, use it directly
                // If it's a number (require()), use it directly
                // If it's a string, wrap it in {uri: ...}
                const imageSource = typeof item.imageUrl === 'number' 
                  ? item.imageUrl 
                  : (typeof item.imageUrl === 'object' && item.imageUrl !== null && 'uri' in item.imageUrl)
                    ? item.imageUrl
                    : { uri: item.imageUrl };
                return (
                <TouchableOpacity
                  onPress={() => handleModelSelect(item)}
                  className={`flex-1 rounded-2xl overflow-hidden border-2 ${
                    selectedModel?.id === item.id ? "border-primary" : "border-transparent"
                  }`}
                  style={{ aspectRatio: 3/4 }}
                >
                  <Image
                    source={imageSource}
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
              );
              }}
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
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <View 
            className="mb-4 p-3 rounded-xl flex-row items-center"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <IconSymbol name="sparkles" size={20} color={colors.primary} />
            <View className="ml-3 flex-1">
              <Text className="font-semibold" style={{ color: colors.primary }}>Mode Démonstration</Text>
              <Text className="text-sm text-muted">Essayez {'"'}{demoJewelryName}{'"'} sur une photo</Text>
            </View>
          </View>
        )}
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Essayage Virtuel
          </Text>
          <Text className="text-base text-muted">
            {isDemoMode ? "Choisissez un modèle ou prenez une photo" : "Sélectionnez le type de bijou à essayer"}
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
