import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocalSearchParams, router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { OutfitBuilder } from "@/components/tryon/OutfitBuilder";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { PaywallModal } from "@/components/paywall/PaywallModal";

// Convertit une URI locale (file:// ou content://) en URL publique via upload
async function ensurePublicUrl(
  uri: string,
  uploadMutation: { mutateAsync: (args: { base64Data: string; mimeType?: string }) => Promise<{ url: string }> }
): Promise<string> {
  // Si c'est déjà une URL HTTP(S), on la retourne directement
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  // Sinon, c'est une URI locale — on lit en base64 et on upload
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const result = await uploadMutation.mutateAsync({ base64Data: base64, mimeType: "image/jpeg" });
  return result.url;
}

import {
  MANNEQUIN_SECTIONS,
  SHOES_MANNEQUIN_SECTIONS,
  CLOTHING_MANNEQUIN_SECTIONS,
  JEWELRY_BY_TYPE,
  SHOES_DEMO,
  CLOTHING_DEMO,
  ACCESSORIES_DEMO,
  HATS_DEMO,
  WATCHES_DEMO,
} from "@/constants/images";

// ─── Types de bijoux ───────────────────────────────────────────────────────────
const JEWELRY_TYPES = [
  { key: "earrings", label: "Boucles d'oreilles" },
  { key: "necklace", label: "Colliers" },
  { key: "bracelet", label: "Bracelets" },
  { key: "ring", label: "Bagues" },
  { key: "anklet", label: "Chevillières" },
  { key: "set", label: "Parures" },
] as const;

type JewelryTypeKey = typeof JEWELRY_TYPES[number]["key"];
type GalleryItem = { id: string; uri: string; label: string };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Type Historique Essayage ─────────────────────────────────────────────────
export type TryOnHistoryEntry = {
  id: string;
  date: string; // ISO string
  category: TryOnMode;
  subType?: string;
  itemName: string;
  resultImageUrl: string;
  modelImageUrl: string;
  itemImageUrl: string;
};

// SHOES_MANNEQUIN_SECTIONS, CLOTHING_MANNEQUIN_SECTIONS, SHOES_DEMO, etc. imported from @/constants/images

type TryOnMode = "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";
type AccessoryTypeKey = "bag" | "belt" | "sunglasses" | "scarf" | "hat" | "watch" | "other";

const ACCESSORY_TYPES: { key: AccessoryTypeKey; label: string; emoji: string }[] = [
  { key: "bag", label: "Sacs", emoji: "👜" },
  { key: "belt", label: "Ceintures", emoji: "🪢" },
  { key: "sunglasses", label: "Lunettes", emoji: "🕶️" },
  { key: "scarf", label: "Écharpes", emoji: "🧣" },
  { key: "hat", label: "Chapeaux", emoji: "🎩" },
  { key: "watch", label: "Montres", emoji: "⌚" },
  { key: "other", label: "Autres", emoji: "✨" },
];


// Accessoires filtrés par sous-type
const ACCESSORIES_BY_TYPE: Record<AccessoryTypeKey, typeof ACCESSORIES_DEMO> = {
  bag: ACCESSORIES_DEMO.filter(a => a.id === "bag-black"),
  belt: ACCESSORIES_DEMO.filter(a => a.id === "belt-gold"),
  sunglasses: ACCESSORIES_DEMO.filter(a => a.id === "sunglasses-black"),
  scarf: ACCESSORIES_DEMO.filter(a => a.id === "scarf-beige"),
  hat: HATS_DEMO,
  watch: WATCHES_DEMO,
  other: ACCESSORIES_DEMO,
};

// Poses disponibles pour le mannequin
const POSE_OPTIONS = [
  { key: "front",   label: "Face",    icon: "⬛", description: "standing upright, facing directly forward, neutral pose" },
  { key: "side",    label: "Profil",  icon: "◀",  description: "standing in a 3/4 side profile pose, slightly turned" },
  { key: "walking", label: "Marche",  icon: "🚶", description: "walking pose, mid-stride, natural movement" },
  { key: "back",    label: "Dos",     icon: "⬜", description: "standing with back to camera, rear view" },
] as const;
type PoseKey = typeof POSE_OPTIONS[number]["key"];

const MODE_CONFIG: Record<TryOnMode, { title: string; subtitle: string; itemLabel: string; mannequinSections: typeof MANNEQUIN_SECTIONS; emoji: string }> = {
  jewelry: { title: "ESSAYAGE BIJOUX", subtitle: "VIRTUEL", itemLabel: "BIJOU", mannequinSections: MANNEQUIN_SECTIONS, emoji: "💎" },
  shoes: { title: "ESSAYAGE CHAUSSURES", subtitle: "VIRTUEL", itemLabel: "CHAUSSURE", mannequinSections: SHOES_MANNEQUIN_SECTIONS, emoji: "👠" },
  clothing: { title: "ESSAYAGE VÊTEMENTS", subtitle: "VIRTUEL", itemLabel: "VÊTEMENT", mannequinSections: CLOTHING_MANNEQUIN_SECTIONS, emoji: "👗" },
  accessories: { title: "ESSAYAGE ACCESSOIRES", subtitle: "VIRTUEL", itemLabel: "ACCESSOIRE", mannequinSections: MANNEQUIN_SECTIONS, emoji: "👜" },
  outfit: { title: "TENUE COMPLÈTE", subtitle: "VIRTUEL", itemLabel: "ARTICLE", mannequinSections: CLOTHING_MANNEQUIN_SECTIONS, emoji: "✨" },
};

export default function TryOnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    section?: string;
    itemId?: string;
    itemName?: string;
    // Params de relance depuis l'historique
    retryModelUrl?: string;
    retryItemUrl?: string;
    retryItemName?: string;
    retrySubType?: string;
    // Params depuis la boutique (bouton ESSAYER)
    partnerJewelryId?: string;
    partnerJewelryName?: string;
    partnerJewelryType?: string;
    partnerJewelryImage?: string;
  }>();

  const initialMode: TryOnMode = useMemo(() => {
    if (params.section === "shoes") return "shoes";
    if (params.section === "clothing") return "clothing";
    if (params.section === "accessories") return "accessories";
    return "jewelry";
  }, [params.section]);

  const [tryOnMode, setTryOnMode] = useState<TryOnMode>(initialMode);
  const [selectedJewelryType, setSelectedJewelryType] = useState<JewelryTypeKey>("earrings");
  const [selectedAccessoryType, setSelectedAccessoryType] = useState<AccessoryTypeKey>("other");
  const [numSamples, setNumSamples] = useState<1 | 2 | 4>(1);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedJewelry, setSelectedJewelry] = useState<GalleryItem | null>(null);

  // Pré-remplissage depuis la boutique (bouton ESSAYER)
  const hasPartnerParams = !!(params.partnerJewelryId && params.partnerJewelryImage);
  useEffect(() => {
    if (!hasPartnerParams) return;
    // Pré-sélectionner l'article de la boutique
    setSelectedJewelry({
      id: `partner-${params.partnerJewelryId}`,
      uri: params.partnerJewelryImage!,
      label: params.partnerJewelryName ?? "Bijou",
    });
    // Ajuster le type de bijou si disponible
    const validJewelryTypes: JewelryTypeKey[] = ["earrings", "necklace", "bracelet", "ring", "anklet", "set"];
    if (params.partnerJewelryType && validJewelryTypes.includes(params.partnerJewelryType as JewelryTypeKey)) {
      setSelectedJewelryType(params.partnerJewelryType as JewelryTypeKey);
    }
  }, [hasPartnerParams]);

  // Pré-remplissage depuis l'historique (bouton Réessayer)
  const hasRetryParams = !!(params.retryModelUrl && params.retryItemUrl);
  useEffect(() => {
    if (!hasRetryParams) return;
    setUserPhoto(params.retryModelUrl!);
    setSelectedJewelry({
      id: "retry-item",
      uri: params.retryItemUrl!,
      label: params.retryItemName ?? "Article",
    });
    // Restaurer le sous-type si disponible
    if (params.section === "jewelry" && params.retrySubType) {
      const validJewelryTypes: JewelryTypeKey[] = ["earrings", "necklace", "bracelet", "ring", "anklet", "set"];
      if (validJewelryTypes.includes(params.retrySubType as JewelryTypeKey)) {
        setSelectedJewelryType(params.retrySubType as JewelryTypeKey);
      }
    }
    if (params.section === "accessories" && params.retrySubType) {
      const validAccessoryTypes: AccessoryTypeKey[] = ["bag", "belt", "sunglasses", "scarf", "hat", "watch", "other"];
      if (validAccessoryTypes.includes(params.retrySubType as AccessoryTypeKey)) {
        setSelectedAccessoryType(params.retrySubType as AccessoryTypeKey);
      }
    }
  }, [hasRetryParams]);
  const [showMannequinModal, setShowMannequinModal] = useState(false);
  const [showJewelryModal, setShowJewelryModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const subscription = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [resultImageUrls, setResultImageUrls] = useState<string[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [selectedPose, setSelectedPose] = useState<PoseKey>("front");
  const progressAnim = useRef(new Animated.Value(0)).current;

  const { user } = useAuth();
  const addToCollectionMutation = trpc.collection.add.useMutation();
  const uploadImageMutation = trpc.ai.uploadImage.useMutation();
  const tryOnMutation = trpc.virtualTryOn.generate.useMutation();

  const PROGRESS_STEPS = useMemo(() => {
    const itemWord = tryOnMode === "jewelry" ? "bijou" : tryOnMode === "shoes" ? "chaussures" : tryOnMode === "clothing" ? "vêtement" : "accessoire";
    return [
      `Analyse ${tryOnMode === "shoes" || tryOnMode === "accessories" ? "de l'" : "du "}${itemWord}…`,
      "Détection du corps…",
      "Positionnement intelligent…",
      "Génération du rendu…",
      "Finalisation…",
    ];
  }, [tryOnMode]);

  useEffect(() => {
    if (!isProcessing) {
      setProgressStep(0);
      progressAnim.setValue(0);
      return;
    }
    // Animate progress bar from 0 to 0.9 over ~12s (real completion sets to 1)
    Animated.timing(progressAnim, {
      toValue: 0.9,
      duration: 12000,
      useNativeDriver: false,
    }).start();
    // Cycle through steps
    const stepInterval = setInterval(() => {
      setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 2400);
    return () => clearInterval(stepInterval);
  }, [isProcessing]);

  const currentType = JEWELRY_TYPES.find(t => t.key === selectedJewelryType)!;
  const jewelryOptions = JEWELRY_BY_TYPE[selectedJewelryType] || [];

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à votre galerie photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUserPhoto(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à votre caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUserPhoto(result.assets[0].uri);
    }
  };

  const handleSelectMannequin = useCallback((item: GalleryItem) => {
    setUserPhoto(item.uri);
    setShowMannequinModal(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSelectJewelry = useCallback((item: GalleryItem) => {
    setSelectedJewelry(item);
    setShowJewelryModal(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleTryOn = async () => {
    // Vérification abonnement
    if (!subscription.canUseVirtualTryOn) {
      setShowPaywall(true);
      return;
    }
    if (!userPhoto) {
      Alert.alert("Photo manquante", "Veuillez sélectionner votre photo ou un mannequin.");
      return;
    }
    if (!selectedJewelry) {
      Alert.alert("Bijou manquant", "Veuillez sélectionner un bijou à essayer.");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    setResultImageUrl(null);
    try {
      // Convertir les URIs locales en URLs publiques si nécessaire
      const [publicModelUrl, publicJewelryUrl] = await Promise.all([
        ensurePublicUrl(userPhoto, uploadImageMutation),
        ensurePublicUrl(selectedJewelry.uri, uploadImageMutation),
      ]);
      const result = await tryOnMutation.mutateAsync({
        modelImageUrl: publicModelUrl,
        jewelryImageUrl: publicJewelryUrl,
        category: tryOnMode as "jewelry" | "shoes" | "clothing" | "accessories",
        ...(tryOnMode === "jewelry" ? { jewelryType: selectedJewelryType } : {}),
        ...(tryOnMode === "accessories" ? { accessoryType: selectedAccessoryType } : {}),
        jewelryName: selectedJewelry.label,
        numSamples,
        pose: selectedPose,
      });
      // Complete progress bar to 100%
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
      const urls = result.resultImageUrls ?? (result.resultImageUrl ? [result.resultImageUrl] : []);
      setResultImageUrls(urls);
      setResultImageUrl(urls[0] ?? null);
      setSelectedVariantIndex(0);
      setShowResultModal(true);
      subscription.incrementTryOnUsage();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Sauvegarder dans l'historique AsyncStorage
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const historyKey = "tryon_history";
        const existing = await AsyncStorage.getItem(historyKey);
        const history: TryOnHistoryEntry[] = existing ? JSON.parse(existing) : [];
        const newEntry: TryOnHistoryEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          category: tryOnMode,
          itemName: selectedJewelry.label,
          resultImageUrl: urls[0] ?? "",
          modelImageUrl: publicModelUrl,
          itemImageUrl: publicJewelryUrl,
          ...(tryOnMode === "jewelry" ? { subType: selectedJewelryType } : {}),
          ...(tryOnMode === "accessories" ? { subType: selectedAccessoryType } : {}),
        };
        history.unshift(newEntry);
        // Garder max 50 entrées
        await AsyncStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50)));
      } catch {}
      // Fin sauvegarde historique
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      Alert.alert("Erreur", `L'essayage a échoué : ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canTryOn = !!userPhoto && !!selectedJewelry && !isProcessing;

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
         {/* Header luxe avec sélecteur de mode */}
        <View style={styles.luxeHeader}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>{MODE_CONFIG[tryOnMode].title}</Text>
            <Text style={[styles.titleAccent, { color: colors.primary }]}>{MODE_CONFIG[tryOnMode].subtitle}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontSize: 28 }}>{MODE_CONFIG[tryOnMode].emoji}</Text>
            {/* Compteur d'essayages restants */}
            {subscription.tier === 'free' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 0.5 }}>
                  {Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed)} essai{Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed) > 1 ? 's' : ''} gratuit{Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed) > 1 ? 's' : ''}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: colors.primary }}>
                <Text style={{ fontSize: 10, color: colors.primary, letterSpacing: 0.5 }}>
                  {subscription.tier === 'jewelry' ? '💎' : '✦'} {Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed)} restant{Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed) > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        </View>
        {/* Bannière de relance depuis l'historique */}
        {hasRetryParams && (
          <View
            style={[
              {
                marginHorizontal: 20,
                marginBottom: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <IconSymbol name="sparkles" size={14} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 11, color: colors.muted, letterSpacing: 0.3 }}>
              Essayage pré-rempli depuis votre historique. Modifiez ou lancez directement.
            </Text>
          </View>
        )}

        {/* Sélecteur de mode (Bijoux / Chaussures / Tenue / Vêtements / Accessoires) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: "center" }}
        >
          {(["jewelry", "shoes", "outfit", "clothing", "accessories"] as TryOnMode[]).map((mode) => {
            const isActive = tryOnMode === mode;
            const isOutfit = mode === "outfit";
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => {
                  setTryOnMode(mode);
                  setSelectedJewelry(null);
                  setUserPhoto(null);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isActive
                      ? (isOutfit ? "#C9A96E" : colors.foreground)
                      : (isOutfit ? "rgba(201,169,110,0.08)" : "transparent"),
                    borderColor: isActive
                      ? (isOutfit ? "#C9A96E" : colors.primary)
                      : (isOutfit ? "#C9A96E" : colors.border),
                    ...(isOutfit ? {
                      paddingHorizontal: 22,
                      paddingVertical: 10,
                      borderWidth: 1.5,
                      borderRadius: 24,
                    } : {}),
                  },
                ]}
              >
                <Text style={{ fontSize: isOutfit ? 16 : 14, marginRight: 4 }}>{MODE_CONFIG[mode].emoji}</Text>
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: isActive
                        ? (isOutfit ? "#fff" : colors.background)
                        : (isOutfit ? "#C9A96E" : colors.muted),
                      ...(isOutfit ? { fontSize: 11, fontWeight: "700", letterSpacing: 1.8 } : {}),
                    },
                  ]}
                >
                  {mode === "jewelry" ? "Bijoux" : mode === "shoes" ? "Chaussures" : mode === "clothing" ? "Vêtements" : mode === "accessories" ? "Accessoires" : "Tenue"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.headerLine, { backgroundColor: colors.border }]} />

        {/* Mode Tenue Complète - Premium requis */}
        {tryOnMode === "outfit" && (
          subscription.canUseOutfitBuilder ? (
            <View style={{ flex: 1, minHeight: 600 }}>
              <OutfitBuilder />
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 }}>
              <Text style={{ fontSize: 32 }}>👗</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, textAlign: "center" }}>Mode Tenue Complète</Text>
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", lineHeight: 20 }}>Composez un look complet avec 15 slots dédiés (bijoux, vêtements, accessoires, chaussures…). Fonctionnalité Premium.</Text>
              <TouchableOpacity
                onPress={() => setShowPaywall(true)}
                style={{ backgroundColor: "#C9A96E", borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 }}>DÉBLOQUER PREMIUM</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* Contenu des autres modes */}
        {tryOnMode !== "outfit" && (<>
        {/* Sélecteur de type de bijou (uniquement en mode bijoux) */}
        {tryOnMode === "jewelry" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
        >
          {JEWELRY_TYPES.map((type) => {
            const isSelected = selectedJewelryType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                onPress={() => {
                  setSelectedJewelryType(type.key);
                  setSelectedJewelry(null);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected ? colors.foreground : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: isSelected ? colors.background : colors.muted },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}

        {/* Sélecteur de sous-type accessoires (uniquement en mode accessoires) */}
        {tryOnMode === "accessories" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
          >
            {ACCESSORY_TYPES.map((type) => {
              const isSelected = selectedAccessoryType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => {
                    setSelectedAccessoryType(type.key);
                    setSelectedJewelry(null);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSelected ? colors.foreground : "transparent",
                      borderColor: isSelected ? colors.primary : colors.border,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 12 }}>{type.emoji}</Text>
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: isSelected ? colors.background : colors.muted },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Sélecteur du nombre de variantes */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={[styles.photoLabel, { color: colors.muted, marginBottom: 8 }]}>VARIANTES</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([1, 2, 4] as const).map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => {
                  setNumSamples(n);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.typeChip,
                  {
                    paddingHorizontal: 20,
                    backgroundColor: numSamples === n ? colors.foreground : "transparent",
                    borderColor: numSamples === n ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.typeChipText, { color: numSamples === n ? colors.background : colors.muted }]}>
                  {n === 1 ? "1 image" : `${n} images`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sélecteur de pose du mannequin */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={[styles.photoLabel, { color: colors.muted, marginBottom: 8 }]}>POSE</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {POSE_OPTIONS.map((pose) => {
              const isSelected = selectedPose === pose.key;
              return (
                <TouchableOpacity
                  key={pose.key}
                  onPress={() => {
                    setSelectedPose(pose.key);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[styles.typeChip, { flex: 1, paddingHorizontal: 4, backgroundColor: isSelected ? colors.foreground : "transparent", borderColor: isSelected ? colors.primary : colors.border }]}
                >
                  <Text style={{ fontSize: 16, textAlign: "center" }}>{pose.icon}</Text>
                  <Text style={[styles.typeChipText, { color: isSelected ? colors.background : colors.muted, marginTop: 2 }]}>{pose.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Zone principale : Photo + Bijou côte à côte */}
        <View style={styles.photosRow}>
          {/* ── Votre photo ── */}
          <View style={styles.photoCol}>
            <Text style={[styles.photoLabel, { color: colors.muted }]}>VOTRE PHOTO</Text>

            {/* Grande zone photo */}
            <TouchableOpacity
              onPress={() => setShowMannequinModal(true)}
              style={[
                styles.photoBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: userPhoto ? colors.primary : colors.border,
                  borderWidth: userPhoto ? 2 : 1,
                },
              ]}
              activeOpacity={0.85}
            >
              {userPhoto ? (
                <Image
                  source={{ uri: userPhoto }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.emptyBox}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.border }]}>
                    <IconSymbol name="person.fill" size={28} color={colors.muted} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Appuyez pour choisir
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Boutons photo */}
            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[styles.smallBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <IconSymbol name="camera.fill" size={13} color={colors.primary} />
                <Text style={[styles.smallBtnText, { color: colors.primary }]}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickFromGallery}
                style={[styles.smallBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <IconSymbol name="photo.fill" size={13} color={colors.primary} />
                <Text style={[styles.smallBtnText, { color: colors.primary }]}>Galerie</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => setShowMannequinModal(true)}
              style={[styles.fullBtn, { backgroundColor: colors.foreground }]}
            >
              <IconSymbol name="person.2.fill" size={14} color={colors.background} />
              <Text style={[styles.fullBtnText, { color: colors.background }]}>
                Galerie Mannequins
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── L'article à essayer ── */}
          <View style={styles.photoCol}>
            <Text style={[styles.photoLabel, { color: colors.muted }]}>
              {tryOnMode === "jewelry" ? currentType.label.toUpperCase() : MODE_CONFIG[tryOnMode].itemLabel}
            </Text>

            {/* Grande zone bijou */}
            <TouchableOpacity
              onPress={() => setShowJewelryModal(true)}
              style={[
                styles.photoBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: selectedJewelry ? colors.primary : colors.border,
                  borderWidth: selectedJewelry ? 2 : 1,
                },
              ]}
              activeOpacity={0.85}
            >
              {selectedJewelry ? (
                <Image
                  source={{ uri: selectedJewelry.uri }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.emptyBox}>
                  <View style={[styles.emptyIcon, { backgroundColor: colors.border }]}>
                    <IconSymbol name="sparkles" size={28} color={colors.muted} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Appuyez pour choisir
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {selectedJewelry && (
              <Text style={[styles.selectedLabel, { color: colors.primary }]} numberOfLines={1}>
                {selectedJewelry.label}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => setShowJewelryModal(true)}
              style={[
                styles.fullBtn,
                { backgroundColor: colors.foreground, marginTop: selectedJewelry ? 6 : 34 },
              ]}
            >
              <IconSymbol name="diamond.fill" size={14} color={colors.background} />
              <Text style={[styles.fullBtnText, { color: colors.background }]}>
                {tryOnMode === "jewelry" ? "Galerie Bijoux" : tryOnMode === "shoes" ? "Galerie Chaussures" : tryOnMode === "clothing" ? "Galerie Vêtements" : "Galerie Accessoires"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bouton Essayer */}
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <TouchableOpacity
            onPress={handleTryOn}
            disabled={!canTryOn}
            style={[
              styles.tryOnBtn,
              {
                backgroundColor: canTryOn ? colors.foreground : colors.border,
                opacity: canTryOn ? 1 : 0.6,
              },
            ]}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color={colors.background} />
                <Text style={[styles.tryOnBtnText, { color: colors.background }]}>
                  {PROGRESS_STEPS[progressStep]}
                </Text>
              </>
            ) : (
              <>
                <IconSymbol
                  name="sparkles"
                  size={20}
                  color={canTryOn ? colors.background : colors.muted}
                />
                <Text
                  style={[
                    styles.tryOnBtnText,
                    { color: canTryOn ? colors.background : colors.muted },
                  ]}
                >
                  {tryOnMode === "jewelry" ? "ESSAYER CE BIJOU" : tryOnMode === "shoes" ? "ESSAYER CES CHAUSSURES" : tryOnMode === "clothing" ? "ESSAYER CE VÊTEMENT" : "ESSAYER CET ACCESSOIRE"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {isProcessing && (
            <View style={{ marginTop: 16 }}>
              {/* Track */}
              <View
                style={{
                  height: 2,
                  backgroundColor: colors.border,
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={{
                    height: 2,
                    backgroundColor: colors.primary,
                    borderRadius: 1,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  }}
                />
              </View>
              <Text
                style={[
                  styles.hintText,
                  { color: colors.muted, marginTop: 8, textAlign: "center" },
                ]}
              >
                {`${progressStep + 1} / ${PROGRESS_STEPS.length} — ${PROGRESS_STEPS[progressStep]}`}
              </Text>
            </View>
          )}

          {!canTryOn && !isProcessing && (
            <Text style={[styles.hintText, { color: colors.muted }]}>
              {!userPhoto
                ? "Sélectionnez d'abord votre photo ou un mannequin"
                : tryOnMode === "jewelry" ? "Sélectionnez ensuite un bijou à essayer"
                : tryOnMode === "shoes" ? "Sélectionnez ensuite une paire de chaussures"
                : tryOnMode === "clothing" ? "Sélectionnez ensuite un vêtement à essayer"
                : "Sélectionnez ensuite un accessoire à essayer"}
            </Text>
          )}
        </View>
        </>)}
      </ScrollView>

      {/* ─── Modal Mannequins ───────────────────────────────────────────────────── */}
      <GalleryModal
        visible={showMannequinModal}
        title={tryOnMode === "shoes" ? "Mannequins Chaussures" : tryOnMode === "clothing" ? "Mannequins Vêtements" : "Galerie Mannequins"}
        subtitle={tryOnMode === "shoes" ? "Choisissez une photo pieds/jambes ou corps entier" : tryOnMode === "clothing" ? "Choisissez un mannequin corps entier" : "Choisissez votre photo ou un mannequin"}
        sections={MODE_CONFIG[tryOnMode].mannequinSections}
        onSelect={handleSelectMannequin}
        onClose={() => setShowMannequinModal(false)}
        imageMode="cover"
        colors={colors}     />

        {/* ─── Modal Article ───────────────────────────────────────────────────── */}
      <GalleryModal
        visible={showJewelryModal}
        title={tryOnMode === "jewelry" ? `Galerie — ${currentType.label}` : `Galerie — ${MODE_CONFIG[tryOnMode].itemLabel}`}
        subtitle={tryOnMode === "jewelry" ? "Sélectionnez un bijou à essayer" : tryOnMode === "shoes" ? "Sélectionnez une chaussure à essayer" : tryOnMode === "clothing" ? "Sélectionnez un vêtement à essayer" : "Sélectionnez un accessoire à essayer"}
        sections={tryOnMode === "jewelry"
          ? [{ title: currentType.label, data: jewelryOptions }]
          : tryOnMode === "shoes"
          ? [{ title: "Chaussures de démonstration", data: SHOES_DEMO }]
          : tryOnMode === "clothing"
          ? [{ title: "Vêtements de démonstration", data: CLOTHING_DEMO }]
          : tryOnMode === "accessories"
          ? [{ title: ACCESSORY_TYPES.find(t => t.key === selectedAccessoryType)?.label ?? "Accessoires", data: ACCESSORIES_BY_TYPE[selectedAccessoryType].length > 0 ? ACCESSORIES_BY_TYPE[selectedAccessoryType] : ACCESSORIES_DEMO }]
          : [{ title: "Articles", data: [] as typeof ACCESSORIES_DEMO }]}
        onSelect={handleSelectJewelry}
        onClose={() => setShowJewelryModal(false)}
        imageMode="contain"
        colors={colors}
      />

      {/* ─── Modal Résultat Essayage ─────────────────────────────────────────── */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                ✨ Résultat de l'essayage
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                {selectedJewelry?.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowResultModal(false)}
              style={[styles.closeBtn, { backgroundColor: colors.surface }]}
            >
              <IconSymbol name="xmark" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Layout fixe : carousel en haut, actions en bas */}
          {resultImageUrl ? (
            <View style={{ flex: 1 }}>
              {/* Carousel horizontal plein-écran */}
              {(() => {
                const imgW = SCREEN_WIDTH;
                const imgH = (tryOnMode === "shoes" || tryOnMode === "clothing")
                  ? imgW * (16 / 9)
                  : imgW * (4 / 3);
                const urls = resultImageUrls.length > 0 ? resultImageUrls : (resultImageUrl ? [resultImageUrl] : []);
                return (
                  <View style={{ width: SCREEN_WIDTH, height: imgH, position: "relative" }}>
                    <FlatList
                      data={urls}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      keyExtractor={(_, i) => String(i)}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setSelectedVariantIndex(idx);
                        setResultImageUrl(urls[idx] ?? urls[0]);
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      renderItem={({ item: url }) => (
                        <View style={{ width: SCREEN_WIDTH, height: imgH, overflow: "hidden" }}>
                          <ZoomableImage
                            uri={url}
                            width={imgW}
                            height={imgH}
                            showHint={urls.length === 1}
                            onZoomChange={setIsImageZoomed}
                          />
                        </View>
                      )}
                    />
                    {/* Badge luxe */}
                    <View style={[resultStyles.badge, { backgroundColor: colors.primary, top: 12, left: 12 }]}>
                      <Text style={[resultStyles.badgeText, { color: colors.background }]}>❆ ESSAYAGE IA</Text>
                    </View>
                    {/* Indicateur variante + hint swipe */}
                    {urls.length > 1 && (
                      <View style={{ position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600", letterSpacing: 1 }}>
                          {selectedVariantIndex + 1} / {urls.length}
                        </Text>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>← glisser →</Text>
                      </View>
                    )}
                    {urls.length === 1 && (
                      <View style={{ position: "absolute", bottom: 12, left: "50%", transform: [{ translateX: -60 }], backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 9, letterSpacing: 0.5 }}>PINCEZ · DOUBLE-TAP</Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Actions défilables en bas */}
              <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Infos article */}
                <View style={[resultStyles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[resultStyles.infoLabel, { color: colors.muted }]}>{tryOnMode === "jewelry" ? "BIJOU ESSAYÉ" : tryOnMode === "shoes" ? "CHAUSSURES ESSAYÉES" : tryOnMode === "clothing" ? "VÊTEMENT ESSAYÉ" : "ACCESSOIRE ESSAYÉ"}</Text>
                  <Text style={[resultStyles.infoName, { color: colors.foreground }]}>{selectedJewelry?.label}</Text>
                  <Text style={[resultStyles.infoBrand, { color: colors.primary }]}>MONI'ATTITUDE</Text>
                </View>

                {/* Actions */}
                <View style={resultStyles.actionsGrid}>
                  {/* Sauvegarder dans Mon Écrin */}
                  <TouchableOpacity
                    onPress={async () => {
                      if (isSaved) return;
                      if (!user) {
                        Alert.alert(
                          "Connexion requise",
                          "Connectez-vous pour sauvegarder des bijoux dans Mon Écrin.",
                          [
                            { text: "Annuler", style: "cancel" },
                            { text: "Se connecter", onPress: () => router.push("/login") },
                          ]
                        );
                        return;
                      }
                      try {
                        await addToCollectionMutation.mutateAsync({
                          name: selectedJewelry?.label ?? "Bijou essayé",
                          type: selectedJewelryType,
                          imageUri: resultImageUrl ?? undefined,
                        });
                        setIsSaved(true);
                        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      } catch {
                        Alert.alert("Erreur", "Impossible de sauvegarder dans Mon Écrin.");
                      }
                    }}
                    style={[resultStyles.actionBtn, { backgroundColor: isSaved ? colors.success : colors.foreground }]}
                    activeOpacity={0.85}
                  >
                    <IconSymbol name={isSaved ? "checkmark" : "heart.fill"} size={18} color={colors.background} />
                    <Text style={[resultStyles.actionBtnText, { color: colors.background }]}>
                      {isSaved ? "Sauvegardé" : "Mon Écrin"}
                    </Text>
                  </TouchableOpacity>

                  {/* Partager avec watermark */}
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const shareMessage = `✨ Essayage ${selectedJewelry?.label ?? "bijou"} avec L'Écrin Virtuel\n\nDécouvrez L'Écrin Virtuel — l'app d'essayage IA de bijoux artisanaux MONI'ATTITUDE 💎`;
                        // Sur mobile, partager l'image + message ; sur web, message seul
                        if (resultImageUrl && Platform.OS !== "web") {
                          // Télécharger l'image et la partager via expo-sharing
                          const localUri = FileSystem.documentDirectory + "ecrin_share.jpg";
                          await FileSystem.downloadAsync(resultImageUrl, localUri);
                          const canShare = await Sharing.isAvailableAsync();
                          if (canShare) {
                            await Sharing.shareAsync(localUri, {
                              mimeType: "image/jpeg",
                              dialogTitle: "Partager mon essayage L'Écrin Virtuel",
                            });
                          } else {
                            await Share.share({ message: shareMessage });
                          }
                        } else {
                          await Share.share({
                            message: shareMessage,
                            url: resultImageUrl ?? undefined,
                          });
                        }
                      } catch {}
                    }}
                    style={[resultStyles.actionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    <IconSymbol name="paperplane.fill" size={18} color={colors.foreground} />
                    <Text style={[resultStyles.actionBtnText, { color: colors.foreground }]}>Partager</Text>
                  </TouchableOpacity>
                </View>

                {/* Sauvegarder dans le Dressing */}
                {tryOnMode !== "jewelry" && (
                  <TouchableOpacity
                    onPress={async () => {
                      if (isSaved) return;
                      try {
                        const categoryMap: Record<TryOnMode, string> = {
                          jewelry: "jewelry",
                          shoes: "shoes",
                          clothing: "clothing",
                          accessories: "accessories",
                          outfit: "outfit",
                        };
                        await addToCollectionMutation.mutateAsync({
                          name: selectedJewelry?.label ?? "Article essayé",
                          type: categoryMap[tryOnMode],
                          imageUri: resultImageUrl ?? undefined,
                        });
                        setIsSaved(true);
                        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert("✨ Sauvegardé !", `${selectedJewelry?.label} a été ajouté à votre Dressing.`);
                      } catch {
                        Alert.alert("Erreur", "Impossible de sauvegarder dans le Dressing.");
                      }
                    }}
                    style={[resultStyles.communityBtn, { backgroundColor: isSaved ? colors.success : colors.foreground, borderWidth: 0, marginBottom: 8 }]}
                    activeOpacity={0.85}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {tryOnMode === "shoes" ? "👠" : tryOnMode === "clothing" ? "👗" : "👜"}
                    </Text>
                    <Text style={[resultStyles.communityBtnText, { color: colors.background }]}>
                      {isSaved ? "Sauvegardé dans le Dressing ✓" : `Ajouter au Dressing ${tryOnMode === "shoes" ? "Chaussures" : tryOnMode === "clothing" ? "Vêtements" : "Accessoires"}`}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* Partager en Story Instagram */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (!resultImageUrl) return;
                      if (Platform.OS === "web") {
                        // Sur web : partage simple du lien
                        await Share.share({
                          message: `✦ ÉCRIN VIRTUEL — Mon essayage ${selectedJewelry?.label ?? ""} \n#EcrinVirtuel #AduStyle #MoniAttitude`,
                          url: resultImageUrl,
                        });
                        return;
                      }
                      // Sur mobile : télécharger l'image + ouvrir le menu de partage natif
                      const localUri = FileSystem.cacheDirectory + "ecrin_story.jpg";
                      await FileSystem.downloadAsync(resultImageUrl, localUri);
                      const canShare = await Sharing.isAvailableAsync();
                      if (canShare) {
                        await Sharing.shareAsync(localUri, {
                          mimeType: "image/jpeg",
                          dialogTitle: "Partager en Story Instagram",
                          UTI: "public.jpeg",
                        });
                      }
                    } catch {}
                  }}
                  style={[resultStyles.communityBtn, { backgroundColor: "#000", borderWidth: 0, marginBottom: 8 }]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="square.and.arrow.up" size={16} color="#C9A96E" />
                  <Text style={[resultStyles.communityBtnText, { color: "#C9A96E" }]}>✦ Partager en Story</Text>
                </TouchableOpacity>

                {/* Publier dans la Communauté */}
                <TouchableOpacity
                  onPress={() => {
                    setShowResultModal(false);
                    Alert.alert(
                      "Publier dans la Communauté",
                      "Voulez-vous partager cet essayage avec la communauté L'Écrin Virtuel ?",
                      [
                        { text: "Annuler", style: "cancel" },
                        {
                          text: "Publier",
                          onPress: () => {
                            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Publié !", "Votre essayage a été partagé dans la Communauté.");
                          },
                        },
                      ]
                    );
                  }}
                  style={[resultStyles.communityBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="person.2.fill" size={16} color={colors.primary} />
                  <Text style={[resultStyles.communityBtnText, { color: colors.primary }]}>Publier dans la Communauté</Text>
                </TouchableOpacity>

                {/* Nouvel essayage */}
                <TouchableOpacity
                  onPress={() => {
                    setShowResultModal(false);
                    setResultImageUrl(null);
                    setIsSaved(false);
                  }}
                  style={[resultStyles.newTryBtn, { borderColor: colors.border }]}
                  activeOpacity={0.85}
                >
                  <Text style={[resultStyles.newTryBtnText, { color: colors.muted }]}>Nouvel essayage</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[{ marginTop: 16, color: colors.muted, fontSize: 14 }]}>
                Génération en cours...
              </Text>
            </View>
          )}
        </View>
      </Modal>
      {/* Paywall Modal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchasePremium={subscription.purchasePremiumMonthly}
        onPurchasePremiumPlus={subscription.purchasePremiumYearly}
        onRestore={subscription.restorePurchases}
        featureName={tryOnMode === "outfit" ? "Mode Tenue Complète" : "Essayage IA"}
        freeTriesLeft={subscription.canUseUnlimitedTryOns ? undefined : Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed)}
      />
    </ScreenContainer>
  );
}

// ─── Composant GalleryModal ────────────────────────────────────────────────────
function GalleryModal({
  visible,
  title,
  subtitle,
  sections,
  onSelect,
  onClose,
  imageMode,
  colors,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  sections: { title: string; data: GalleryItem[] }[];
  onSelect: (item: GalleryItem) => void;
  onClose: () => void;
  imageMode: "cover" | "contain";
  colors: ReturnType<typeof useColors>;
}) {
  const ITEM_SIZE = (SCREEN_WIDTH - 48 - 12) / 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header modal */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.muted }]}>{subtitle}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface }]}
          >
            <IconSymbol name="xmark" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Grille par sections avec ScrollView */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
        >
          {sections.map((section) => (
            <View key={section.title} style={{ marginBottom: 20 }}>
              {/* Titre de section */}
              {sections.length > 1 && (
                <Text
                  style={[
                    styles.photoLabel,
                    { color: colors.muted, marginBottom: 10, marginLeft: 4 },
                  ]}
                >
                  {section.title.toUpperCase()}
                </Text>
              )}
              {/* Grille 2 colonnes */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {section.data.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => onSelect(item)}
                    style={[
                      styles.galleryItem,
                      {
                        width: ITEM_SIZE,
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={{ width: ITEM_SIZE, height: ITEM_SIZE }}>
                      <Image
                        source={{ uri: item.uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit={imageMode}
                      />
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
                      <Text
                        style={[styles.galleryLabel, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Header luxe
  luxeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerLine: {
    height: 0.5,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 4,
    lineHeight: 26,
  },
  titleAccent: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 5,
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  photosRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 14,
    marginTop: 4,
  },
  photoCol: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  photoBox: {
    aspectRatio: 3 / 4,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 8,
    letterSpacing: 0.3,
  },
  btnRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  smallBtnText: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  fullBtn: {
    marginTop: 6,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  fullBtnText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  tryOnBtn: {
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  tryOnBtnText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  hintText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.3,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 3,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryItem: {
    overflow: "hidden",
    borderWidth: 1,
  },
  galleryLabel: {
    fontSize: 10,
    fontWeight: "400",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});

const resultStyles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  infoCard: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoName: {
    fontSize: 16,
    fontWeight: "300",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 4,
  },
  infoBrand: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  communityBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  communityBtnText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  newTryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  newTryBtnText: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
