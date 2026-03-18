/**
 * OutfitBuilder — Mode Tenue Complète
 *
 * Permet de sélectionner jusqu'à 10 articles simultanément :
 * T-shirt, Veste, Pantalon, Boucles d'oreilles, Collier, Bracelet, Bague,
 * Accessoire 1, Accessoire 2, Chaussures
 * puis de les essayer tous en une seule génération IA.
 */
import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────
type GalleryItem = { id: string; uri: string; label: string };

type OutfitSlotKey =
  | "tshirt" | "jacket" | "pants"
  | "earrings" | "necklace" | "bracelet" | "ring"
  | "accessory1" | "accessory2"
  | "shoes";

type OutfitSlot = {
  key: OutfitSlotKey;
  label: string;
  emoji: string;
  category: "clothing" | "jewelry" | "accessories" | "shoes";
  gallery: GalleryItem[];
};

// ─── CDN ──────────────────────────────────────────────────────────────────────
const CDN = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";

// ─── Galeries par slot ────────────────────────────────────────────────────────
const OUTFIT_SLOTS: OutfitSlot[] = [
  {
    key: "tshirt",
    label: "T-shirt / Top",
    emoji: "👕",
    category: "clothing",
    gallery: [
      { id: "blouse-ivory", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_blouse_ivory-FqFvVqikVUAH8cJaGp8y2Q.png", label: "Chemisier Ivoire" },
    ],
  },
  {
    key: "jacket",
    label: "Veste / Blazer",
    emoji: "🧥",
    category: "clothing",
    gallery: [
      { id: "blazer-camel", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_blazer_camel-auFvdrjD8tJ3RwphvuczjX.png", label: "Blazer Camel" },
    ],
  },
  {
    key: "pants",
    label: "Pantalon / Jupe",
    emoji: "👖",
    category: "clothing",
    gallery: [
      { id: "pants-navy", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_pants_navy-mtvRm4h698yNo9YWgMgVkq.png", label: "Pantalon Marine" },
      { id: "dress-black", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_dress_black-C4XiYtX54R2EZijznwBAsb.png", label: "Robe Noire" },
    ],
  },
  {
    key: "earrings",
    label: "Boucles d'oreilles",
    emoji: "💎",
    category: "jewelry",
    gallery: [
      { id: "plume-bleu", uri: `${CDN}/mUaeVRKTyNsSwydj.png`, label: "Plume Bleu" },
      { id: "lapis", uri: `${CDN}/DbsZECnmnScwGXrK.png`, label: "Lapis Lazuli" },
      { id: "rose", uri: `${CDN}/MHrMUbGtWuDsPAWp.png`, label: "Créoles Roses" },
      { id: "lune", uri: `${CDN}/cWuBMzcdacdWSBif.png`, label: "Lune et Étoiles" },
      { id: "moniattitude-1", uri: `${CDN}/StedFUyGMBUqcAEe.png`, label: "Moni'Attitude" },
      { id: "etoile-rose", uri: `${CDN}/lNdRViMTySQvUjlT.png`, label: "Étoile Rose" },
      { id: "noir-or", uri: `${CDN}/vqeMhpwfZUJaaVDJ.png`, label: "Noir et Or" },
      { id: "geometrique", uri: `${CDN}/mEFFJpvLNjtkSKFp.png`, label: "Géométrique Or" },
    ],
  },
  {
    key: "necklace",
    label: "Collier",
    emoji: "📿",
    category: "jewelry",
    gallery: [
      { id: "necklace-1", uri: `${CDN}/pIwhbFaxajqlBLDM.jpg`, label: "Collier 1" },
      { id: "moni-necklace", uri: `${CDN}/jGuXuEkhGyksTrjf.png`, label: "Moni'Attitude Collier" },
    ],
  },
  {
    key: "bracelet",
    label: "Bracelet",
    emoji: "⌚",
    category: "jewelry",
    gallery: [
      { id: "bracelet-1", uri: `${CDN}/UpdTPopWOOkisAfZ.jpg`, label: "Bracelet 1" },
      { id: "bracelet-2", uri: `${CDN}/LRXLSFlVyKYRjWpN.jpg`, label: "Bracelet 2" },
      { id: "moni-bracelet-bleu", uri: `${CDN}/YtSJSMdauwcduZlE.png`, label: "Bracelet Bleu Étoile" },
      { id: "moni-bracelet-set", uri: `${CDN}/QFSIpqZaBEqDrjMr.png`, label: "Bracelet Moni'Attitude" },
    ],
  },
  {
    key: "ring",
    label: "Bague",
    emoji: "💍",
    category: "jewelry",
    gallery: [
      { id: "ring-luxury", uri: `${CDN}/bpNfAkbDYoWBSChW.jpg`, label: "Bague Luxe" },
    ],
  },
  {
    key: "accessory1",
    label: "Accessoire 1",
    emoji: "👜",
    category: "accessories",
    gallery: [
      { id: "bag-black", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_bag_black-gMLsmwChKXggLLiGyaLkMb.png", label: "Sac à Main Noir" },
      { id: "belt-gold", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_belt_gold-Dk95mij6htDppq7nu96YMr.png", label: "Ceinture Dorée" },
      { id: "sunglasses-black", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_sunglasses_black-GND6LDni5Tdui7goSAgoGZ.png", label: "Lunettes Cat-Eye" },
      { id: "scarf-beige", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_scarf_beige-ntRsXz97J7pnhvggCL3sN7.png", label: "Écharpe Beige" },
    ],
  },
  {
    key: "accessory2",
    label: "Accessoire 2",
    emoji: "🧣",
    category: "accessories",
    gallery: [
      { id: "bag-black", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_bag_black-gMLsmwChKXggLLiGyaLkMb.png", label: "Sac à Main Noir" },
      { id: "belt-gold", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_belt_gold-Dk95mij6htDppq7nu96YMr.png", label: "Ceinture Dorée" },
      { id: "sunglasses-black", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_sunglasses_black-GND6LDni5Tdui7goSAgoGZ.png", label: "Lunettes Cat-Eye" },
      { id: "scarf-beige", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_scarf_beige-ntRsXz97J7pnhvggCL3sN7.png", label: "Écharpe Beige" },
    ],
  },
  {
    key: "shoes",
    label: "Chaussures",
    emoji: "👠",
    category: "shoes",
    gallery: [
      { id: "heels-gold", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_heels_gold-5ktPRGoZ7VXeYgEdLP5D3k.png", label: "Escarpins Dorés" },
      { id: "sneakers-white", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_sneakers_white-TcUCe77Tti8vbH2Tg2aasU.png", label: "Sneakers Blancs" },
      { id: "boots-black", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_boots_black-h7zsKaSzi9qv5jNSQAHbHy.png", label: "Bottines Noires" },
      { id: "sandals-nude", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_sandals_nude-A8rHiR6HNekahFBBff3Anu.png", label: "Sandales Nude" },
    ],
  },
];

// ─── Mannequins corps entier ──────────────────────────────────────────────────
const OUTFIT_MANNEQUINS: GalleryItem[] = [
  { id: "femme-svelte", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_1-NMjfajcjDr3xKvyP6m8ScU.png", label: "Femme Svelte" },
  { id: "femme-casual", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_2-ifFLrH5RK6PFETN24qS4uU.png", label: "Femme Casual" },
  { id: "femme-ronde", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_3-eksVcWTy4WsdKFxTB58UqB.png", label: "Femme Ronde" },
  { id: "homme-classique", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_4-jHS97Wxe3UQjYC29y7TTqj.png", label: "Homme Classique" },
  { id: "femme-elancee", uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_5-42iLYadbUPkEQthn5qZ2KU.png", label: "Femme Élancée" },
  { id: "femme-jeans", uri: `${CDN}/abbVLmuyWSwhhikh.jpg`, label: "Femme Jeans" },
  { id: "femme-robe", uri: `${CDN}/OxGFokpAzdVyeaCp.jpg`, label: "Femme Robe" },
  { id: "homme-casual", uri: `${CDN}/iEKDtQHwyiIzFBLs.jpg`, label: "Homme Casual" },
];

const POSE_OPTIONS = [
  { key: "front" as const, label: "Face" },
  { key: "side" as const, label: "Profil" },
  { key: "walking" as const, label: "Marche" },
  { key: "back" as const, label: "Dos" },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export function OutfitBuilder() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();

  // Photo du modèle
  const [modelPhoto, setModelPhoto] = useState<string | null>(null);
  // Slots sélectionnés
  const [slots, setSlots] = useState<Partial<Record<OutfitSlotKey, GalleryItem>>>({});
  // Slot en cours de sélection (pour le modal de galerie)
  const [activeSlot, setActiveSlot] = useState<OutfitSlotKey | null>(null);
  // Pose
  const [selectedPose, setSelectedPose] = useState<"front" | "side" | "walking" | "back">("front");
  // Variantes
  const [numSamples, setNumSamples] = useState<1 | 2 | 4>(1);
  // Traitement
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Résultat
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [currentVariant, setCurrentVariant] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  // Modal mannequin
  const [showMannequinModal, setShowMannequinModal] = useState(false);

  const uploadImageMutation = trpc.ai.uploadImage.useMutation();
  const outfitMutation = trpc.virtualTryOn.outfit.useMutation();
  const createLookMutation = trpc.looks.create.useMutation();
  const [isSaving, setIsSaving] = useState(false);
  const [savedLookId, setSavedLookId] = useState<number | null>(null);

  const PROGRESS_STEPS = [
    "Analyse de la tenue…",
    "Détection du corps…",
    "Application des vêtements…",
    "Ajout des bijoux et accessoires…",
    "Finalisation du look…",
  ];

  const selectedCount = Object.keys(slots).length;
  const canGenerate = !!modelPhoto && selectedCount > 0 && !isProcessing;

  const ensurePublicUrl = async (uri: string): Promise<string> => {
    if (uri.startsWith("http://") || uri.startsWith("https://")) return uri;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const result = await uploadImageMutation.mutateAsync({ base64Data: base64, mimeType: "image/jpeg" });
    return result.url;
  };

  const handlePickPhoto = async () => {
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
      setModelPhoto(result.assets[0].uri);
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
      setModelPhoto(result.assets[0].uri);
    }
  };

  const handleSelectItem = useCallback((item: GalleryItem) => {
    if (!activeSlot) return;
    setSlots(prev => ({ ...prev, [activeSlot]: item }));
    setActiveSlot(null);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeSlot]);

  const handleRemoveSlot = useCallback((key: OutfitSlotKey) => {
    setSlots(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleGenerate = async () => {
    if (!modelPhoto || selectedCount === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    setProgressStep(0);
    progressAnim.setValue(0);

    // Animate progress bar
    Animated.timing(progressAnim, { toValue: 0.9, duration: 15000, useNativeDriver: false }).start();
    const stepInterval = setInterval(() => {
      setProgressStep(prev => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 3000);

    try {
      const publicModelUrl = await ensurePublicUrl(modelPhoto);

      // Préparer les URLs publiques pour chaque slot sélectionné
      const slotUrls: Partial<Record<OutfitSlotKey, string>> = {};
      for (const [key, item] of Object.entries(slots)) {
        if (item) {
          slotUrls[key as OutfitSlotKey] = await ensurePublicUrl(item.uri);
        }
      }

      const result = await outfitMutation.mutateAsync({
        modelImageUrl: publicModelUrl,
        tshirtImageUrl: slotUrls.tshirt,
        jacketImageUrl: slotUrls.jacket,
        pantsImageUrl: slotUrls.pants,
        earringsImageUrl: slotUrls.earrings,
        necklaceImageUrl: slotUrls.necklace,
        braceletImageUrl: slotUrls.bracelet,
        ringImageUrl: slotUrls.ring,
        accessory1ImageUrl: slotUrls.accessory1,
        accessory2ImageUrl: slotUrls.accessory2,
        shoesImageUrl: slotUrls.shoes,
        tshirtName: slots.tshirt?.label,
        jacketName: slots.jacket?.label,
        pantsName: slots.pants?.label,
        earringsName: slots.earrings?.label,
        necklaceName: slots.necklace?.label,
        braceletName: slots.bracelet?.label,
        ringName: slots.ring?.label,
        accessory1Name: slots.accessory1?.label,
        accessory2Name: slots.accessory2?.label,
        shoesName: slots.shoes?.label,
        pose: selectedPose,
        numSamples,
      });

      clearInterval(stepInterval);
      Animated.timing(progressAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();

      const urls = result.resultImageUrls ?? (result.resultImageUrl ? [result.resultImageUrl] : []);
      setResultUrls(urls);
      setCurrentVariant(0);
      setShowResult(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Sauvegarder dans l'historique
      try {
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        const historyKey = "tryon_history";
        const existing = await AsyncStorage.getItem(historyKey);
        const history = existing ? JSON.parse(existing) : [];
        const itemNames = Object.values(slots).map(s => s?.label).filter(Boolean).join(", ");
        history.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          category: "outfit",
          itemName: `Tenue : ${itemNames}`,
          resultImageUrl: urls[0] ?? "",
          modelImageUrl: publicModelUrl,
          itemImageUrl: urls[0] ?? "",
        });
        await AsyncStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50)));
      } catch {}
    } catch (err: unknown) {
      clearInterval(stepInterval);
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      Alert.alert("Erreur", `La génération a échoué : ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Rendu du slot ────────────────────────────────────────────────────────
  const renderSlot = (slot: OutfitSlot) => {
    const selected = slots[slot.key];
    return (
      <View key={slot.key} style={styles.slotContainer}>
        <TouchableOpacity
          onPress={() => setActiveSlot(slot.key)}
          style={[
            styles.slotBox,
            {
              backgroundColor: colors.surface,
              borderColor: selected ? colors.primary : colors.border,
              borderWidth: selected ? 2 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          {selected ? (
            <>
              <Image
                source={{ uri: selected.uri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="contain"
              />
              {/* Bouton supprimer */}
              <TouchableOpacity
                onPress={() => handleRemoveSlot(slot.key)}
                style={[styles.removeBtn, { backgroundColor: colors.foreground }]}
              >
                <Text style={{ color: colors.background, fontSize: 10, fontWeight: "700" }}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.slotEmpty}>
              <Text style={{ fontSize: 22 }}>{slot.emoji}</Text>
              <Text style={[styles.slotEmptyText, { color: colors.muted }]}>+</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.slotLabel, { color: selected ? colors.primary : colors.muted }]} numberOfLines={1}>
          {selected ? selected.label : slot.label}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 16 }}
      >
        {/* Photo du modèle */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>VOTRE PHOTO</Text>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <TouchableOpacity
              onPress={() => setShowMannequinModal(true)}
              style={[
                styles.modelPhotoBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: modelPhoto ? colors.primary : colors.border,
                  borderWidth: modelPhoto ? 2 : 1,
                },
              ]}
              activeOpacity={0.85}
            >
              {modelPhoto ? (
                <Image source={{ uri: modelPhoto }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              ) : (
                <View style={styles.slotEmpty}>
                  <Text style={{ fontSize: 28 }}>👤</Text>
                  <Text style={[styles.slotEmptyText, { color: colors.muted, fontSize: 10 }]}>Choisir</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1, gap: 8 }}>
              <TouchableOpacity
                onPress={handleTakePhoto}
                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 14 }}>📷</Text>
                <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 14 }}>🖼️</Text>
                <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Depuis la galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowMannequinModal(true)}
                style={[styles.photoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ fontSize: 14 }}>👗</Text>
                <Text style={[styles.photoBtnText, { color: colors.foreground }]}>Galerie mannequins</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Grille des slots — Vêtements */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>VÊTEMENTS</Text>
        <View style={styles.slotsGrid}>
          {OUTFIT_SLOTS.filter(s => s.category === "clothing").map(renderSlot)}
        </View>

        {/* Grille des slots — Bijoux */}
        <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: 16 }]}>BIJOUX</Text>
        <View style={styles.slotsGrid}>
          {OUTFIT_SLOTS.filter(s => s.category === "jewelry").map(renderSlot)}
        </View>

        {/* Grille des slots — Accessoires & Chaussures */}
        <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: 16 }]}>ACCESSOIRES & CHAUSSURES</Text>
        <View style={styles.slotsGrid}>
          {OUTFIT_SLOTS.filter(s => s.category === "accessories" || s.category === "shoes").map(renderSlot)}
        </View>

        {/* Sélecteur de pose */}
        <View style={{ marginTop: 16, marginBottom: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>POSE</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {POSE_OPTIONS.map(pose => {
              const isSelected = selectedPose === pose.key;
              return (
                <TouchableOpacity
                  key={pose.key}
                  onPress={() => {
                    setSelectedPose(pose.key);
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={[
                    styles.poseChip,
                    {
                      flex: 1,
                      backgroundColor: isSelected ? colors.foreground : "transparent",
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.poseChipText, { color: isSelected ? colors.background : colors.muted }]}>
                    {pose.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sélecteur de variantes */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>VARIANTES</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([1, 2, 4] as const).map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => {
                  setNumSamples(n);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.poseChip,
                  {
                    paddingHorizontal: 20,
                    backgroundColor: numSamples === n ? colors.foreground : "transparent",
                    borderColor: numSamples === n ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.poseChipText, { color: numSamples === n ? colors.background : colors.muted }]}>
                  {n === 1 ? "1 image" : `${n} images`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Résumé des articles sélectionnés */}
        {selectedCount > 0 && (
          <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              ✨ {selectedCount} article{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
            </Text>
            <Text style={[styles.summaryItems, { color: colors.muted }]}>
              {Object.entries(slots).map(([, item]) => item?.label).filter(Boolean).join(" · ")}
            </Text>
          </View>
        )}

        {/* Bouton Générer */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={!canGenerate}
          style={[
            styles.generateBtn,
            {
              backgroundColor: canGenerate ? colors.foreground : colors.border,
              opacity: canGenerate ? 1 : 0.6,
            },
          ]}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color={colors.background} />
              <Text style={[styles.generateBtnText, { color: colors.background }]}>
                {PROGRESS_STEPS[progressStep]}
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 18 }}>✨</Text>
              <Text style={[styles.generateBtnText, { color: canGenerate ? colors.background : colors.muted }]}>
                ESSAYER LA TENUE COMPLÈTE
              </Text>
            </>
          )}
        </TouchableOpacity>

        {isProcessing && (
          <View style={{ marginTop: 12 }}>
            <View style={{ height: 2, backgroundColor: colors.border, borderRadius: 1, overflow: "hidden" }}>
              <Animated.View
                style={{
                  height: 2,
                  backgroundColor: colors.primary,
                  borderRadius: 1,
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                }}
              />
            </View>
            <Text style={{ color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 6, letterSpacing: 0.5 }}>
              Nano Banana 2 compose votre tenue…
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Modal galerie pour sélectionner un article ── */}
      <Modal
        visible={activeSlot !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setActiveSlot(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {activeSlot ? OUTFIT_SLOTS.find(s => s.key === activeSlot)?.label ?? "Choisir un article" : ""}
            </Text>
            <TouchableOpacity onPress={() => setActiveSlot(null)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.foreground, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={activeSlot ? OUTFIT_SLOTS.find(s => s.key === activeSlot)?.gallery ?? [] : []}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            columnWrapperStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectItem(item)}
                style={[styles.galleryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.uri }} style={{ width: "100%", height: 100 }} contentFit="contain" />
                <Text style={[styles.galleryLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
                <Text style={[{ color: colors.muted, textAlign: "center", fontSize: 13 }]}>
                  Aucun article disponible.{"\n"}Utilisez votre galerie photo pour en ajouter.
                </Text>
              </View>
            }
          />
          {/* Bouton pour choisir depuis la galerie photo */}
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TouchableOpacity
              onPress={async () => {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") return;
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ["images"],
                  allowsEditing: true,
                  quality: 0.8,
                });
                if (!result.canceled && result.assets[0] && activeSlot) {
                  handleSelectItem({ id: "custom-" + Date.now(), uri: result.assets[0].uri, label: "Mon article" });
                }
              }}
              style={[styles.photoBtn, { backgroundColor: colors.foreground, borderColor: colors.foreground, justifyContent: "center" }]}
            >
              <Text style={{ fontSize: 14 }}>🖼️</Text>
              <Text style={[styles.photoBtnText, { color: colors.background }]}>Choisir depuis ma galerie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal mannequins ── */}
      <Modal
        visible={showMannequinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMannequinModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Choisir un mannequin</Text>
            <TouchableOpacity onPress={() => setShowMannequinModal(false)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.foreground, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={OUTFIT_MANNEQUINS}
            keyExtractor={item => item.id}
            numColumns={3}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            columnWrapperStyle={{ gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setModelPhoto(item.uri);
                  setShowMannequinModal(false);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.galleryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <Image source={{ uri: item.uri }} style={{ width: "100%", height: 100 }} contentFit="cover" />
                <Text style={[styles.galleryLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* ── Modal résultat ── */}
      <Modal
        visible={showResult}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowResult(false)}
      >
        <View style={[styles.resultContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.resultHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
            <View>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>✨ TENUE COMPLÈTE</Text>
              <Text style={[styles.resultSubtitle, { color: colors.muted }]}>
                {Object.values(slots).map(s => s?.label).filter(Boolean).slice(0, 3).join(" · ")}
                {selectedCount > 3 ? ` +${selectedCount - 3}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowResult(false)} style={[styles.closeBtn, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.foreground, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Image principale avec carousel */}
          <View style={{ flex: 1 }}>
            <FlatList
              data={resultUrls}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={!isImageZoomed}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setCurrentVariant(idx);
              }}
              renderItem={({ item }) => (
                <View style={{ width: Dimensions.get("window").width, flex: 1 }}>
                  <ZoomableImage
                    uri={item}
                    width={Dimensions.get("window").width}
                    height={Dimensions.get("window").height * 0.7}
                    onZoomChange={setIsImageZoomed}
                  />
                </View>
              )}
            />
            {/* Indicateur de variante */}
            {resultUrls.length > 1 && (
              <View style={[styles.variantIndicator, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
                <Text style={{ color: "#fff", fontSize: 12 }}>
                  {currentVariant + 1}/{resultUrls.length} {!isImageZoomed ? "← glisser →" : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={[styles.resultActions, { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity
              onPress={() => {
                setShowResult(false);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowResult(false);
                setTimeout(() => handleGenerate(), 300);
              }}
              style={[styles.actionBtn, { backgroundColor: colors.foreground, borderColor: colors.foreground }]}
            >
              <Text style={[styles.actionBtnText, { color: colors.background }]}>✨ Régénérer</Text>
            </TouchableOpacity>
          </View>

          {/* Bouton Sauvegarder dans Mes Looks */}
          <View style={[styles.saveLookContainer, { borderTopColor: colors.border, paddingBottom: insets.bottom + 4 }]}>
            {savedLookId ? (
              <TouchableOpacity
                onPress={() => {
                  setShowResult(false);
                  router.push("/my-looks");
                }}
                style={[styles.saveLookBtn, { backgroundColor: colors.success + "22", borderColor: colors.success }]}
              >
                <Text style={[styles.saveLookBtnText, { color: colors.success }]}>✓ Sauvegardé — Voir dans Mes Looks</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  if (!user) {
                    Alert.alert("Connexion requise", "Connectez-vous pour sauvegarder vos looks.");
                    return;
                  }
                  if (isSaving) return;
                  setIsSaving(true);
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  try {
                    const slotLabels = Object.entries(slots)
                      .map(([key, item]) => {
                        const slot = OUTFIT_SLOTS.find(s => s.key === key);
                        return slot ? `${slot.emoji} ${item?.label ?? slot.label}` : null;
                      })
                      .filter(Boolean)
                      .join(", ");
                    const lookName = `Tenue du ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
                    const result = await createLookMutation.mutateAsync({
                      name: lookName,
                      description: slotLabels || undefined,
                      previewImageUrl: resultUrls[currentVariant] || resultUrls[0],
                      isAiGenerated: true,
                    });
                    setSavedLookId(result?.id ?? null);
                    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (e) {
                    Alert.alert("Erreur", "Impossible de sauvegarder le look.");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                style={[styles.saveLookBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.saveLookBtnText, { color: colors.primary }]}>♦ Sauvegarder dans Mes Looks</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotContainer: {
    width: "30%",
    alignItems: "center",
  },
  slotBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  slotEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  slotEmptyText: {
    fontSize: 18,
    fontWeight: "300",
  },
  slotLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
    marginTop: 4,
    width: "100%",
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  modelPhotoBox: {
    width: 100,
    height: 130,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  photoBtnText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  poseChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  poseChipText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  summaryBox: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryItems: {
    fontSize: 11,
    lineHeight: 16,
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 4,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryItem: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    paddingBottom: 6,
  },
  galleryLabel: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 4,
    marginTop: 4,
    fontWeight: "600",
  },
  // Résultat
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  resultSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  variantIndicator: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  saveLookContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  saveLookBtn: {
    paddingVertical: 13,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveLookBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
