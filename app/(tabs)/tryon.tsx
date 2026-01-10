import { ScrollView, Text, View, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from "react-native";
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

// Mapping between jewelry types and body part types
const JEWELRY_TO_BODY_PART: Record<string, string> = {
  necklace: "neck",
  earrings: "earrings",
  ring: "ring",
  bracelet: "wrist",
  brooch: "full",
  anklet: "foot",
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

export default function TryOnScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("necklace");
  const [selectedModel, setSelectedModel] = useState<BodyPart | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [jewelrySize, setJewelrySize] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Photo Editor state
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [appliedFilter, setAppliedFilter] = useState<FilterType>("original");
  const [appliedRetouch, setAppliedRetouch] = useState<RetouchOptions | null>(null);
  
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

  // Capture and open photo editor
  const handleCaptureForEdit = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    const capturedUri = await capture();
    
    if (capturedUri) {
      setCapturedImageUri(capturedUri);
      setShowPhotoEditor(true);
    }
  };

  // Save edited photo
  const handleSaveEditedPhoto = async (editedUri: string, options: RetouchOptions, filter: FilterType) => {
    setShowPhotoEditor(false);
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
      router.push("/(tabs)/gallery");
    }, 1000);
  };

  // Cancel photo editing
  const handleCancelEdit = () => {
    setShowPhotoEditor(false);
    setCapturedImageUri(null);
  };

  // Direct save without editing
  const handleDirectSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaving(true);
    
    const capturedUri = await capture();
    
    await incrementTryOnCount();
    
    if (capturedUri) {
      await saveToGallery();
    }
    
    setTimeout(() => {
      setIsSaving(false);
      router.push("/(tabs)/gallery");
    }, 1000);
  };

  const handleAddToFavorites = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await addFavorite({
      jewelryType: selectedTypeData?.name || "Bijou",
      jewelryIcon: selectedTypeData?.icon || "💍",
      modelName: selectedModel?.name || "Modèle",
    });
    setIsFavorited(true);
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const capturedUri = await capture();
    
    if (capturedUri) {
      await shareCapture();
    } else {
      setShowShareModal(true);
    }
  };

  const selectedTypeData = JEWELRY_TYPES.find(t => t.id === selectedType);

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

          {/* AR View with Real Model Image - Wrapped in ViewShot for capture */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ flex: 1, marginHorizontal: 16, marginVertical: 16 }}>
            <View className="flex-1 rounded-3xl overflow-hidden bg-surface border border-border">
              <View className="flex-1">
                {/* Model Image */}
                <Image
                  source={{ uri: selectedModel.imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  transition={300}
                />
                
                {/* Jewelry Overlay */}
                <View 
                  className="absolute items-center justify-center"
                  style={{ 
                    transform: [{ scale: jewelrySize }], 
                    top: selectedModel.type === 'earrings' ? '25%' : 
                         selectedModel.type === 'neck' ? '40%' : 
                         selectedModel.type === 'ring' ? '60%' : 
                         selectedModel.type === 'wrist' ? '50%' : 
                         selectedModel.type === 'foot' ? '70%' : '45%',
                    left: '50%',
                    marginLeft: -30,
                  }}
                >
                  <Text className="text-6xl">{selectedTypeData?.icon || "💍"}</Text>
                </View>

                {/* Info Overlay */}
                <View className="absolute bottom-4 left-4 right-4">
                  <View className="bg-background/90 rounded-xl px-4 py-3">
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-lg bg-surface items-center justify-center mr-3">
                        <Text className="text-2xl">{selectedTypeData?.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-muted">SUR :</Text>
                        <Text className="text-sm font-semibold text-foreground">
                          {selectedModel.name}
                        </Text>
                      </View>
                    </View>
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
              {/* Edit & Save Button */}
              <TouchableOpacity
                onPress={handleCaptureForEdit}
                disabled={isSaving}
                className="flex-1 py-4 px-6 rounded-full items-center flex-row justify-center"
                style={[styles.captureButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
              >
                <IconSymbol name="slider.horizontal.3" size={20} color="#0A1A3B" />
                <Text className="text-base font-bold ml-2" style={{ color: '#0A1A3B' }}>
                  Éditer & Sauvegarder
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Save Button */}
            <TouchableOpacity
              onPress={handleDirectSave}
              disabled={isSaving}
              className="py-3 px-6 rounded-full items-center border"
              style={{ borderColor: colors.border, opacity: isSaving ? 0.7 : 1 }}
            >
              <Text className="text-sm font-semibold text-muted">
                {isSaving ? "Sauvegarde..." : "Sauvegarde rapide"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Editor Modal */}
        <Modal
          visible={showPhotoEditor}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          {capturedImageUri && (
            <PhotoEditor
              imageUri={capturedImageUri}
              onSave={handleSaveEditedPhoto}
              onCancel={handleCancelEdit}
              visible={showPhotoEditor}
            />
          )}
        </Modal>

        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="Mon essayage Écrin Virtuel"
          message={`Regardez ${selectedTypeData?.name || 'ce bijou'} que j'ai essayé virtuellement avec Écrin Virtuel ! ${selectedTypeData?.icon || '💍'}✨`}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center">
            {currentStep > 1 && (
              <TouchableOpacity onPress={handleBack} className="p-2 -ml-2 mr-2">
                <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
              </TouchableOpacity>
            )}
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {currentStep === 1 ? "Choisissez la pièce" : "Choisissez votre photo"}
              </Text>
            </View>
          </View>
          <Text className="text-base text-muted mt-1">
            {currentStep === 1 
              ? "Sélectionnez un article de votre collection ou importez une photo."
              : "Sélectionnez un modèle ou importez votre photo."
            }
          </Text>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {currentStep === 1 ? (
            <>
              {/* Type Selector */}
              <View className="px-4 mt-4">
                <Text className="text-sm font-semibold text-foreground mb-3">Type</Text>
                <View 
                  className="flex-row items-center justify-between px-4 py-3 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <Text className="text-base text-foreground">
                    {selectedTypeData?.name || "Collier / Pendentif"}
                  </Text>
                  <IconSymbol name="chevron.down" size={18} color={colors.muted} />
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row px-4 mt-4 gap-3">
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/capture")}
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                  style={{ backgroundColor: colors.foreground }}
                >
                  <IconSymbol name="square.and.arrow.up" size={18} color={colors.background} />
                  <Text className="text-base font-semibold ml-2" style={{ color: colors.background }}>
                    Importer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/capture")}
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
                  style={{ borderColor: colors.border }}
                >
                  <IconSymbol name="camera.fill" size={18} color={colors.foreground} />
                  <Text className="text-base font-semibold ml-2 text-foreground">
                    Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Jewelry Types Grid */}
              <View className="px-4 mt-6">
                <Text className="text-sm font-semibold text-foreground mb-3">Catégories</Text>
                <View className="flex-row flex-wrap gap-3">
                  {JEWELRY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => handleTypeSelect(type.id)}
                      className="rounded-xl p-4 items-center"
                      style={[
                        { 
                          width: '31%',
                          backgroundColor: selectedType === type.id ? colors.primary + '20' : colors.surface,
                          borderWidth: selectedType === type.id ? 2 : 1,
                          borderColor: selectedType === type.id ? colors.primary : colors.border,
                        }
                      ]}
                    >
                      <Text className="text-3xl mb-2">{type.icon}</Text>
                      <Text 
                        className="text-xs text-center"
                        style={{ color: selectedType === type.id ? colors.primary : colors.foreground }}
                        numberOfLines={2}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <>
              {/* Models Grid */}
              <View className="px-4 mt-4">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Modèles disponibles ({filteredModels.length})
                </Text>
                
                {isLoadingBodyParts ? (
                  <View className="py-12 items-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-muted mt-4">Chargement des modèles...</Text>
                  </View>
                ) : filteredModels.length === 0 ? (
                  <View className="py-12 items-center">
                    <Text className="text-4xl mb-4">📷</Text>
                    <Text className="text-muted text-center">
                      Aucun modèle disponible pour ce type.{'\n'}
                      Importez votre propre photo !
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-3">
                    {filteredModels.map((model) => (
                      <TouchableOpacity
                        key={model.id}
                        onPress={() => handleModelSelect(model)}
                        className="rounded-xl overflow-hidden"
                        style={[
                          { 
                            width: '48%',
                            aspectRatio: 0.75,
                            borderWidth: selectedModel?.id === model.id ? 3 : 1,
                            borderColor: selectedModel?.id === model.id ? colors.primary : colors.border,
                          }
                        ]}
                      >
                        <Image
                          source={{ uri: model.imageUrl }}
                          style={StyleSheet.absoluteFillObject}
                          contentFit="cover"
                          transition={200}
                        />
                        <View className="absolute bottom-0 left-0 right-0 p-2 bg-background/80">
                          <Text className="text-xs font-medium text-foreground" numberOfLines={1}>
                            {model.name}
                          </Text>
                          {model.isDemo && (
                            <Text className="text-xs text-muted">Démo</Text>
                          )}
                        </View>
                        {selectedModel?.id === model.id && (
                          <View className="absolute top-2 right-2 w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
                            <IconSymbol name="checkmark" size={14} color="#0A1A3B" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Action Button */}
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t" style={{ borderTopColor: colors.border }}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={currentStep === 1 ? !selectedType : !selectedModel}
            className="py-4 rounded-full items-center"
            style={[
              styles.nextButton,
              { 
                backgroundColor: (currentStep === 1 ? selectedType : selectedModel) ? colors.primary : colors.surface,
                opacity: (currentStep === 1 ? selectedType : selectedModel) ? 1 : 0.5,
              }
            ]}
          >
            <Text 
              className="text-lg font-bold"
              style={{ color: (currentStep === 1 ? selectedType : selectedModel) ? '#0A1A3B' : colors.muted }}
            >
              {currentStep === 1 ? "Continuer" : "Essayer"}
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
    elevation: 4,
  },
  nextButton: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
