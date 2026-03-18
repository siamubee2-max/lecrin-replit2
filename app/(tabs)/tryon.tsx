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
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

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

// ─── Mannequins Chaussures ─────────────────────────────────────────────────────
const SHOES_MANNEQUIN_SECTIONS = [
  {
    title: "Pieds & Jambes",
    data: [
      { id: "ankle-1", uri: `${CDN}/OdSiQtPIdenBVntk.jpg`, label: "Cheville 1" },
      { id: "hand-1", uri: `${CDN}/btMXmGHNLbTjRmEE.jpg`, label: "Pied 1" },
      { id: "hand-2", uri: `${CDN}/jyiRZUGrdRTgSIXJ.jpg`, label: "Pied 2" },
    ],
  },
  {
    title: "Corps entier",
    data: [
      { id: "femme-jeans", uri: `${CDN}/abbVLmuyWSwhhikh.jpg`, label: "Femme Jeans" },
      { id: "femme-robe", uri: `${CDN}/OxGFokpAzdVyeaCp.jpg`, label: "Femme Robe" },
      { id: "homme-casual", uri: `${CDN}/iEKDtQHwyiIzFBLs.jpg`, label: "Homme Casual" },
      { id: "homme-basket", uri: `${CDN}/uEwQwHLXMbeskowf.jpg`, label: "Homme Basket" },
    ],
  },
];

// ─── Mannequins Vêtements ──────────────────────────────────────────────────────
const CLOTHING_MANNEQUIN_SECTIONS = [
  {
    title: "Mannequins Professionnels",
    data: [
      {
        id: "femme-beige",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_1-NMjfajcjDr3xKvyP6m8ScU.png",
        label: "Femme Svelte",
      },
      {
        id: "femme-noir",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_2-ifFLrH5RK6PFETN24qS4uU.png",
        label: "Femme Casual",
      },
      {
        id: "femme-ronde",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_3-eksVcWTy4WsdKFxTB58UqB.png",
        label: "Femme Ronde",
      },
      {
        id: "homme-classique",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_4-jHS97Wxe3UQjYC29y7TTqj.png",
        label: "Homme Classique",
      },
      {
        id: "femme-peau-foncee",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_5-42iLYadbUPkEQthn5qZ2KU.png",
        label: "Femme Élancée",
      },
    ],
  },
];

// ─── Chaussures de démonstration ─────────────────────────────────────────────
const SHOES_DEMO = [
  {
    id: "heels-gold",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_heels_gold-5ktPRGoZ7VXeYgEdLP5D3k.png",
    label: "Escarpins Dorés",
    brand: "L'Écrin",
  },
  {
    id: "sneakers-white",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_sneakers_white-TcUCe77Tti8vbH2Tg2aasU.png",
    label: "Sneakers Blancs",
    brand: "L'Écrin",
  },
  {
    id: "boots-black",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_boots_black-h7zsKaSzi9qv5jNSQAHbHy.png",
    label: "Bottines Noires",
    brand: "L'Écrin",
  },
  {
    id: "sandals-nude",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_sandals_nude-A8rHiR6HNekahFBBff3Anu.png",
    label: "Sandales Nude",
    brand: "L'Écrin",
  },
];

// ─── Vêtements de démonstration ─────────────────────────────────────────────
const CLOTHING_DEMO = [
  {
    id: "dress-black",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_dress_black-C4XiYtX54R2EZijznwBAsb.png",
    label: "Robe Noire",
    brand: "L'Écrin",
  },
  {
    id: "blazer-camel",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_blazer_camel-auFvdrjD8tJ3RwphvuczjX.png",
    label: "Blazer Camel",
    brand: "L'Écrin",
  },
  {
    id: "blouse-ivory",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_blouse_ivory-FqFvVqikVUAH8cJaGp8y2Q.png",
    label: "Chemisier Ivoire",
    brand: "L'Écrin",
  },
  {
    id: "pants-navy",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_pants_navy-mtvRm4h698yNo9YWgMgVkq.png",
    label: "Pantalon Marine",
    brand: "L'Écrin",
  },
];
// ─── Accessoires de démonstration ─────────────────────────────────────────
const ACCESSORIES_DEMO = [
  {
    id: "bag-black",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_bag_black-gMLsmwChKXggLLiGyaLkMb.png",
    label: "Sac à Main Noir",
    brand: "L'Écrin",
  },
  {
    id: "belt-gold",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_belt_gold-Dk95mij6htDppq7nu96YMr.png",
    label: "Ceinture Dorée",
    brand: "L'Écrin",
  },
  {
    id: "sunglasses-black",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_sunglasses_black-GND6LDni5Tdui7goSAgoGZ.png",
    label: "Lunettes Cat-Eye",
    brand: "L'Écrin",
  },
  {
    id: "scarf-beige",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_scarf_beige-ntRsXz97J7pnhvggCL3sN7.png",
    label: "Écharpe Beige",
    brand: "L'Écrin",
  },
];
type TryOnMode = "jewelry" | "shoes" | "clothing" | "accessories";
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
  hat: [],
  watch: [],
  other: ACCESSORIES_DEMO,
};

const MODE_CONFIG: Record<TryOnMode, { title: string; subtitle: string; itemLabel: string; mannequinSections: typeof MANNEQUIN_SECTIONS; emoji: string }> = {
  jewelry: { title: "ESSAYAGE BIJOUX", subtitle: "VIRTUEL", itemLabel: "BIJOU", mannequinSections: MANNEQUIN_SECTIONS, emoji: "💎" },
  shoes: { title: "ESSAYAGE CHAUSSURES", subtitle: "VIRTUEL", itemLabel: "CHAUSSURE", mannequinSections: SHOES_MANNEQUIN_SECTIONS, emoji: "👠" },
  clothing: { title: "ESSAYAGE VÊTEMENTS", subtitle: "VIRTUEL", itemLabel: "VÊTEMENT", mannequinSections: CLOTHING_MANNEQUIN_SECTIONS, emoji: "👗" },
  accessories: { title: "ESSAYAGE ACCESSOIRES", subtitle: "VIRTUEL", itemLabel: "ACCESSOIRE", mannequinSections: MANNEQUIN_SECTIONS, emoji: "👜" },
};

export default function TryOnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ section?: string; itemId?: string; itemName?: string }>();

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
  const [showMannequinModal, setShowMannequinModal] = useState(false);
  const [showJewelryModal, setShowJewelryModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [resultImageUrls, setResultImageUrls] = useState<string[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
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
        category: tryOnMode,
        ...(tryOnMode === "jewelry" ? { jewelryType: selectedJewelryType } : {}),
        ...(tryOnMode === "accessories" ? { accessoryType: selectedAccessoryType } : {}),
        jewelryName: selectedJewelry.label,
        numSamples,
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
          <Text style={{ fontSize: 28 }}>{MODE_CONFIG[tryOnMode].emoji}</Text>
        </View>
        {/* Sélecteur de mode (Bijoux / Chaussures / Vêtements / Accessoires) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
        >
          {(["jewelry", "shoes", "clothing", "accessories"] as TryOnMode[]).map((mode) => {
            const isActive = tryOnMode === mode;
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
                    backgroundColor: isActive ? colors.foreground : "transparent",
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, marginRight: 4 }}>{MODE_CONFIG[mode].emoji}</Text>
                <Text
                  style={[
                    styles.typeChipText,
                    { color: isActive ? colors.background : colors.muted },
                  ]}
                >
                  {mode === "jewelry" ? "Bijoux" : mode === "shoes" ? "Chaussures" : mode === "clothing" ? "Vêtements" : "Accessoires"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.headerLine, { backgroundColor: colors.border }]} />
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

          <ScrollView
            contentContainerStyle={{ padding: 16, alignItems: "center", paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {resultImageUrl ? (
              <>
                {/* Image résultat plein écran (variante sélectionnée) */}
                <View style={{ width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: resultImageUrls.length > 1 ? 12 : 20 }}>
                  <Image
                    source={{ uri: resultImageUrls[selectedVariantIndex] ?? resultImageUrl }}
                    style={{ width: "100%", aspectRatio: 3 / 4 }}
                    contentFit="cover"
                  />
                  {/* Badge luxe */}
                  <View style={[resultStyles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[resultStyles.badgeText, { color: colors.background }]}>❆ ESSAYAGE IA</Text>
                  </View>
                  {/* Indicateur variante */}
                  {resultImageUrls.length > 1 && (
                    <View style={{ position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600", letterSpacing: 1 }}>
                        {selectedVariantIndex + 1} / {resultImageUrls.length}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Miniatures des variantes */}
                {resultImageUrls.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                  >
                    {resultImageUrls.map((url, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setSelectedVariantIndex(idx);
                          setResultImageUrl(url);
                          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={{
                          width: 72,
                          height: 96,
                          borderRadius: 8,
                          overflow: "hidden",
                          borderWidth: selectedVariantIndex === idx ? 2 : 1,
                          borderColor: selectedVariantIndex === idx ? colors.primary : colors.border,
                        }}
                      >
                        <Image source={{ uri: url }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Infos bijou */}
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
