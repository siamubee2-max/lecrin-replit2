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
  Easing,
  PanResponder,
 Share } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ZoomableImage } from "@/components/ui/ZoomableImage";
import { OutfitBuilder } from "@/components/tryon/OutfitBuilder";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import { recordLookAction } from "@/services/look-learning-service";
import { recordTryOnTelemetry, type TryOnType } from "@/services/tryon-observability-service";
import { trackGuidedTryOnCompleted, trackLookSaved, trackTryOnQualityFeedback } from "@/lib/analytics";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
type TryOnQualityReport = {
  score: number;
  expectedCount: number;
  generatedCount: number;
  distinctCount: number;
  poseCoverage: number;
  autoRetried: boolean;
};

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

const LOCAL_COLLECTION_KEY = "@ecrin_local_collection";

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
    title: "Mannequins Féminins",
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
        id: "femme-peau-foncee",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_5-42iLYadbUPkEQthn5qZ2KU.png",
        label: "Femme Élancée",
      },
    ],
  },
  {
    title: "Mannequins Masculins",
    data: [
      {
        id: "homme-classique",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_clothing_4-jHS97Wxe3UQjYC29y7TTqj.png",
        label: "Homme Classique",
      },
      {
        id: "homme-jeune",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_male_1-YauFjdb5sCH9zPtipQYXKv.png",
        label: "Homme Jeune",
      },
      {
        id: "homme-mature",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_male_2-Kmqm7sUucV8UiiCFwcBtFC.png",
        label: "Homme Mature",
      },
      {
        id: "homme-peau-foncee",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_male_3-MJNcZ2y3hq7GHYo6V4YcE7.png",
        label: "Homme Peau Foncée",
      },
    ],
  },
  {
    title: "Mannequins Non-Genrés",
    data: [
      {
        id: "neutre-1",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_neutral_1-PedjpBcTeBVGVwLQsDrrd9.png",
        label: "Neutre Casual",
      },
      {
        id: "neutre-2",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_neutral_2-8s94exuUCHa2ANdrbNRmMx.png",
        label: "Neutre Chic",
      },
      {
        id: "neutre-3",
        uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/mannequin_neutral_3-nyGQKCBEPHFfvXxc4WAQwY.png",
        label: "Neutre Naturel",
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
type TryOnMode = "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";
type AccessoryTypeKey = "bag" | "belt" | "sunglasses" | "scarf" | "hat" | "watch" | "other";
type ItemSource = "demo" | "dressing" | "catalogue";
type GenderFilter = "women" | "men";

const ACCESSORY_TYPES: { key: AccessoryTypeKey; label: string; emoji: string }[] = [
  { key: "bag", label: "Sacs", emoji: "👜" },
  { key: "belt", label: "Ceintures", emoji: "🪢" },
  { key: "sunglasses", label: "Lunettes", emoji: "🕶️" },
  { key: "scarf", label: "Écharpes", emoji: "🧣" },
  { key: "hat", label: "Chapeaux", emoji: "🎩" },
  { key: "watch", label: "Montres", emoji: "⌚" },
  { key: "other", label: "Autres", emoji: "✨" },
];

// Articles de démo Chapeaux
const HATS_DEMO = [
  {
    id: "hat-bob-beige",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/hat_bob_beige-HhGboqTxDiL54ad8MnDCD7.webp",
    label: "Bob Beige",
    brand: "L'Écrin",
  },
  {
    id: "hat-cap-black",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/hat_cap_black-eoUQeGAR5BDm5SGqfmFg9L.webp",
    label: "Casquette Noire",
    brand: "L'Écrin",
  },
  {
    id: "hat-straw-summer",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/hat_straw_summer-bQwBFDXdKH6t8VdBv33RsZ.webp",
    label: "Chapeau de Paille",
    brand: "L'Écrin",
  },
];

// Articles de démo Montres
const WATCHES_DEMO = [
  {
    id: "watch-classic-gold",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/watch_classic_gold-hCfAhBvMghWX3VNW8SLVcz.webp",
    label: "Montre Classique Or",
    brand: "L'Écrin",
  },
  {
    id: "watch-sport-black",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/watch_sport_black-SexGEybF3TtRBCe7XBSQbM.webp",
    label: "Montre Sport Noire",
    brand: "L'Écrin",
  },
  {
    id: "watch-luxury-silver",
    uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/watch_luxury_silver-9mRSmbzaU66Q4hPwbfEnP9.webp",
    label: "Montre Luxe Argent",
    brand: "L'Écrin",
  },
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
    presetSubType?: string;
    guideSteps?: string;
    guideIndex?: string;
    // Params de relance depuis l'historique
    retryModelUrl?: string;
    retryItemUrl?: string;
    retryItemName?: string;
    catalogImageUrl?: string;
    retrySubType?: string;
    // Params depuis la boutique (bouton ESSAYER)
    partnerJewelryId?: string;
    partnerJewelryName?: string;
    partnerJewelryType?: string;
    partnerJewelryImage?: string;
  }>();

  const initialMode: TryOnMode = useMemo(() => {
    if (params.section === "outfit") return "outfit";
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
  const [itemSource, setItemSource] = useState<ItemSource>("demo");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("women");

  // Sync tryOnMode when params change (tab navigation doesn't remount the screen)
  useEffect(() => {
    setTryOnMode(initialMode);
  }, [initialMode]);

  const guideSteps = useMemo(() => {
    if (!params.guideSteps) return [] as { section: string; itemId: string; itemName: string; presetSubType?: string }[];
    try {
      const parsed = JSON.parse(params.guideSteps as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [params.guideSteps]);
  const guideIndex = useMemo(() => {
    const n = Number(params.guideIndex ?? "0");
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [params.guideIndex]);
  const isGuidedFlow = guideSteps.length > 0;
  const currentGuideStep = isGuidedFlow ? guideSteps[Math.min(guideIndex, guideSteps.length - 1)] : null;
  const hasNextGuideStep = isGuidedFlow && guideIndex < guideSteps.length - 1;
  const guidedCompletionKeyRef = useRef<string | null>(null);

  const findPresetItem = useCallback((itemId: string): GalleryItem | null => {
    const fromJewelry = Object.entries(JEWELRY_BY_TYPE).find(([, list]) => list.some((item) => item.id === itemId));
    if (fromJewelry) {
      const [type, list] = fromJewelry;
      setSelectedJewelryType(type as JewelryTypeKey);
      return list.find((item) => item.id === itemId) ?? null;
    }
    const fromShoes = SHOES_DEMO.find((item) => item.id === itemId);
    if (fromShoes) return fromShoes;
    const fromClothing = CLOTHING_DEMO.find((item) => item.id === itemId);
    if (fromClothing) return fromClothing;
    const fromAccessories = Object.entries(ACCESSORIES_BY_TYPE).find(([, list]) => list.some((item) => item.id === itemId));
    if (fromAccessories) {
      const [type, list] = fromAccessories;
      setSelectedAccessoryType(type as AccessoryTypeKey);
      return list.find((item) => item.id === itemId) ?? null;
    }
    return null;
  }, []);

  // Pré-remplissage depuis la boutique (bouton ESSAYER)
  useEffect(() => {
    if (!params.partnerJewelryId || !params.partnerJewelryImage) return;
    // Nettoyer les résultats précédents
    setResultImageUrl(null);
    setResultImageUrls([]);
    setShowResultModal(false);
    // Pré-sélectionner l'article de la boutique
    setSelectedJewelry({
      id: `partner-${params.partnerJewelryId}`,
      uri: params.partnerJewelryImage,
      label: params.partnerJewelryName ?? "Bijou",
    });
    // Ajuster le type de bijou si disponible
    const validJewelryTypes: JewelryTypeKey[] = ["earrings", "necklace", "bracelet", "ring", "anklet", "set"];
    if (params.partnerJewelryType && validJewelryTypes.includes(params.partnerJewelryType as JewelryTypeKey)) {
      setSelectedJewelryType(params.partnerJewelryType as JewelryTypeKey);
    }
    // Forcer le mode bijoux pour les articles boutique
    setTryOnMode("jewelry");
  }, [params.partnerJewelryId, params.partnerJewelryImage, params.partnerJewelryName, params.partnerJewelryType]);

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

  // Pré-remplissage rapide depuis le look du jour
  useEffect(() => {
    if (!params.presetSubType) return;
    if (params.section === "jewelry") {
      const validJewelryTypes: JewelryTypeKey[] = ["earrings", "necklace", "bracelet", "ring", "anklet", "set"];
      if (validJewelryTypes.includes(params.presetSubType as JewelryTypeKey)) {
        setSelectedJewelryType(params.presetSubType as JewelryTypeKey);
      }
    }
    if (params.section === "accessories") {
      const validAccessoryTypes: AccessoryTypeKey[] = ["bag", "belt", "sunglasses", "scarf", "hat", "watch", "other"];
      if (validAccessoryTypes.includes(params.presetSubType as AccessoryTypeKey)) {
        setSelectedAccessoryType(params.presetSubType as AccessoryTypeKey);
      }
    }
  }, [params.presetSubType, params.section]);

  useEffect(() => {
    if (!params.itemId) return;
    const preset = findPresetItem(params.itemId);
    if (preset) {
      setSelectedJewelry(preset);
      if (params.itemName) {
        setSelectedJewelry((prev) => (prev ? { ...prev, label: params.itemName as string } : prev));
      }
    }
  }, [findPresetItem, params.itemId, params.itemName]);

  // Handle catalogue items (wardrobe_models) and dressing items with image URLs
  const catalogUrl = params.catalogImageUrl;
  const catalogId = params.itemId;
  const catalogName = params.itemName;
  useEffect(() => {
    if (!catalogUrl || !catalogUrl.startsWith('http')) return;
    // Nettoyer les résultats précédents
    setResultImageUrl(null);
    setResultImageUrls([]);
    setShowResultModal(false);
    const catalogItem: GalleryItem = {
      id: catalogId ?? 'catalog-item',
      uri: catalogUrl,
      label: catalogName ?? 'Article catalogue',
    };
    setSelectedJewelry(catalogItem);
  }, [catalogUrl, catalogId, catalogName]);

  const [showMannequinModal, setShowMannequinModal] = useState(false);
  const [showJewelryModal, setShowJewelryModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const subscription = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [resultImageUrls, setResultImageUrls] = useState<string[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [qualityReport, setQualityReport] = useState<TryOnQualityReport | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareRatio, setCompareRatio] = useState(0.5);
  const [compareLayoutWidth, setCompareLayoutWidth] = useState(0);
  const [compareLayoutHeight, setCompareLayoutHeight] = useState(0);
  const [compareScale, setCompareScale] = useState(1);
  const [compareTranslateX, setCompareTranslateX] = useState(0);
  const [compareTranslateY, setCompareTranslateY] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [qualityFeedbackVote, setQualityFeedbackVote] = useState<"positive" | "negative" | null>(null);
  const [lastAiCostUsd, setLastAiCostUsd] = useState<number | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [selectedPose, setSelectedPose] = useState<PoseKey>("front");
  const [queuedRequests, setQueuedRequests] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const resultRevealAnim = useRef(new Animated.Value(0)).current;
  const autoAdvanceRingAnim = useRef(new Animated.Value(1)).current;
  const autoAdvanceGlowAnim = useRef(new Animated.Value(0.35)).current;
  const resultCarouselRef = useRef<FlatList<string>>(null);
  const compareModeRef = useRef<"slider" | "pan">("slider");
  const compareStartScaleRef = useRef(1);
  const compareStartDistanceRef = useRef(0);
  const compareStartCenterRef = useRef({ x: 0, y: 0 });
  const compareStartTranslateRef = useRef({ x: 0, y: 0 });
  const compareLastTapTimeRef = useRef(0);
  const compareLastTapPosRef = useRef({ x: 0, y: 0 });
  const tryOnQueueRef = useRef<Array<{ forceStrict?: boolean }>>([]);

  const { user } = useAuth();

  // ─── Fetch wardrobe & catalogue items for item picker ──────────────
  const { data: wardrobeRaw = [] } = trpc.wardrobe.list.useQuery(undefined, { enabled: !!user });
  const { data: catalogueRaw = [] } = trpc.wardrobeModels.list.useQuery(
    { gender: genderFilter },
    { enabled: true }
  );

  // Map wardrobe items to GalleryItem[]
  const wardrobeGalleryItems = useMemo((): GalleryItem[] => {
    const categoryMap: Record<string, TryOnMode> = {
      accessories: "jewelry", shoes: "shoes",
      tops: "clothing", bottoms: "clothing", dresses: "clothing", outerwear: "clothing",
      bags: "accessories", other: "accessories",
    };
    return (wardrobeRaw as any[]).filter((item) => {
      if (!item.imageUrl) return false;
      const mode = categoryMap[item.category] ?? "clothing";
      return mode === tryOnMode;
    }).map((item) => ({
      id: `wardrobe-${item.id}`,
      uri: item.imageUrl as string,
      label: item.name,
    }));
  }, [wardrobeRaw, tryOnMode]);

  // Map catalogue items to GalleryItem[]
  const catalogueGalleryItems = useMemo((): GalleryItem[] => {
    const categoryMap: Record<string, TryOnMode> = {
      accessories: "jewelry", shoes: "shoes",
      tops: "clothing", bottoms: "clothing", dresses: "clothing", outerwear: "clothing", clothing: "clothing",
      bags: "accessories", other: "accessories",
    };
    return (catalogueRaw as any[]).filter((item) => {
      if (!item.image_url) return false;
      const mode = categoryMap[item.category] ?? "clothing";
      return mode === tryOnMode;
    }).map((item) => ({
      id: `catalogue-${item.id}`,
      uri: item.image_url as string,
      label: item.name,
    }));
  }, [catalogueRaw, tryOnMode]);

  const addToCollectionMutation = trpc.collection.add.useMutation();
  const createCommunityPostMutation = trpc.community.create.useMutation();
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

  useEffect(() => {
    if (!showResultModal) {
      resultRevealAnim.setValue(0);
      return;
    }
    Animated.timing(resultRevealAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [showResultModal, resultRevealAnim]);

  const currentType = JEWELRY_TYPES.find(t => t.key === selectedJewelryType)!;
  const jewelryOptions = JEWELRY_BY_TYPE[selectedJewelryType] || [];
  const comparePanResponder = useMemo(
    () => {
      const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
      const clampTranslate = (tx: number, ty: number, scale: number) => {
        const maxX = ((compareLayoutWidth || SCREEN_WIDTH) * (scale - 1)) / 2;
        const maxY = ((compareLayoutHeight || 1) * (scale - 1)) / 2;
        return {
          x: clamp(tx, -maxX, maxX),
          y: clamp(ty, -maxY, maxY),
        };
      };

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = touches;
            compareStartDistanceRef.current = Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
            compareStartScaleRef.current = compareScale;
            compareStartCenterRef.current = {
              x: (a.pageX + b.pageX) / 2,
              y: (a.pageY + b.pageY) / 2,
            };
            compareStartTranslateRef.current = { x: compareTranslateX, y: compareTranslateY };
            return;
          }
          const now = Date.now();
          const tapX = evt.nativeEvent.locationX;
          const tapY = evt.nativeEvent.locationY;
          const msSinceLastTap = now - compareLastTapTimeRef.current;
          const distSinceLastTap = Math.hypot(
            tapX - compareLastTapPosRef.current.x,
            tapY - compareLastTapPosRef.current.y,
          );
          const isDoubleTap = msSinceLastTap <= 280 && distSinceLastTap <= 24;
          compareLastTapTimeRef.current = now;
          compareLastTapPosRef.current = { x: tapX, y: tapY };

          if (isDoubleTap) {
            const w = compareLayoutWidth || SCREEN_WIDTH;
            const h = compareLayoutHeight || 1;
            if (compareScale > 1.2) {
              setCompareScale(1);
              setCompareTranslateX(0);
              setCompareTranslateY(0);
            } else {
              const targetScale = 2.2;
              const focalX = tapX - w / 2;
              const focalY = tapY - h / 2;
              const targetTx = -focalX * (targetScale - 1);
              const targetTy = -focalY * (targetScale - 1);
              const clamped = clampTranslate(targetTx, targetTy, targetScale);
              setCompareScale(targetScale);
              setCompareTranslateX(clamped.x);
              setCompareTranslateY(clamped.y);
            }
            compareModeRef.current = "pan";
            return;
          }
          compareModeRef.current = compareScale > 1.03 ? "pan" : "slider";
          compareStartTranslateRef.current = { x: compareTranslateX, y: compareTranslateY };
          if (compareLayoutWidth > 0 && compareModeRef.current === "slider") {
            const ratio = clamp(evt.nativeEvent.locationX / compareLayoutWidth, 0.05, 0.95);
            setCompareRatio(ratio);
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          const touches = evt.nativeEvent.touches;
          if (touches.length >= 2) {
            const [a, b] = touches;
            const distance = Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
            const startDistance = compareStartDistanceRef.current || distance;
            const nextScale = clamp(compareStartScaleRef.current * (distance / Math.max(1, startDistance)), 1, 3.5);
            setCompareScale(nextScale);
            const center = {
              x: (a.pageX + b.pageX) / 2,
              y: (a.pageY + b.pageY) / 2,
            };
            const dx = center.x - compareStartCenterRef.current.x;
            const dy = center.y - compareStartCenterRef.current.y;
            const clamped = clampTranslate(
              compareStartTranslateRef.current.x + dx,
              compareStartTranslateRef.current.y + dy,
              nextScale,
            );
            setCompareTranslateX(clamped.x);
            setCompareTranslateY(clamped.y);
            return;
          }
          if (compareModeRef.current === "pan" && compareScale > 1.03) {
            const clamped = clampTranslate(
              compareStartTranslateRef.current.x + gestureState.dx,
              compareStartTranslateRef.current.y + gestureState.dy,
              compareScale,
            );
            setCompareTranslateX(clamped.x);
            setCompareTranslateY(clamped.y);
            return;
          }
          if (compareLayoutWidth <= 0) return;
          const ratio = clamp(evt.nativeEvent.locationX / compareLayoutWidth, 0.05, 0.95);
          setCompareRatio(ratio);
        },
      });
    },
    [compareLayoutHeight, compareLayoutWidth, compareScale, compareTranslateX, compareTranslateY],
  );

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
    void Image.prefetch(item.uri).catch(() => undefined);
    setUserPhoto(item.uri);
    setShowMannequinModal(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSelectJewelry = useCallback((item: GalleryItem) => {
    void Image.prefetch(item.uri).catch(() => undefined);
    setSelectedJewelry(item);
    setShowJewelryModal(false);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleTryOn = async (options?: { forceStrict?: boolean; fromQueue?: boolean }) => {
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
    if (isProcessing && !options?.fromQueue) {
      tryOnQueueRef.current.push({ forceStrict: options?.forceStrict });
      setQueuedRequests(tryOnQueueRef.current.length);
      return;
    }
    const startedAt = Date.now();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    setResultImageUrl(null);
    setQualityReport(null);
    setLastAiCostUsd(null);
    setIsSaved(false);
    setIsCompareMode(false);
    setCompareRatio(0.5);
    setCompareScale(1);
    setCompareTranslateX(0);
    setCompareTranslateY(0);
    try {
      let backendQualityScore: number | null = null;
      let accumulatedAiCostUsd = 0;
      await Promise.allSettled([
        Image.prefetch(userPhoto),
        Image.prefetch(selectedJewelry.uri),
      ]);
      // Convertir les URIs locales en URLs publiques si nécessaire
      const [publicModelUrl, publicJewelryUrl] = await Promise.all([
        ensurePublicUrl(userPhoto, uploadImageMutation),
        ensurePublicUrl(selectedJewelry.uri, uploadImageMutation),
      ]);
      const requestPayload = {
        modelImageUrl: publicModelUrl,
        jewelryImageUrl: publicJewelryUrl,
        category: tryOnMode as "jewelry" | "shoes" | "clothing" | "accessories",
        ...(tryOnMode === "jewelry" ? { jewelryType: selectedJewelryType } : {}),
        ...(tryOnMode === "accessories" ? { accessoryType: selectedAccessoryType } : {}),
        jewelryName: selectedJewelry.label,
        // Passe l'ID du mannequin pour adapter les proportions côté serveur
        modelId: MANNEQUIN_SECTIONS.flatMap(s => s.data)
          .concat(CLOTHING_MANNEQUIN_SECTIONS.flatMap(s => s.data))
          .concat(SHOES_MANNEQUIN_SECTIONS.flatMap(s => s.data))
          .find(m => m.uri === userPhoto)?.id ?? undefined,
      };

      const scoreGenerationQuality = (
        urls: string[],
        expectedCount: number,
        poseCoverage: number,
        autoRetried: boolean,
      ): TryOnQualityReport => {
        const distinctCount = new Set(urls).size;
        const generatedCount = urls.length;
        const countScore = Math.round(40 * Math.min(1, generatedCount / Math.max(1, expectedCount)));
        const distinctScore = generatedCount === 0 ? 0 : Math.round(30 * Math.min(1, distinctCount / generatedCount));
        const poseScore = Math.round(30 * Math.min(1, poseCoverage));
        const score = Math.min(100, countScore + distinctScore + poseScore);
        return {
          score,
          expectedCount,
          generatedCount,
          distinctCount,
          poseCoverage,
          autoRetried,
        };
      };

      const requestDistinctPoseImage = async (
        pose: PoseKey,
        used: Set<string>,
        qualityPlan: ("standard" | "strict")[],
        fallbackPose?: PoseKey,
      ): Promise<string | null> => {
        const poseToUse = fallbackPose ?? pose;
        for (const qualityMode of qualityPlan) {
          const result = await tryOnMutation.mutateAsync({
            ...requestPayload,
            pose: poseToUse,
            numSamples: 1,
            qualityMode,
            guaranteedResult: qualityMode === "strict",
            qualityThreshold: 72,
            modelCandidates: "gemini-3.1-flash-image-preview,gemini-2.0-flash-preview-image-generation",
          });
          if (typeof (result as any).qualityScore === "number") {
            backendQualityScore = Math.max(backendQualityScore ?? 0, (result as any).qualityScore);
          }
          if (typeof (result as any).aiCostUsd === "number") {
            accumulatedAiCostUsd += (result as any).aiCostUsd;
          }
          const urls = result.resultImageUrls ?? (result.resultImageUrl ? [result.resultImageUrl] : []);
          const candidate = urls.find(Boolean) ?? null;
          if (!candidate) continue;
          if (!used.has(candidate)) return candidate;
        }
        return null;
      };

      // Multi-poses automatiques :
      // - 1 image  -> pose sélectionnée
      // - 2 images -> face + profil
      // - 4 images -> face + profil + marche + dos
      const posePlan: PoseKey[] =
        numSamples >= 4
          ? ["front", "side", "walking", "back"]
          : numSamples >= 2
            ? ["front", "side"]
            : [selectedPose];

      const targetPoses = posePlan.slice(0, numSamples);
      const generateWithPlan = async (qualityPlan: ("standard" | "strict")[]) => {
        const urlByPose = new Map<PoseKey, string>();
        const usedUrls = new Set<string>();
        const maxPosePasses = 2;

        for (let pass = 0; pass < maxPosePasses && urlByPose.size < targetPoses.length; pass += 1) {
          for (const pose of targetPoses) {
            if (urlByPose.has(pose)) continue;
            const firstValid = await requestDistinctPoseImage(pose, usedUrls, qualityPlan);
            if (firstValid && !usedUrls.has(firstValid)) {
              urlByPose.set(pose, firstValid);
              usedUrls.add(firstValid);
            }
          }
        }

        if (urlByPose.size < targetPoses.length) {
          for (const pose of targetPoses) {
            if (urlByPose.has(pose)) continue;
            const firstFallback = await requestDistinctPoseImage(pose, usedUrls, qualityPlan, selectedPose);
            if (firstFallback && !usedUrls.has(firstFallback)) {
              urlByPose.set(pose, firstFallback);
              usedUrls.add(firstFallback);
            }
          }
        }

        let urls = targetPoses
          .map((pose) => urlByPose.get(pose))
          .filter((u): u is string => Boolean(u))
          .slice(0, numSamples);

        if (urls.length > 0 && urls.length < numSamples) {
          const expanded = [...urls];
          while (expanded.length < numSamples) expanded.push(urls[expanded.length % urls.length]);
          urls = expanded;
        }
        return { urls, poseCoverage: targetPoses.length === 0 ? 0 : urlByPose.size / targetPoses.length };
      };

      const firstPlan: ("standard" | "strict")[] = options?.forceStrict ? ["strict", "strict", "strict"] : ["standard", "strict", "strict"];
      let autoRetried = false;
      let generation = await generateWithPlan(firstPlan);
      let quality = scoreGenerationQuality(generation.urls, numSamples, generation.poseCoverage, autoRetried);
      if (typeof backendQualityScore === "number") {
        quality.score = Math.round((quality.score + backendQualityScore) / 2);
      }

      if (!options?.forceStrict && quality.score < 72) {
        autoRetried = true;
        const retried = await generateWithPlan(["strict", "strict", "strict"]);
        const retriedQuality = scoreGenerationQuality(retried.urls, numSamples, retried.poseCoverage, autoRetried);
        if (retriedQuality.score >= quality.score) {
          generation = retried;
          quality = retriedQuality;
        }
      }
      // Complete progress bar to 100%
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
      const urls = generation.urls;
      if (urls.length > 0 && urls.length < numSamples) {
        Alert.alert(
          "Variantes partielles",
          `Seulement ${urls.length} image(s) ont pu être générées sur ${numSamples} demandées.`,
        );
      }
      if (new Set(urls).size === 1 && urls.length > 1) {
        Alert.alert(
          "Qualité limitée",
          "Les variantes sont trop similaires. Réessayez une nouvelle génération pour améliorer les différences de pose.",
        );
      }
      if (urls.length > 1) {
        await Promise.allSettled(urls.slice(1).map((url) => Image.prefetch(url)));
      }
      setQualityReport(quality);
      setResultImageUrls(urls);
      setResultImageUrl(urls[0] ?? null);
      setSelectedVariantIndex(0);
      setQualityFeedbackVote(null);
      setLastAiCostUsd(Number(accumulatedAiCostUsd.toFixed(6)));
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
      await recordTryOnTelemetry({
        at: new Date().toISOString(),
        type: (tryOnMode === "outfit" ? "outfit" : tryOnMode) as TryOnType,
        success: true,
        durationMs: Date.now() - startedAt,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Une erreur est survenue";
      await recordTryOnTelemetry({
        at: new Date().toISOString(),
        type: (tryOnMode === "outfit" ? "outfit" : tryOnMode) as TryOnType,
        success: false,
        durationMs: Date.now() - startedAt,
        errorMessage: message,
      });
      Alert.alert("Erreur", `L'essayage a échoué : ${message}`);
    } finally {
      setIsProcessing(false);
      const next = tryOnQueueRef.current.shift();
      setQueuedRequests(tryOnQueueRef.current.length);
      if (next) {
        setTimeout(() => {
          void handleTryOn({ ...next, fromQueue: true });
        }, 250);
      }
    }
  };

  const canTryOn = !!userPhoto && !!selectedJewelry;
  const isCurrentGuideStepCompleted = Boolean(resultImageUrl);

  useEffect(() => {
    if (!isGuidedFlow || !hasNextGuideStep || !isCurrentGuideStepCompleted) {
      setAutoAdvanceCountdown(null);
      return;
    }
    setAutoAdvanceCountdown((prev) => (prev === null ? 2 : prev));
  }, [isGuidedFlow, hasNextGuideStep, isCurrentGuideStepCompleted]);

  useEffect(() => {
    if (!isGuidedFlow || hasNextGuideStep || !isCurrentGuideStepCompleted) return;
    const completionKey = `${guideSteps.length}:${guideIndex}`;
    if (guidedCompletionKeyRef.current === completionKey) return;
    guidedCompletionKeyRef.current = completionKey;
    trackGuidedTryOnCompleted({
      mode: tryOnMode === "outfit" ? "outfit" : "single",
      totalSteps: guideSteps.length,
    });
  }, [isGuidedFlow, hasNextGuideStep, isCurrentGuideStepCompleted, guideSteps.length, guideIndex, tryOnMode]);

  useEffect(() => {
    if (autoAdvanceCountdown === null) return;
    if (autoAdvanceCountdown <= 0) {
      const nextIndex = guideIndex + 1;
      const nextStep = guideSteps[nextIndex];
      if (!nextStep) {
        setAutoAdvanceCountdown(null);
        return;
      }
      if (Platform.OS !== "web") {
        void Haptics.selectionAsync().catch(() => {});
      }
      router.replace({
        pathname: "/(tabs)/tryon",
        params: {
          section: nextStep.section,
          itemId: nextStep.itemId,
          itemName: nextStep.itemName,
          ...(nextStep.presetSubType ? { presetSubType: nextStep.presetSubType } : {}),
          guideSteps: params.guideSteps as string,
          guideIndex: String(nextIndex),
        },
      });
      setAutoAdvanceCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setAutoAdvanceCountdown((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoAdvanceCountdown, guideIndex, guideSteps, params.guideSteps]);

  useEffect(() => {
    const shouldAnimate =
      autoAdvanceCountdown === 2 && isGuidedFlow && hasNextGuideStep && isCurrentGuideStepCompleted;
    if (!shouldAnimate) {
      if (autoAdvanceCountdown === null) autoAdvanceRingAnim.setValue(1);
      return;
    }
    autoAdvanceRingAnim.setValue(1);
    const ringAnim = Animated.timing(autoAdvanceRingAnim, {
      toValue: 0,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    ringAnim.start();
    return () => {
      ringAnim.stop();
    };
  }, [autoAdvanceCountdown, isGuidedFlow, hasNextGuideStep, isCurrentGuideStepCompleted, autoAdvanceRingAnim]);

  useEffect(() => {
    const shouldGlow =
      autoAdvanceCountdown !== null && isGuidedFlow && hasNextGuideStep && isCurrentGuideStepCompleted;
    if (!shouldGlow) {
      autoAdvanceGlowAnim.setValue(0.35);
      return;
    }
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(autoAdvanceGlowAnim, {
          toValue: 0.85,
          duration: 460,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(autoAdvanceGlowAnim, {
          toValue: 0.35,
          duration: 560,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();
    return () => {
      glowLoop.stop();
      autoAdvanceGlowAnim.setValue(0.35);
    };
  }, [autoAdvanceCountdown, isGuidedFlow, hasNextGuideStep, isCurrentGuideStepCompleted, autoAdvanceGlowAnim]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >


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
        {isGuidedFlow && currentGuideStep && (
          <View
            style={[
              {
                marginHorizontal: 20,
                marginBottom: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <IconSymbol name="list.bullet" size={14} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: 11, color: colors.muted, letterSpacing: 0.3 }}>
                Guide look complet: étape {guideIndex + 1}/{guideSteps.length} — {currentGuideStep.itemName}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
              {guideSteps.map((_, idx) => {
                const isDone = idx < guideIndex || (idx === guideIndex && isCurrentGuideStepCompleted);
                const isActive = idx === guideIndex;
                return (
                  <View
                    key={`guide-step-${idx}`}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 4,
                      backgroundColor: isDone ? colors.primary : isActive ? colors.primary + "55" : colors.border,
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Sélecteur de mode (Bijoux / Chaussures / Vêtements / Accessoires) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
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
                    backgroundColor: isActive ? colors.foreground : "transparent",
                    borderColor: isActive ? colors.primary : colors.border,
                    paddingHorizontal: isOutfit ? 18 : 12,
                    paddingVertical: isOutfit ? 10 : 8,
                    minHeight: isOutfit ? 44 : undefined,
                  },
                ]}
              >
                <Text style={{ fontSize: isOutfit ? 16 : 14, marginRight: 4 }}>{MODE_CONFIG[mode].emoji}</Text>
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: isActive ? colors.background : colors.muted,
                      fontSize: isOutfit ? 12 : 11,
                      letterSpacing: isOutfit ? 1 : 0.8,
                    },
                  ]}
                >
                  {mode === "jewelry" ? "Bijoux" : mode === "shoes" ? "Chaussures" : mode === "clothing" ? "Vêtements" : mode === "accessories" ? "Accessoires" : "Tenue"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={{ height: 1, marginHorizontal: 20, marginBottom: 8, backgroundColor: colors.border, opacity: 0.4 }} />

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
        <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
          <Text style={[styles.photoLabel, { color: colors.muted, marginBottom: 10 }]}>VARIANTES</Text>
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
                    flex: 1,
                    paddingHorizontal: 0,
                    alignItems: "center",
                    backgroundColor: numSamples === n ? colors.foreground : colors.surface,
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
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={[styles.photoLabel, { color: colors.muted, marginBottom: 10 }]}>POSE</Text>
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
                  style={[styles.typeChip, {
                    flex: 1,
                    paddingHorizontal: 4,
                    paddingVertical: 10,
                    alignItems: "center",
                    backgroundColor: isSelected ? colors.foreground : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    flexDirection: "column",
                    gap: 4,
                  }]}
                >
                  <Text style={{ fontSize: 18, textAlign: "center" }}>{pose.icon}</Text>
                  <Text style={[styles.typeChipText, { color: isSelected ? colors.background : colors.muted, fontSize: 9 }]}>{pose.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {numSamples > 1 && (
            <Text style={[styles.hintText, { color: colors.muted, marginTop: 10 }]}>
              {numSamples === 2
                ? "2 images: Face + Profil (automatique)"
                : "4 images: Face + Profil + Marche + Dos (automatique)"}
            </Text>
          )}
        </View>


        {/* Zone principale */}
        <View style={styles.photosRow}>
          <View style={styles.photoCol}>
            <Text style={[styles.photoLabel, { color: colors.muted }]}>MODÈLE</Text>

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
                    <IconSymbol name="person.fill" size={30} color={colors.muted} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Photo ou{"\n"}mannequin
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
            onPress={() => {
              void handleTryOn();
            }}
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

          {queuedRequests > 0 && (
            <Text style={[styles.hintText, { color: colors.primary, marginTop: 8 }]}>
              {queuedRequests} génération{queuedRequests > 1 ? "s" : ""} en file d'attente (non bloquant)
            </Text>
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
          {isGuidedFlow && (
            <View style={{ marginTop: 10, gap: 8 }}>
              {isCurrentGuideStepCompleted && hasNextGuideStep && autoAdvanceCountdown !== null && (
                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {(() => {
                      const ringSize = 22;
                      const stroke = 2;
                      const radius = (ringSize - stroke) / 2;
                      const circumference = 2 * Math.PI * radius;
                      return (
                        <View style={{ width: ringSize, height: ringSize, alignItems: "center", justifyContent: "center" }}>
                          <Animated.View
                            pointerEvents="none"
                            style={{
                              position: "absolute",
                              width: ringSize + 10,
                              height: ringSize + 10,
                              borderRadius: 999,
                              backgroundColor: colors.primary,
                              opacity: autoAdvanceGlowAnim,
                              transform: [
                                {
                                  scale: autoAdvanceGlowAnim.interpolate({
                                    inputRange: [0.35, 0.85],
                                    outputRange: [0.92, 1.14],
                                  }),
                                },
                              ],
                            }}
                          />
                          <Svg width={ringSize} height={ringSize} style={{ position: "absolute" }}>
                            <Circle
                              cx={ringSize / 2}
                              cy={ringSize / 2}
                              r={radius}
                              stroke={colors.border}
                              strokeWidth={stroke}
                              fill="none"
                            />
                            <AnimatedCircle
                              cx={ringSize / 2}
                              cy={ringSize / 2}
                              r={radius}
                              stroke={colors.primary}
                              strokeWidth={stroke}
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${circumference}, ${circumference}`}
                              strokeDashoffset={autoAdvanceRingAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [circumference, 0],
                              })}
                              rotation={-90}
                              originX={ringSize / 2}
                              originY={ringSize / 2}
                            />
                          </Svg>
                          <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "700" }}>
                            {autoAdvanceCountdown}
                          </Text>
                        </View>
                      );
                    })()}
                    <Text style={[styles.hintText, { color: colors.primary, marginTop: 0 }]}>
                      Étape suivante automatique
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setAutoAdvanceCountdown(null)}
                    style={[styles.fullBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
                    activeOpacity={0.85}
                  >
                    <IconSymbol name="xmark" size={14} color={colors.foreground} />
                    <Text style={[styles.fullBtnText, { color: colors.foreground }]}>Annuler l'auto-passage</Text>
                  </TouchableOpacity>
                </View>
              )}
              {hasNextGuideStep ? (
                <TouchableOpacity
                  disabled={!isCurrentGuideStepCompleted}
                  onPress={() => {
                    setAutoAdvanceCountdown(null);
                    const nextIndex = guideIndex + 1;
                    const nextStep = guideSteps[nextIndex];
                    router.replace({
                      pathname: "/(tabs)/tryon",
                      params: {
                        section: nextStep.section,
                        itemId: nextStep.itemId,
                        itemName: nextStep.itemName,
                        ...(nextStep.presetSubType ? { presetSubType: nextStep.presetSubType } : {}),
                        guideSteps: params.guideSteps as string,
                        guideIndex: String(nextIndex),
                      },
                    });
                  }}
                  style={[
                    styles.fullBtn,
                    {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: isCurrentGuideStepCompleted ? colors.border : colors.primary,
                      opacity: isCurrentGuideStepCompleted ? 1 : 0.7,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="chevron.right" size={14} color={colors.foreground} />
                  <Text style={[styles.fullBtnText, { color: colors.foreground }]}>
                    {isCurrentGuideStepCompleted ? "Étape suivante du look" : "Lancez un essayage pour débloquer"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled={!isCurrentGuideStepCompleted}
                  onPress={() => {
                    setAutoAdvanceCountdown(null);
                    router.replace("/(tabs)");
                  }}
                  style={[
                    styles.fullBtn,
                    {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: isCurrentGuideStepCompleted ? colors.border : colors.primary,
                      opacity: isCurrentGuideStepCompleted ? 1 : 0.7,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="checkmark" size={14} color={colors.foreground} />
                  <Text style={[styles.fullBtnText, { color: colors.foreground }]}>
                    {isCurrentGuideStepCompleted ? "Guide terminé" : "Terminez l'essayage de cette étape"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
        sections={
          itemSource === "dressing"
            ? [{ title: "Mon Dressing", data: wardrobeGalleryItems }]
            : itemSource === "catalogue"
            ? [{ title: `Catalogue ${genderFilter === "women" ? "Femme" : "Homme"}`, data: catalogueGalleryItems }]
            : tryOnMode === "jewelry"
            ? [{ title: currentType.label, data: jewelryOptions }]
            : tryOnMode === "shoes"
            ? [{ title: "Chaussures de démonstration", data: SHOES_DEMO }]
            : tryOnMode === "clothing"
            ? [{ title: "Vêtements de démonstration", data: CLOTHING_DEMO }]
            : tryOnMode === "accessories"
            ? [{ title: ACCESSORY_TYPES.find(t => t.key === selectedAccessoryType)?.label ?? "Accessoires", data: ACCESSORIES_BY_TYPE[selectedAccessoryType].length > 0 ? ACCESSORIES_BY_TYPE[selectedAccessoryType] : ACCESSORIES_DEMO }]
            : [{ title: "Articles", data: [] as typeof ACCESSORIES_DEMO }]
        }
        onSelect={handleSelectJewelry}
        onClose={() => setShowJewelryModal(false)}
        imageMode="contain"
        colors={colors}
        itemSource={itemSource}
        onItemSourceChange={setItemSource}
        genderFilter={genderFilter}
        onGenderFilterChange={setGenderFilter}
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
            <Animated.View
              style={{
                flex: 1,
                opacity: resultRevealAnim,
                transform: [
                  {
                    translateY: resultRevealAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              }}
            >
              {/* Carousel horizontal plein-écran */}
              {(() => {
                const imgW = SCREEN_WIDTH;
                const imgH = (tryOnMode === "shoes" || tryOnMode === "clothing")
                  ? imgW * (16 / 9)
                  : imgW * (4 / 3);
                const urls = resultImageUrls.length > 0 ? resultImageUrls : (resultImageUrl ? [resultImageUrl] : []);
                return (
                  <View style={{ width: SCREEN_WIDTH, height: imgH, position: "relative" }}>
                    {isCompareMode && userPhoto ? (
                      <View
                        style={{ width: SCREEN_WIDTH, height: imgH, overflow: "hidden" }}
                        onLayout={(e) => {
                          setCompareLayoutWidth(e.nativeEvent.layout.width);
                          setCompareLayoutHeight(e.nativeEvent.layout.height);
                        }}
                        {...comparePanResponder.panHandlers}
                      >
                        <View
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: imgW,
                            height: imgH,
                            transform: [
                              { translateX: compareTranslateX },
                              { translateY: compareTranslateY },
                              { scale: compareScale },
                            ],
                          }}
                        >
                          <Image source={{ uri: userPhoto }} style={{ width: imgW, height: imgH }} contentFit="contain" />
                          <View style={{ position: "absolute", top: 0, left: 0, width: Math.max(1, imgW * compareRatio), height: imgH, overflow: "hidden" }}>
                            <Image source={{ uri: urls[selectedVariantIndex] ?? urls[0] }} style={{ width: imgW, height: imgH }} contentFit="contain" />
                          </View>
                        </View>
                        <View
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: Math.max(0, Math.min(imgW - 2, imgW * compareRatio)),
                            width: 2,
                            height: imgH,
                            backgroundColor: colors.primary,
                          }}
                        />
                        <View pointerEvents="none" style={{ position: "absolute", top: 12, left: 12, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>AVANT</Text>
                        </View>
                        <View pointerEvents="none" style={{ position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>APRÈS</Text>
                        </View>
                        <View pointerEvents="none" style={{ position: "absolute", bottom: 12, left: 12, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                          <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                            {compareScale > 1.02 ? "1 doigt: déplacer · 2 doigts: zoomer" : "1 doigt: slider · 2 doigts: zoomer"}
                          </Text>
                        </View>
                        <View style={{ position: "absolute", bottom: 12, right: 12, flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => {
                              const next = Math.max(1, Number((compareScale - 0.25).toFixed(2)));
                              setCompareScale(next);
                              if (next <= 1.01) {
                                setCompareTranslateX(0);
                                setCompareTranslateY(0);
                              }
                            }}
                            style={{ backgroundColor: "rgba(0,0,0,0.6)", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
                            activeOpacity={0.85}
                          >
                            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>−</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setCompareScale(1);
                              setCompareTranslateX(0);
                              setCompareTranslateY(0);
                            }}
                            style={{ backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
                            activeOpacity={0.85}
                          >
                            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>RESET</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setCompareScale((prev) => Math.min(3.5, Number((prev + 0.25).toFixed(2))))}
                            style={{ backgroundColor: "rgba(0,0,0,0.6)", width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
                            activeOpacity={0.85}
                          >
                            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <FlatList
                        ref={resultCarouselRef}
                        data={urls}
                        horizontal
                        pagingEnabled
                        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                        initialNumToRender={1}
                        maxToRenderPerBatch={2}
                        windowSize={3}
                        scrollEnabled={urls.length > 1}
                        bounces={false}
                        decelerationRate="fast"
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
                            {urls.length > 1 ? (
                              <Image
                                source={{ uri: url }}
                                style={{ width: imgW, height: imgH }}
                                contentFit="contain"
                              />
                            ) : (
                              <ZoomableImage
                                uri={url}
                                width={imgW}
                                height={imgH}
                                showHint
                                onZoomChange={setIsImageZoomed}
                              />
                            )}
                          </View>
                        )}
                      />
                    )}
                    {/* Badge luxe */}
                    <View pointerEvents="none" style={[resultStyles.badge, { backgroundColor: colors.primary, top: 12, left: 12 }]}>
                      <Text style={[resultStyles.badgeText, { color: colors.background }]}>❆ ESSAYAGE IA</Text>
                    </View>
                    {userPhoto && (
                      <TouchableOpacity
                        onPress={() =>
                          setIsCompareMode((prev) => {
                            const next = !prev;
                            if (next) {
                              setCompareScale(1);
                              setCompareTranslateX(0);
                              setCompareTranslateY(0);
                              setCompareRatio(0.5);
                            }
                            return next;
                          })
                        }
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.4)",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                          {isCompareMode ? "Mode Carousel" : "Avant / Après"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {/* Contrôles précédent / suivant (fallback si swipe capricieux) */}
                    {!isCompareMode && urls.length > 1 && (
                      <View pointerEvents="box-none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 }}>
                          <TouchableOpacity
                            onPress={() => {
                              const next = Math.max(0, selectedVariantIndex - 1);
                              resultCarouselRef.current?.scrollToIndex({ index: next, animated: true });
                              setSelectedVariantIndex(next);
                              setResultImageUrl(urls[next] ?? urls[0]);
                            }}
                            style={{ backgroundColor: "rgba(0,0,0,0.45)", width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }}
                            activeOpacity={0.8}
                          >
                            <Text style={{ color: "#fff", fontSize: 16 }}>‹</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              const next = Math.min(urls.length - 1, selectedVariantIndex + 1);
                              resultCarouselRef.current?.scrollToIndex({ index: next, animated: true });
                              setSelectedVariantIndex(next);
                              setResultImageUrl(urls[next] ?? urls[0]);
                            }}
                            style={{ backgroundColor: "rgba(0,0,0,0.45)", width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }}
                            activeOpacity={0.8}
                          >
                            <Text style={{ color: "#fff", fontSize: 16 }}>›</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    {/* Indicateur variante + hint swipe */}
                    {!isCompareMode && urls.length > 1 && (
                      <View pointerEvents="none" style={{ position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600", letterSpacing: 1 }}>
                          {selectedVariantIndex + 1} / {urls.length}
                        </Text>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9 }}>← glisser →</Text>
                      </View>
                    )}
                    {!isCompareMode && urls.length > 1 && (
                      <View style={{ position: "absolute", bottom: 14, left: 12, flexDirection: "row", gap: 6 }}>
                        {urls.map((_, idx) => (
                          <TouchableOpacity
                            key={`dot-${idx}`}
                            onPress={() => {
                              resultCarouselRef.current?.scrollToIndex({ index: idx, animated: true });
                              setSelectedVariantIndex(idx);
                              setResultImageUrl(urls[idx] ?? urls[0]);
                            }}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: idx === selectedVariantIndex ? "#fff" : "rgba(255,255,255,0.45)",
                            }}
                          />
                        ))}
                      </View>
                    )}
                    {!isCompareMode && urls.length === 1 && (
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
                {qualityReport && (
                  <View style={[resultStyles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
                    <Text style={[resultStyles.infoLabel, { color: colors.muted }]}>QUALITÉ IA</Text>
                    <Text style={[resultStyles.infoName, { color: colors.foreground }]}>
                      Score {qualityReport.score}/100
                    </Text>
                    <Text style={[resultStyles.infoBrand, { color: qualityReport.score >= 80 ? colors.success : qualityReport.score >= 65 ? colors.primary : colors.error }]}>
                      {qualityReport.score >= 80 ? "Excellent" : qualityReport.score >= 65 ? "Correct" : "À améliorer"}
                    </Text>
                    <Text style={[styles.hintText, { color: colors.muted, marginTop: 2 }]}>
                      Variantes: {qualityReport.distinctCount}/{qualityReport.generatedCount} distinctes • Couverture poses:{" "}
                      {Math.round(qualityReport.poseCoverage * 100)}%
                    </Text>
                    {qualityReport.autoRetried && (
                      <Text style={[styles.hintText, { color: colors.primary, marginTop: 6 }]}>
                        Ajustement auto appliqué: la génération a été relancée en mode strict.
                      </Text>
                    )}
                    {qualityReport.score < 75 && (
                      <TouchableOpacity
                        onPress={async () => {
                          setShowResultModal(false);
                          await handleTryOn({ forceStrict: true });
                        }}
                        style={[styles.fullBtn, { marginTop: 10, backgroundColor: colors.foreground }]}
                        activeOpacity={0.85}
                      >
                        <IconSymbol name="arrow.clockwise" size={14} color={colors.background} />
                        <Text style={[styles.fullBtnText, { color: colors.background }]}>Régénérer en qualité maximale</Text>
                      </TouchableOpacity>
                    )}
                    {typeof lastAiCostUsd === "number" && (
                      <Text style={[styles.hintText, { color: colors.muted, marginTop: 6 }]}>
                        Coût IA estimé: ${lastAiCostUsd.toFixed(4)}
                      </Text>
                    )}
                  </View>
                )}
                <View style={[resultStyles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 10 }]}>
                  <Text style={[resultStyles.infoLabel, { color: colors.muted }]}>QUALITÉ PERÇUE</Text>
                  <Text style={[styles.hintText, { color: colors.foreground, marginTop: 2 }]}>
                    Le rendu est-il fidèle à ce que vous attendiez ?
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setQualityFeedbackVote("positive");
                        trackTryOnQualityFeedback({
                          mode: tryOnMode,
                          vote: "positive",
                          qualityScore: qualityReport?.score,
                          isGuided: isGuidedFlow,
                        });
                      }}
                      style={[
                        resultStyles.actionBtn,
                        {
                          flex: 1,
                          backgroundColor:
                            qualityFeedbackVote === "positive" ? colors.success : colors.background,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Text style={[resultStyles.actionBtnText, { color: colors.foreground }]}>👍 Fidèle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setQualityFeedbackVote("negative");
                        trackTryOnQualityFeedback({
                          mode: tryOnMode,
                          vote: "negative",
                          qualityScore: qualityReport?.score,
                          isGuided: isGuidedFlow,
                        });
                      }}
                      style={[
                        resultStyles.actionBtn,
                        {
                          flex: 1,
                          backgroundColor:
                            qualityFeedbackVote === "negative" ? colors.error + "22" : colors.background,
                          borderWidth: 1,
                          borderColor: colors.border,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Text style={[resultStyles.actionBtnText, { color: colors.foreground }]}>👎 À corriger</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Actions */}
                <View style={resultStyles.actionsGrid}>
                  {/* Sauvegarder dans Mon Écrin */}
                  <TouchableOpacity
                    onPress={async () => {
                      if (isSaved) return;
                      const localItem = {
                        id: Date.now(),
                        name: selectedJewelry?.label ?? "Bijou essayé",
                        type: selectedJewelryType,
                        metal: "Gold",
                        brand: "L'Écrin",
                        imageUri: resultImageUrl ?? undefined,
                        isFavorite: false,
                        collection: null,
                        tags: null,
                        createdAt: new Date().toISOString(),
                      };

                      try {
                        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
                        const raw = await AsyncStorage.getItem(LOCAL_COLLECTION_KEY);
                        const parsed = raw ? JSON.parse(raw) : [];
                        const existing = Array.isArray(parsed) ? parsed : [];
                        existing.unshift(localItem);
                        await AsyncStorage.setItem(
                          LOCAL_COLLECTION_KEY,
                          JSON.stringify(existing.slice(0, 200)),
                        );

                        // Si l'utilisateur est authentifié côté backend, on sync en plus.
                        setIsSaved(true);
                        void recordLookAction("save").catch(() => undefined);
                        trackLookSaved({
                          mode: tryOnMode,
                          target: "ecrin",
                          isGuided: isGuidedFlow,
                          aiCostUsd: typeof lastAiCostUsd === "number" ? lastAiCostUsd : undefined,
                        });
                        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        if (!user) {
                          Alert.alert(
                            "Sauvegardé localement",
                            "Ce look est enregistré sur cet appareil. Connectez-vous plus tard pour la synchronisation cloud.",
                          );
                        }
                        // Sync cloud en tâche secondaire pour ne pas casser l'UX locale
                        if (user) {
                          addToCollectionMutation
                            .mutateAsync({
                              name: selectedJewelry?.label ?? "Bijou essayé",
                              type: selectedJewelryType,
                              imageUri: resultImageUrl ?? undefined,
                            })
                            .catch((e) => {
                              console.warn("[TryOn] Cloud sync failed, local save kept:", e);
                            });
                        }
                      } catch (e) {
                        console.warn("[TryOn] Local save failed:", e);
                        Alert.alert("Erreur", "Impossible de sauvegarder le look.");
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
                        void recordLookAction("share").catch(() => undefined);
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
                        trackLookSaved({
                          mode: tryOnMode,
                          target: "dressing",
                          isGuided: isGuidedFlow,
                          aiCostUsd: typeof lastAiCostUsd === "number" ? lastAiCostUsd : undefined,
                        });
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
                        void recordLookAction("share").catch(() => undefined);
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
                    if (!resultImageUrl) return;
                    if (!user) {
                      Alert.alert(
                        "Connexion requise",
                        "Connectez-vous pour publier dans la communauté.",
                        [
                          { text: "Plus tard", style: "cancel" },
                          { text: "Se connecter", onPress: () => router.push("/login") },
                        ],
                      );
                      return;
                    }
                    Alert.alert("Publier dans la Communauté", "Partager cet essayage maintenant ?", [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Publier",
                        onPress: async () => {
                          try {
                            await createCommunityPostMutation.mutateAsync({
                              authorName: user.name || user.email?.split("@")[0] || "Membre",
                              content: `Mon essayage du jour: ${selectedJewelry?.label ?? "Look IA"} ✨`,
                              imageUrl: resultImageUrl,
                              jewelryType: tryOnMode,
                            });
                            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setShowResultModal(false);
                            Alert.alert("Publié !", "Votre essayage a été partagé dans la communauté.");
                          } catch (e) {
                            const message = e instanceof Error ? e.message : "Impossible de publier.";
                            Alert.alert("Erreur", message);
                          }
                        },
                      },
                    ]);
                  }}
                  style={[resultStyles.communityBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="person.2.fill" size={16} color={colors.primary} />
                  <Text style={[resultStyles.communityBtnText, { color: colors.primary }]}>Publier dans la Communauté</Text>
                </TouchableOpacity>

                {/* Export HD */}
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      if (!resultImageUrl) return;
                      const localUri = FileSystem.cacheDirectory + `ecrin_hd_${Date.now()}.jpg`;
                      await FileSystem.downloadAsync(resultImageUrl, localUri);
                      const canShare = await Sharing.isAvailableAsync();
                      if (canShare) {
                        await Sharing.shareAsync(localUri, {
                          mimeType: "image/jpeg",
                          dialogTitle: "Exporter HD",
                          UTI: "public.jpeg",
                        });
                      } else {
                        await Share.share({ url: resultImageUrl });
                      }
                    } catch {}
                  }}
                  style={[resultStyles.communityBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: 8 }]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="arrow.down.to.line" size={16} color={colors.foreground} />
                  <Text style={[resultStyles.communityBtnText, { color: colors.foreground }]}>Exporter HD</Text>
                </TouchableOpacity>

                {/* Rejet (apprentissage) */}
                <TouchableOpacity
                  onPress={async () => {
                    void recordLookAction("reject").catch(() => undefined);
                    Alert.alert("Merci", "Feedback enregistré. Les prochains looks seront ajustés.");
                  }}
                  style={[resultStyles.communityBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border, marginTop: 8 }]}
                  activeOpacity={0.85}
                >
                  <IconSymbol name="hand.thumbsdown" size={16} color={colors.muted} />
                  <Text style={[resultStyles.communityBtnText, { color: colors.muted }]}>Pas pour moi</Text>
                </TouchableOpacity>

                {/* Nouvel essayage */}
                <TouchableOpacity
                  onPress={() => {
                    setShowResultModal(false);
                    setResultImageUrl(null);
                    setIsSaved(false);
                    setLastAiCostUsd(null);
                  }}
                  style={[resultStyles.newTryBtn, { borderColor: colors.border }]}
                  activeOpacity={0.85}
                >
                  <Text style={[resultStyles.newTryBtnText, { color: colors.muted }]}>Nouvel essayage</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
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
        onPurchaseStoreProduct={subscription.purchaseStoreProduct}
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
  itemSource,
  onItemSourceChange,
  genderFilter,
  onGenderFilterChange,
}: {
  visible: boolean;
  title: string;
  subtitle: string;
  sections: { title: string; data: GalleryItem[] }[];
  onSelect: (item: GalleryItem) => void;
  onClose: () => void;
  imageMode: "cover" | "contain";
  colors: ReturnType<typeof useColors>;
  itemSource?: ItemSource;
  onItemSourceChange?: (source: ItemSource) => void;
  genderFilter?: GenderFilter;
  onGenderFilterChange?: (gender: GenderFilter) => void;
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

        {/* Source tabs: Démo / Mon Dressing / Catalogue */}
        {itemSource && onItemSourceChange && (
          <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border }}>
              {([
                { key: "demo" as ItemSource, label: "✨ Démo", emoji: "" },
                { key: "dressing" as ItemSource, label: "👗 Dressing", emoji: "" },
                { key: "catalogue" as ItemSource, label: "🛍 Catalogue", emoji: "" },
              ]).map((tab) => {
                const isActive = itemSource === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => {
                      onItemSourceChange(tab.key);
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      alignItems: "center",
                      backgroundColor: isActive ? colors.primary : "transparent",
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.3,
                      color: isActive ? colors.background : colors.muted,
                    }}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Gender filter for catalogue */}
            {itemSource === "catalogue" && genderFilter && onGenderFilterChange && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                {(["women", "men"] as GenderFilter[]).map((g) => {
                  const isActive = genderFilter === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => {
                        onGenderFilterChange(g);
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        alignItems: "center",
                        borderWidth: 1,
                        backgroundColor: isActive ? (g === "men" ? "#1E3A5F" : "#B5478A") : colors.surface,
                        borderColor: isActive ? (g === "men" ? "#1E3A5F" : "#B5478A") : colors.border,
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isActive ? "#FFF" : colors.muted,
                      }}>
                        {g === "women" ? "♀ FEMME" : "♂ HOMME"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

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

              {/* Empty state */}
              {section.data.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ fontSize: 32, marginBottom: 12 }}>
                    {itemSource === "dressing" ? "👗" : itemSource === "catalogue" ? "🛍" : "✨"}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, textAlign: "center" }}>
                    {itemSource === "dressing"
                      ? "Aucun article dans votre dressing"
                      : itemSource === "catalogue"
                      ? "Aucun article dans le catalogue"
                      : "Aucun article disponible"}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 4, maxWidth: 240 }}>
                    {itemSource === "dressing"
                      ? "Ajoutez des articles dans votre dressing avec une photo pour les essayer ici"
                      : itemSource === "catalogue"
                      ? `Aucun article ${genderFilter === "women" ? "femme" : "homme"} dans cette catégorie`
                      : "Sélectionnez un autre type d'article"}
                  </Text>
                </View>
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
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  photosRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 14,
    marginTop: 8,
  },
  photoCol: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  photoBox: {
    aspectRatio: 3 / 4,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 12,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
  },
  smallBtn: {
    flex: 1,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  smallBtnText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  fullBtn: {
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  fullBtnText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
    letterSpacing: 0.8,
  },
  tryOnBtn: {
    paddingVertical: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  tryOnBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  hintText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 10,
    letterSpacing: 0.4,
    lineHeight: 16,
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
