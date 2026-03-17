import React, { useState, useCallback } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const CDN = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";

// ─── Mannequins ────────────────────────────────────────────────────────────────
const MANNEQUIN_SECTIONS = [
  {
    title: "Visages & Oreilles",
    data: [
      { id: "face-1", uri: `${CDN}/AdlrDYXkOyPhDCRC.jpg`, label: "Visage 1" },
      { id: "face-2", uri: `${CDN}/pmqnnFKjXVuQOvRn.jpg`, label: "Visage 2" },
      { id: "face-3", uri: `${CDN}/stRulhTckXsGxDQi.jpg`, label: "Visage 3" },
      { id: "face-4", uri: `${CDN}/aNpFyVQfcOhjIwdS.jpg`, label: "Visage 4" },
      { id: "rousse", uri: `${CDN}/cyJJDUWYzkgzSTbF.jpg`, label: "Modèle Rousse" },
    ],
  },
  {
    title: "Mains",
    data: [
      { id: "hand-1", uri: `${CDN}/btMXmGHNLbTjRmEE.jpg`, label: "Main 1" },
      { id: "hand-2", uri: `${CDN}/jyiRZUGrdRTgSIXJ.jpg`, label: "Main 2" },
      { id: "hand-store", uri: `${CDN}/FpgJONMhzLalyhTi.jpg`, label: "Main 3" },
    ],
  },
  {
    title: "Poignets",
    data: [
      { id: "wrist-1", uri: `${CDN}/xXJqyGvkbrFwBBHV.jpg`, label: "Poignet 1" },
      { id: "wrist-2", uri: `${CDN}/MNVdSmIpPxYSClIs.jpg`, label: "Poignet 2" },
    ],
  },
  {
    title: "Chevilles",
    data: [
      { id: "ankle-1", uri: `${CDN}/OdSiQtPIdenBVntk.jpg`, label: "Cheville 1" },
    ],
  },
  {
    title: "Corps entier",
    data: [
      { id: "femme-jeans", uri: `${CDN}/abbVLmuyWSwhhikh.jpg`, label: "Femme Jeans" },
      { id: "femme-robe", uri: `${CDN}/OxGFokpAzdVyeaCp.jpg`, label: "Femme Robe" },
      { id: "femme-rousse", uri: `${CDN}/JrHRSXiGdwkxFloI.jpg`, label: "Femme Rousse" },
      { id: "femme-short-blonde", uri: `${CDN}/WJYefCuswobmjOFn.jpg`, label: "Femme Short Blonde" },
      { id: "femme-short-brune", uri: `${CDN}/NiGpqbuSbzvVeGpE.jpg`, label: "Femme Short Brune" },
      { id: "homme-sport", uri: `${CDN}/FAAIQjDUYqvqrnSP.jpg`, label: "Homme Sport" },
      { id: "homme-casual", uri: `${CDN}/iEKDtQHwyiIzFBLs.jpg`, label: "Homme Casual" },
      { id: "homme-basket", uri: `${CDN}/uEwQwHLXMbeskowf.jpg`, label: "Homme Basket" },
    ],
  },
];

// ─── Bijoux par type ───────────────────────────────────────────────────────────
const JEWELRY_BY_TYPE: Record<string, { id: string; uri: string; label: string }[]> = {
  earrings: [
    { id: "plume-bleu", uri: `${CDN}/mUaeVRKTyNsSwydj.png`, label: "Plume Bleu" },
    { id: "lapis", uri: `${CDN}/DbsZECnmnScwGXrK.png`, label: "Lapis Lazuli" },
    { id: "rose", uri: `${CDN}/MHrMUbGtWuDsPAWp.png`, label: "Créoles Roses" },
    { id: "terracotta", uri: `${CDN}/QXWjEMeEMxnUaJWM.png`, label: "Terracotta" },
    { id: "lune", uri: `${CDN}/cWuBMzcdacdWSBif.png`, label: "Lune et Étoiles" },
    { id: "vert", uri: `${CDN}/vDUNWJgUqNeqgxuD.png`, label: "Créoles Vertes" },
    { id: "resine-vert", uri: `${CDN}/BQcYjBycBufjuRzd.png`, label: "Résine Verte" },
    { id: "etoile-rose", uri: `${CDN}/lNdRViMTySQvUjlT.png`, label: "Étoile Rose" },
    { id: "orange", uri: `${CDN}/KguAeTqThjCsvecs.png`, label: "Arches Orange" },
    { id: "violet", uri: `${CDN}/gvMlujGZrGdQxNrU.png`, label: "Pointe Violette" },
    { id: "bleu-clair", uri: `${CDN}/YIEQPKPDArbEBfgo.png`, label: "Géométrique Bleu" },
    { id: "geometrique", uri: `${CDN}/mEFFJpvLNjtkSKFp.png`, label: "Géométrique Or" },
    { id: "creole-orange", uri: `${CDN}/ksjchgAauBTgoIRP.png`, label: "Créoles Orange" },
    { id: "etoile-blanc", uri: `${CDN}/NHrMayoaxkGwRAzw.png`, label: "Étoile Blanc" },
    { id: "cuir-rose", uri: `${CDN}/iXSRVmYBQKSVkIgb.png`, label: "Cuir Rose" },
    { id: "fleur-vie", uri: `${CDN}/mKMdkYLxQkBcagIz.png`, label: "Fleur de Vie" },
    { id: "eventail", uri: `${CDN}/CSMPqWqsSMHWRAJD.png`, label: "Éventail Or" },
    { id: "rectangle", uri: `${CDN}/ywEJZiJNFCWSyekZ.png`, label: "Rectangle Cuivre" },
    { id: "noir-or", uri: `${CDN}/vqeMhpwfZUJaaVDJ.png`, label: "Noir et Or" },
    { id: "moniattitude-1", uri: `${CDN}/StedFUyGMBUqcAEe.png`, label: "Moni'Attitude" },
  ],
  necklace: [
    { id: "necklace-1", uri: `${CDN}/pIwhbFaxajqlBLDM.jpg`, label: "Collier 1" },
    { id: "moni-necklace", uri: `${CDN}/jGuXuEkhGyksTrjf.png`, label: "Moni'Attitude Collier" },
  ],
  bracelet: [
    { id: "bracelet-1", uri: `${CDN}/UpdTPopWOOkisAfZ.jpg`, label: "Bracelet 1" },
    { id: "bracelet-2", uri: `${CDN}/LRXLSFlVyKYRjWpN.jpg`, label: "Bracelet 2" },
    { id: "bracelet-3", uri: `${CDN}/cShFnzrgsYCAyoJP.jpg`, label: "Bracelet 3" },
    { id: "moni-bracelet-bleu", uri: `${CDN}/YtSJSMdauwcduZlE.png`, label: "Bracelet Bleu Étoile" },
    { id: "moni-bracelet-set", uri: `${CDN}/QFSIpqZaBEqDrjMr.png`, label: "Bracelet Moni'Attitude" },
  ],
  ring: [
    { id: "ring-luxury", uri: `${CDN}/bpNfAkbDYoWBSChW.jpg`, label: "Bague Luxe" },
  ],
  anklet: [
    { id: "anklet-silver", uri: `${CDN}/QGrKcPORwuBopwXN.jpg`, label: "Chaîne Argent" },
    { id: "anklet-gold", uri: `${CDN}/JCdnbNtrgayfIQha.jpg`, label: "Or Pierres Précieuses" },
  ],
  set: [
    { id: "jewelry-set", uri: `${CDN}/QruapqyLkIGpMclo.jpg`, label: "Parure Or" },
    { id: "moni-set", uri: `${CDN}/hjdHxGFegLggYIVj.png`, label: "Moni'Attitude Set" },
    { id: "moni-bracelet-set", uri: `${CDN}/QFSIpqZaBEqDrjMr.png`, label: "Set Bracelets" },
  ],
};

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

export default function TryOnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedJewelryType, setSelectedJewelryType] = useState<JewelryTypeKey>("earrings");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedJewelry, setSelectedJewelry] = useState<GalleryItem | null>(null);
  const [showMannequinModal, setShowMannequinModal] = useState(false);
  const [showJewelryModal, setShowJewelryModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const tryOnMutation = trpc.virtualTryOn.generate.useMutation();

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
      const result = await tryOnMutation.mutateAsync({
        modelImageUrl: userPhoto,
        jewelryImageUrl: selectedJewelry.uri,
        jewelryType: selectedJewelryType,
        jewelryName: selectedJewelry.label,
      });
      setResultImageUrl(result.resultImageUrl ?? null);
      setShowResultModal(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      Alert.alert("Erreur", `L'essayage a échoué : ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const canTryOn = !!userPhoto && !!selectedJewelry && !isProcessing;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Essayage Virtuel</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Visualisez un bijou sur vous avant d'acheter
          </Text>
        </View>

        {/* Sélecteur de type de bijou */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
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
                    borderColor: isSelected ? colors.foreground : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: isSelected ? colors.background : colors.foreground },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

          {/* ── Le bijou ── */}
          <View style={styles.photoCol}>
            <Text style={[styles.photoLabel, { color: colors.muted }]}>
              {currentType.label.toUpperCase()}
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
                Galerie Bijoux
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
                  Traitement en cours...
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
                  Essayer ce bijou
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!canTryOn && !isProcessing && (
            <Text style={[styles.hintText, { color: colors.muted }]}>
              {!userPhoto
                ? "Sélectionnez d'abord votre photo ou un mannequin"
                : "Sélectionnez ensuite un bijou à essayer"}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* ─── Modal Mannequins ─────────────────────────────────────────────────── */}
      <GalleryModal
        visible={showMannequinModal}
        title="Galerie Mannequins"
        subtitle="Choisissez votre photo ou un mannequin"
        sections={MANNEQUIN_SECTIONS}
        onSelect={handleSelectMannequin}
        onClose={() => setShowMannequinModal(false)}
        imageMode="cover"
        colors={colors}
      />

      {/* ─── Modal Bijoux ─────────────────────────────────────────────────────── */}
      <GalleryModal
        visible={showJewelryModal}
        title={`Galerie — ${currentType.label}`}
        subtitle="Sélectionnez un bijou à essayer"
        sections={[{ title: currentType.label, data: jewelryOptions }]}
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

          <ScrollView
            contentContainerStyle={{ padding: 16, alignItems: "center", paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {resultImageUrl ? (
              <>
                <Image
                  source={{ uri: resultImageUrl }}
                  style={{
                    width: "100%",
                    aspectRatio: 3 / 4,
                    borderRadius: 20,
                    marginBottom: 16,
                  }}
                  contentFit="cover"
                />
                <Text style={[{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 20 }]}>
                  Voici comment le bijou vous irait. Appuyez sur "Nouvel essayage" pour en essayer un autre.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowResultModal(false);
                    setResultImageUrl(null);
                  }}
                  style={[styles.tryOnBtn, { backgroundColor: colors.foreground, width: "100%" }]}
                >
                  <IconSymbol name="sparkles" size={18} color={colors.background} />
                  <Text style={[styles.tryOnBtnText, { color: colors.background }]}>
                    Nouvel essayage
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[{ marginTop: 16, color: colors.muted, fontSize: 14 }]}>
                  Génération en cours...
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  const allItems = sections.flatMap(s => s.data);
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

        {/* Grille */}
        <FlatList
          data={allItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, paddingBottom: 40, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
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
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  photosRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 4,
  },
  photoCol: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  photoBox: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 11,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  btnRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  fullBtn: {
    marginTop: 6,
    paddingVertical: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  fullBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  selectedLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },
  tryOnBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tryOnBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  hintText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryItem: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  galleryLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
