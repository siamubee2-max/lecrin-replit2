/**
 * Style Preferences Tab Component
 * Allows users to set their jewelry style preferences
 */

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n-context";
import {
  StylePreferences,
  MetalPreference,
  StonePreference,
  StyleType,
  OccasionType,
  BudgetRange,
  loadStylePreferences,
  saveStylePreferences,
  DEFAULT_STYLE_PREFERENCES,
  METAL_NAMES,
  METAL_ICONS,
  STONE_NAMES,
  STONE_ICONS,
  STYLE_NAMES,
  STYLE_ICONS,
  OCCASION_NAMES,
  OCCASION_ICONS,
  BUDGET_NAMES,
  SKIN_TONE_NAMES,
} from "@/services/style-preferences-service";

interface StylePreferencesTabProps {
  onPreferencesChange?: (preferences: StylePreferences) => void;
}

export function StylePreferencesTab({ onPreferencesChange }: StylePreferencesTabProps) {
  const colors = useColors();
  const { t } = useI18n();
  const [preferences, setPreferences] = useState<StylePreferences>(DEFAULT_STYLE_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const loaded = await loadStylePreferences();
      setPreferences(loaded);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsSaving(true);
    try {
      await saveStylePreferences(preferences);
      setHasChanges(false);
      onPreferencesChange?.(preferences);
      Alert.alert(
        t.profile?.preferences?.saved || "Préférences enregistrées",
        t.profile?.preferences?.savedMessage || "Vos préférences ont été sauvegardées avec succès."
      );
    } catch (error) {
      Alert.alert(
        t.common?.error || "Erreur",
        t.profile?.preferences?.saveError || "Impossible de sauvegarder vos préférences."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMetal = (metal: MetalPreference) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences((prev) => {
      const metals = prev.preferredMetals.includes(metal)
        ? prev.preferredMetals.filter((m) => m !== metal)
        : [...prev.preferredMetals, metal];
      return { ...prev, preferredMetals: metals };
    });
    setHasChanges(true);
  };

  const toggleStone = (stone: StonePreference) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences((prev) => {
      const stones = prev.preferredStones.includes(stone)
        ? prev.preferredStones.filter((s) => s !== stone)
        : [...prev.preferredStones, stone];
      return { ...prev, preferredStones: stones };
    });
    setHasChanges(true);
  };

  const toggleStyle = (style: StyleType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences((prev) => {
      const styles = prev.preferredStyles.includes(style)
        ? prev.preferredStyles.filter((s) => s !== style)
        : [...prev.preferredStyles, style];
      return { ...prev, preferredStyles: styles };
    });
    setHasChanges(true);
  };

  const toggleOccasion = (occasion: OccasionType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences((prev) => {
      const occasions = prev.preferredOccasions.includes(occasion)
        ? prev.preferredOccasions.filter((o) => o !== occasion)
        : [...prev.preferredOccasions, occasion];
      return { ...prev, preferredOccasions: occasions };
    });
    setHasChanges(true);
  };

  const setBudget = (budget: BudgetRange) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences((prev) => ({ ...prev, budgetRange: budget }));
    setHasChanges(true);
  };

  const setSkinTone = (tone: StylePreferences["skinTone"]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setPreferences((prev) => ({ ...prev, skinTone: tone }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Metals Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {t.profile?.preferences?.metals || "Métaux préférés"}
        </Text>
        <Text className="text-sm text-muted mb-4">
          {t.profile?.preferences?.metalsDescription || "Sélectionnez les métaux que vous préférez"}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(METAL_NAMES) as MetalPreference[]).map((metal) => (
            <TouchableOpacity
              key={metal}
              onPress={() => toggleMetal(metal)}
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: preferences.preferredMetals.includes(metal)
                  ? colors.primary
                  : colors.surface,
                borderWidth: 1,
                borderColor: preferences.preferredMetals.includes(metal)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text className="mr-2">{METAL_ICONS[metal]}</Text>
              <Text
                className="font-medium"
                style={{
                  color: preferences.preferredMetals.includes(metal)
                    ? "#0A1A3B"
                    : colors.foreground,
                }}
              >
                {METAL_NAMES[metal]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stones Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {t.profile?.preferences?.stones || "Pierres préférées"}
        </Text>
        <Text className="text-sm text-muted mb-4">
          {t.profile?.preferences?.stonesDescription || "Sélectionnez les pierres que vous aimez"}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(STONE_NAMES) as StonePreference[]).map((stone) => (
            <TouchableOpacity
              key={stone}
              onPress={() => toggleStone(stone)}
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: preferences.preferredStones.includes(stone)
                  ? colors.primary
                  : colors.surface,
                borderWidth: 1,
                borderColor: preferences.preferredStones.includes(stone)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text className="mr-2">{STONE_ICONS[stone]}</Text>
              <Text
                className="font-medium"
                style={{
                  color: preferences.preferredStones.includes(stone)
                    ? "#0A1A3B"
                    : colors.foreground,
                }}
              >
                {STONE_NAMES[stone]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Styles Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {t.profile?.preferences?.styles || "Styles préférés"}
        </Text>
        <Text className="text-sm text-muted mb-4">
          {t.profile?.preferences?.stylesDescription || "Choisissez vos styles de bijoux favoris"}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(STYLE_NAMES) as StyleType[]).map((style) => (
            <TouchableOpacity
              key={style}
              onPress={() => toggleStyle(style)}
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: preferences.preferredStyles.includes(style)
                  ? colors.primary
                  : colors.surface,
                borderWidth: 1,
                borderColor: preferences.preferredStyles.includes(style)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text className="mr-2">{STYLE_ICONS[style]}</Text>
              <Text
                className="font-medium"
                style={{
                  color: preferences.preferredStyles.includes(style)
                    ? "#0A1A3B"
                    : colors.foreground,
                }}
              >
                {STYLE_NAMES[style]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Occasions Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {t.profile?.preferences?.occasions || "Occasions"}
        </Text>
        <Text className="text-sm text-muted mb-4">
          {t.profile?.preferences?.occasionsDescription || "Pour quelles occasions portez-vous des bijoux ?"}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(OCCASION_NAMES) as OccasionType[]).map((occasion) => (
            <TouchableOpacity
              key={occasion}
              onPress={() => toggleOccasion(occasion)}
              className="flex-row items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: preferences.preferredOccasions.includes(occasion)
                  ? colors.primary
                  : colors.surface,
                borderWidth: 1,
                borderColor: preferences.preferredOccasions.includes(occasion)
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text className="mr-2">{OCCASION_ICONS[occasion]}</Text>
              <Text
                className="font-medium"
                style={{
                  color: preferences.preferredOccasions.includes(occasion)
                    ? "#0A1A3B"
                    : colors.foreground,
                }}
              >
                {OCCASION_NAMES[occasion]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Budget Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {t.profile?.preferences?.budget || "Budget"}
        </Text>
        <Text className="text-sm text-muted mb-4">
          {t.profile?.preferences?.budgetDescription || "Quel est votre budget habituel pour les bijoux ?"}
        </Text>
        <View className="gap-2">
          {(Object.keys(BUDGET_NAMES) as BudgetRange[]).map((budget) => (
            <TouchableOpacity
              key={budget}
              onPress={() => setBudget(budget)}
              className="flex-row items-center px-4 py-3 rounded-xl"
              style={{
                backgroundColor: preferences.budgetRange === budget
                  ? colors.primary
                  : colors.surface,
                borderWidth: 1,
                borderColor: preferences.budgetRange === budget
                  ? colors.primary
                  : colors.border,
              }}
            >
              <View
                className="w-5 h-5 rounded-full mr-3 items-center justify-center"
                style={{
                  borderWidth: 2,
                  borderColor: preferences.budgetRange === budget
                    ? "#0A1A3B"
                    : colors.border,
                }}
              >
                {preferences.budgetRange === budget && (
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#0A1A3B" }}
                  />
                )}
              </View>
              <Text
                className="font-medium"
                style={{
                  color: preferences.budgetRange === budget
                    ? "#0A1A3B"
                    : colors.foreground,
                }}
              >
                {BUDGET_NAMES[budget]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Skin Tone Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-foreground mb-3">
          {t.profile?.preferences?.skinTone || "Teint de peau"}
        </Text>
        <Text className="text-sm text-muted mb-4">
          {t.profile?.preferences?.skinToneDescription || "Pour des recommandations de couleurs adaptées"}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(Object.keys(SKIN_TONE_NAMES) as StylePreferences["skinTone"][]).map((tone) => (
            <TouchableOpacity
              key={tone}
              onPress={() => setSkinTone(tone)}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: preferences.skinTone === tone
                  ? colors.primary
                  : colors.surface,
                borderWidth: 1,
                borderColor: preferences.skinTone === tone
                  ? colors.primary
                  : colors.border,
              }}
            >
              <Text
                className="font-medium"
                style={{
                  color: preferences.skinTone === tone
                    ? "#0A1A3B"
                    : colors.foreground,
                }}
              >
                {SKIN_TONE_NAMES[tone]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save Button */}
      {hasChanges && (
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className="py-4 rounded-xl items-center"
          style={{ backgroundColor: colors.primary }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#0A1A3B" />
          ) : (
            <Text className="text-base font-semibold" style={{ color: "#0A1A3B" }}>
              {t.profile?.preferences?.saveButton || "Enregistrer mes préférences"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
