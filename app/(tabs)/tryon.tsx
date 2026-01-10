import { ScrollView, Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ShareModal } from "@/components/share-modal";

const JEWELRY_TYPES = [
  { id: "necklace", name: "Collier / Pendentif", icon: "📿" },
  { id: "earrings", name: "Boucles d'oreilles", icon: "💎" },
  { id: "ring", name: "Bague", icon: "💍" },
  { id: "bracelet", name: "Bracelet", icon: "⌚" },
  { id: "brooch", name: "Broche", icon: "🎀" },
];

// Demo models for virtual try-on
const DEMO_MODELS = [
  { id: "1", name: "Sophie", description: "Classique", available: true },
  { id: "2", name: "Emma", description: "Moderne", available: true },
  { id: "3", name: "Marie", description: "Élégante", available: true },
  { id: "4", name: "Léa", description: "Naturelle", available: false },
];

export default function TryOnScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("necklace");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [jewelrySize, setJewelrySize] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedType(typeId);
  };

  const handleModelSelect = (modelId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedModel(modelId);
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

  const handleCapture = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      router.push("/gallery");
    }, 1500);
  };

  const handleShare = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowShareModal(true);
  };

  const selectedTypeData = JEWELRY_TYPES.find(t => t.id === selectedType);
  const selectedModelData = DEMO_MODELS.find(m => m.id === selectedModel);

  // Step 3: AR Try-on View
  if (currentStep === 3) {
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
            
            <TouchableOpacity
              onPress={handleShare}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center active:opacity-70"
            >
              <IconSymbol name="square.and.arrow.up" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* AR View */}
          <View className="flex-1 mx-4 my-4 rounded-3xl overflow-hidden bg-surface border border-border">
            <View className="flex-1 items-center justify-center">
              <View className="w-48 h-48 rounded-full bg-background/50 items-center justify-center mb-4">
                <Text className="text-6xl">👩</Text>
              </View>
              
              <View 
                className="absolute items-center justify-center"
                style={{ transform: [{ scale: jewelrySize }], top: '35%' }}
              >
                <Text className="text-5xl">{selectedTypeData?.icon || "💍"}</Text>
              </View>

              <View className="absolute bottom-4 left-4 right-4">
                <View className="bg-background/90 rounded-xl px-4 py-3">
                  <View className="flex-row items-center justify-center">
                    <View className="w-16 h-16 rounded-lg bg-surface items-center justify-center mr-3">
                      <Text className="text-2xl">{selectedTypeData?.icon}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">SUR :</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {selectedModelData?.name || "Modèle"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Controls */}
          <View className="px-6 pb-6">
            <View className="flex-row items-center justify-center mb-6">
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

            <TouchableOpacity
              onPress={handleCapture}
              disabled={isSaving}
              className="py-4 px-8 rounded-full items-center"
              style={[styles.captureButton, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
            >
              <Text className="text-lg font-bold" style={{ color: '#0A1A3B' }}>
                {isSaving ? "Sauvegarde..." : "Sauvegarder l'Essayage"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
                  onPress={() => router.push("/capture")}
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                  style={{ backgroundColor: colors.foreground }}
                >
                  <IconSymbol name="square.and.arrow.up" size={18} color={colors.background} />
                  <Text className="text-base font-semibold ml-2" style={{ color: colors.background }}>
                    Upload
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.push("/ecrin")}
                  className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                >
                  <IconSymbol name="sparkles" size={18} color={colors.foreground} />
                  <Text className="text-base font-semibold ml-2 text-foreground">
                    Mon Écrin
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Upload Zone */}
              <View className="px-4 mt-6">
                <TouchableOpacity
                  onPress={() => router.push("/capture")}
                  className="rounded-2xl p-8 items-center"
                  style={[styles.uploadZone, { borderColor: colors.border }]}
                >
                  <IconSymbol name="square.and.arrow.up" size={32} color={colors.muted} />
                  <Text className="text-base font-semibold text-foreground mt-4">
                    Cliquez pour importer
                  </Text>
                  <Text className="text-sm text-muted mt-1">JPG, PNG</Text>
                </TouchableOpacity>
              </View>

              {/* Type Grid */}
              <View className="px-4 mt-6">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Ou choisissez un type
                </Text>
                <View className="flex-row flex-wrap">
                  {JEWELRY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => handleTypeSelect(type.id)}
                      className="w-[31%] mr-[2%] mb-3 p-3 rounded-xl items-center"
                      style={[
                        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                        selectedType === type.id && { borderColor: colors.primary, borderWidth: 2 }
                      ]}
                    >
                      <Text className="text-2xl mb-1">{type.icon}</Text>
                      <Text 
                        className="text-xs text-center"
                        style={{ color: selectedType === type.id ? colors.primary : colors.muted }}
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
              {/* Model Selection */}
              <View className="px-4 mt-4">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Modèles de démonstration
                </Text>
                <View className="flex-row flex-wrap">
                  {DEMO_MODELS.map((model) => (
                    <TouchableOpacity
                      key={model.id}
                      onPress={() => model.available && handleModelSelect(model.id)}
                      disabled={!model.available}
                      className="w-[48%] mr-[2%] mb-3 rounded-xl overflow-hidden"
                      style={[
                        { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                        selectedModel === model.id && { borderColor: colors.primary, borderWidth: 2 },
                        !model.available && { opacity: 0.5 }
                      ]}
                    >
                      <View 
                        className="aspect-[3/4] items-center justify-center"
                        style={{ backgroundColor: colors.background }}
                      >
                        <Text className="text-4xl">👩</Text>
                        {!model.available && (
                          <View 
                            className="absolute top-2 right-2 px-2 py-1 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-xs font-semibold" style={{ color: '#0A1A3B' }}>
                              Premium
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="p-3">
                        <Text className="text-sm font-semibold text-foreground">{model.name}</Text>
                        <Text className="text-xs text-muted">{model.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Or Upload Own Photo */}
              <View className="px-4 mt-4">
                <Text className="text-sm font-semibold text-foreground mb-3">
                  Ou utilisez votre photo
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/capture")}
                  className="rounded-2xl p-6 items-center"
                  style={[styles.uploadZone, { borderColor: colors.border }]}
                >
                  <IconSymbol name="photo.fill" size={28} color={colors.muted} />
                  <Text className="text-sm font-semibold text-foreground mt-3">
                    Importer ma photo
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Action */}
        <View 
          className="absolute bottom-0 left-0 right-0 px-4 py-4"
          style={{ backgroundColor: colors.background }}
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={currentStep === 2 && !selectedModel}
            className="flex-row items-center justify-center py-4 rounded-full"
            style={[
              { backgroundColor: colors.muted },
              (currentStep === 1 || (currentStep === 2 && selectedModel)) && { backgroundColor: colors.primary }
            ]}
          >
            <Text 
              className="text-base font-semibold mr-2"
              style={{ color: (currentStep === 1 || (currentStep === 2 && selectedModel)) ? '#0A1A3B' : colors.background }}
            >
              Suivant
            </Text>
            <IconSymbol 
              name="chevron.right" 
              size={18} 
              color={(currentStep === 1 || (currentStep === 2 && selectedModel)) ? '#0A1A3B' : colors.background} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Mon essayage Écrin Virtuel"
        message="Découvrez mon essayage virtuel avec Écrin Virtuel ! 💍✨"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  uploadZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  captureButton: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
