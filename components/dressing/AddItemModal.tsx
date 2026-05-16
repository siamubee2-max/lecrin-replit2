import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────
type DressingSection = "jewelry" | "shoes" | "clothing" | "accessories";
type WardrobeCategory =
  | "tops"
  | "bottoms"
  | "dresses"
  | "outerwear"
  | "shoes"
  | "bags"
  | "accessories"
  | "other";

interface ColorOption {
  id: string;
  label: string;
  hex: string;
}

interface SectionConfig {
  id: DressingSection;
  label: string;
  emoji: string;
  placeholder: string;
}

interface SubcategoryOption {
  id: WardrobeCategory;
  label: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  defaultSection: DressingSection;
  colors: ReturnType<typeof import("@/hooks/use-colors").useColors>;
  onSuccess: () => void;
  // Config dependencies passed from parent
  sections: SectionConfig[];
  sectionSubcategories: Record<DressingSection, SubcategoryOption[]>;
  colorOptions: ColorOption[];
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function AddItemModal({
  visible,
  onClose,
  defaultSection,
  colors,
  onSuccess,
  sections,
  sectionSubcategories,
  colorOptions,
}: AddItemModalProps) {
  const currentSection = useMemo(
    () => sections.find((s) => s.id === defaultSection) ?? sections[0],
    [defaultSection, sections],
  );
  const subcats = sectionSubcategories[defaultSection] ?? [];

  const [name, setName] = useState("");
  const [category, setCategory] = useState<WardrobeCategory>(subcats[0]?.id ?? "other");
  const [brand, setBrand] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [price, setPrice] = useState("");

  const addItemMutation = trpc.wardrobe.add.useMutation({
    onSuccess: async () => {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onSuccess();
      onClose();
      setName("");
      setBrand("");
      setSelectedColor("");
      setPrice("");
      setCategory(subcats[0]?.id ?? "other");
    },
  });

  const isSubmitting = addItemMutation.isPending;

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting) return;

    await addItemMutation.mutateAsync({
      name: trimmedName,
      category,
      brand: brand.trim() || undefined,
      color: selectedColor || undefined,
      price: price.trim() ? Number(price.replace(",", ".")) : undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}> 
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}> 
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.muted }]}>Annuler</Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.modalEmoji}>{currentSection.emoji}</Text>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}> 
              AJOUTER {currentSection.label}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            <Text
              style={[
                styles.modalSave,
                {
                  color:
                    name.trim() && !isSubmitting
                      ? colors.primary
                      : colors.muted,
                },
              ]}
            >
              {isSubmitting ? "…" : "Ajouter"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>NOM *</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder={currentSection.placeholder}
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />

          {subcats.length > 1 && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>CATÉGORIE</Text>
              <View style={styles.chipsRow}>
                {subcats.map((sc) => (
                  <TouchableOpacity
                    key={sc.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          category === sc.id ? colors.primary : colors.surface,
                        borderColor:
                          category === sc.id ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setCategory(sc.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color:
                            category === sc.id
                              ? colors.background
                              : colors.foreground,
                        },
                      ]}
                    >
                      {sc.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>MARQUE</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Ex: Chanel, Zara, Nike…"
            placeholderTextColor={colors.muted}
            value={brand}
            onChangeText={setBrand}
            returnKeyType="next"
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>COULEUR</Text>
          <View style={styles.colorRow}>
            {colorOptions.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c.hex,
                    borderWidth: selectedColor === c.id ? 3 : 1,
                    borderColor:
                      selectedColor === c.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedColor(c.id)}
                accessibilityLabel={c.label}
              />
            ))}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>PRIX (€)</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Ex: 89"
            placeholderTextColor={colors.muted}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            returnKeyType="done"
          />

          {addItemMutation.error ? (
            <Text style={[styles.errorText, { color: colors.error }]}> 
              {addItemMutation.error.message}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor:
                  !name.trim() || isSubmitting ? colors.border : colors.primary,
              },
            ]}
            onPress={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.background }]}> 
                Ajouter l’article
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '600',
    padding: 8,
  },
  modalEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    padding: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
