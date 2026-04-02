import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { analytics } from "@/services/analytics-service";
import {
  normalizePartnerJewelryImageUrl,
  shouldUseDemoJewelry,
} from "@/lib/boutique/partner-jewelry";

// Types
type JewelryType = "necklace" | "earrings" | "ring" | "bracelet" | "anklet" | "brooch" | "set";
type MetalType = "gold" | "silver" | "rose_gold" | "platinum" | "brass" | "copper" | "resin" | "polymer" | "other";
type GemType = "diamond" | "ruby" | "sapphire" | "emerald" | "pearl" | "crystal" | "none" | "other";

interface PartnerBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isPremium: boolean | null;
  isFeatured: boolean | null;
  specialty: string | null;
  country: string | null;
}

interface PartnerJewelry {
  id: string;
  brandId: string;
  name: string;
  type: JewelryType;
  description: string | null;
  priceInCents: number | null;
  currency: string | null;
  imageUrl: string | number | { uri: string } | null;
  productUrl: string | null;
  metalType: MetalType | null;
  gemType: GemType | null;
  collection: string | null;
  tags: string | null;
  isTryOnEnabled: boolean | null;
  tryOnImageUrl: string | null;
}

// Filter options
const JEWELRY_TYPES: { value: JewelryType | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "necklace", label: "Colliers" },
  { value: "earrings", label: "Boucles d'oreilles" },
  { value: "ring", label: "Bagues" },
  { value: "bracelet", label: "Bracelets" },
  { value: "anklet", label: "Chevillières" },
  { value: "brooch", label: "Broches" },
  { value: "set", label: "Parures" },
];

const METAL_TYPES: { value: MetalType | "all"; label: string }[] = [
  { value: "all", label: "Tous métaux" },
  { value: "gold", label: "Or" },
  { value: "silver", label: "Argent" },
  { value: "rose_gold", label: "Or rose" },
  { value: "platinum", label: "Platine" },
  { value: "resin", label: "Résine" },
  { value: "polymer", label: "Polymère" },
  { value: "other", label: "Autre" },
];

const GEM_TYPES: { value: GemType | "all"; label: string }[] = [
  { value: "all", label: "Toutes pierres" },
  { value: "diamond", label: "Diamant" },
  { value: "ruby", label: "Rubis" },
  { value: "sapphire", label: "Saphir" },
  { value: "emerald", label: "Émeraude" },
  { value: "pearl", label: "Perle" },
  { value: "crystal", label: "Cristal" },
  { value: "none", label: "Sans pierre" },
];

// Partenaire exclusif: Moni'attitude
const DEMO_BRAND: PartnerBrand = {
  id: "1",
  name: "Moni'attitude",
  slug: "moniattitude",
  description: "Bijoux artisanaux uniques et significatifs. Soignez votre bien-être avec nos créations faites main en argile polymère et résine UV.",
  logoUrl: null,
  websiteUrl: "https://moniattitude.com",
  isPremium: true,
  isFeatured: true,
  specialty: "Bijoux artisanaux - Pièces uniques faites main",
  country: "Belgique",
};

const DEMO_JEWELRY: PartnerJewelry[] = [
  // Collection Fleurs
  {
    id: "1",
    brandId: "1",
    name: "Boucles d'oreilles fleur dorée",
    type: "earrings",
    description: "Sublimez votre look avec cette paire de boucles d'oreilles artisanales en forme de fleur, minutieusement confectionnées à la main. Grâce à un élégant mélange de nuances or et reflets métallisés, elles apportent une touche naturelle et sophistiquée. Légères et agréables à porter, environ 2 cm de diamètre. Puce en acier inoxydable.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F223655cb-e35b-42b9-9762-6496fba3ad45.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Fleurs",
    tags: JSON.stringify(["fleur", "doré", "fait main", "argile polymère"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "2",
    brandId: "1",
    name: "Boucles d'oreilles fleur vertes",
    type: "earrings",
    description: "Boucles d'oreilles artisanales en forme de fleur dans un magnifique vert émeraude. Chaque modèle est créé une seule fois dans l'atelier Moni'attitude. Puce en acier inoxydable.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F8429df8d-f6fb-49a7-83e1-a4f04182d234.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Fleurs",
    tags: JSON.stringify(["fleur", "vert", "fait main", "argile polymère"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "3",
    brandId: "1",
    name: "Boucles d'oreilles fleur duo",
    type: "earrings",
    description: "Boucles d'oreilles fleur duo en pâte polymère, pièce unique faite main. Design élégant avec deux fleurs assorties. Puce en acier inoxydable.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fe2ce5eac-b2fe-4b93-a177-b74c2c3d272a.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Fleurs",
    tags: JSON.stringify(["fleur", "duo", "fait main", "pâte polymère"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  // Collection Cœurs
  {
    id: "4",
    brandId: "1",
    name: "Boucles d'oreilles cœur tendre",
    type: "earrings",
    description: "Adorables boucles d'oreilles en forme de cœur, faites main avec amour. Idéales pour exprimer votre côté romantique. Puce en acier inoxydable.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F3d65f8f0-2811-4400-9346-2285d731ae43.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Cœurs",
    tags: JSON.stringify(["cœur", "romantique", "fait main"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "5",
    brandId: "1",
    name: "Boucles d'oreilles artisanales",
    type: "earrings",
    description: "Boucles d'oreilles artisanales en argile polymère. Création unique faite main dans l'atelier Moni'attitude. Parfaites pour toutes les occasions.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F5c3ce63a-9a59-492b-adb5-f2f38d001877.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Artisanales",
    tags: JSON.stringify(["artisanal", "fait main", "unique"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "6",
    brandId: "1",
    name: "Boucles d'oreilles cœur rouge",
    type: "earrings",
    description: "Boucles d'oreilles cœur rouge passion, faites main en argile polymère. Pièce unique de l'atelier Moni'attitude.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fa8a7729d-580e-42e9-897b-263560a2b04e.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Cœurs",
    tags: JSON.stringify(["cœur", "rouge", "passion", "fait main"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  // Collection Géométrique
  {
    id: "7",
    brandId: "1",
    name: "Boucles d'oreilles texturées",
    type: "earrings",
    description: "Boucles d'oreilles texturées et Acier inoxydable. Design moderne et élégant. Artisanat local belge, pièce unique.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F2f0c9074-1d10-48f5-8d38-38ed4cfe24ba.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Géométrique",
    tags: JSON.stringify(["géométrique", "texturé", "moderne", "artisanat local"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "8",
    brandId: "1",
    name: "Boucles d'oreilles géométriques blanches pailletées",
    type: "earrings",
    description: "Boucles d'oreilles géométriques blanches avec paillettes argent. Design élégant fait main.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F01604c9d-7c5a-40ee-b909-1a4723b35f51.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Géométrique",
    tags: JSON.stringify(["géométrique", "blanc", "paillettes", "argent"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  // Collection Résine
  {
    id: "9",
    brandId: "1",
    name: "Boucles d'oreilles en résine",
    type: "earrings",
    description: "Boucles d'oreilles artisanales en résine UV avec reflets uniques. Chaque paire est une création originale.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fa8a7729d-580e-42e9-897b-263560a2b04e.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "resin",
    gemType: "none",
    collection: "Résine",
    tags: JSON.stringify(["résine UV", "artisanal", "reflets"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "10",
    brandId: "1",
    name: "Boucles d'oreilles en résine orange",
    type: "earrings",
    description: "Sublimez votre look avec cette paire de boucles d'oreilles artisanales en résine orange éclatante. Ornées de paillettes scintillantes et de détails dorés. Environ 4 cm.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fe8e92430-3df4-42fa-b27f-114bccebc4cb.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "resin",
    gemType: "none",
    collection: "Résine",
    tags: JSON.stringify(["résine", "orange", "fait main", "paillettes"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  // Collection Feuilles
  {
    id: "11",
    brandId: "1",
    name: "Boucles d'oreilles feuille métalisée",
    type: "earrings",
    description: "Boucles d'oreilles en forme de feuille avec finition métallisée. Inspirées par la nature, faites main.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2F1278bc3a-40dc-4bc2-9ae1-4b3090f43f42.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Feuilles",
    tags: JSON.stringify(["feuille", "métallisé", "nature", "fait main"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
  {
    id: "12",
    brandId: "1",
    name: "Boucles d'oreilles feuilles sculptées",
    type: "earrings",
    description: "Boucles d'oreilles feuilles sculptées à la main. Artisanat belge, pièce unique.",
    priceInCents: null,
    currency: null,
    imageUrl: { uri: "https://cdn.zyrosite.com/cdn-cgi/image/format=auto,w=375,h=375,fit=crop,q=100/cdn-ecommerce/store_01K3TQM870EP842MGTADV6KKSD%2Fassets%2Fdbd8d4c7-b6d5-451d-9e7a-4eed325d8f44.jpeg" },
    productUrl: "https://moniattitude.com/boutique-de-bijoux-artisanaux",
    metalType: "polymer",
    gemType: "none",
    collection: "Feuilles",
    tags: JSON.stringify(["feuille", "sculpté", "artisanat", "nature"]),
    isTryOnEnabled: true,
    tryOnImageUrl: null,
  },
];

// Format price
function formatPrice(priceInCents: number | null, currency: string | null): string {
  // Prix non affichés - redirection vers moniattitude.com
  return "Voir sur moniattitude.com";
}

// Parse tags
function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

const boutiqueStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "300",
    letterSpacing: 6,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: 3,
  },
  partnerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  partnerBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  visitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 20,
  },
  visitBtnText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
  },
  headerAccentLine: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 4,
    opacity: 0.4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 0.3,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  // JewelryCard
  card: {
    width: "47.5%",
    borderWidth: 1,
    overflow: "hidden",
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardFavBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cardCollectionBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  cardCollectionText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.9)",
  },
  cardContent: {
    padding: 12,
  },
  cardName: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  cardBrand: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 3,
  },
  cardTryBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  cardTryBtnText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2,
  },
  // BrandCard
  brandCard: {
    width: 170,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandInitial: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitialText: {
    fontSize: 22,
    fontWeight: "300",
  },
  brandName: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandDesc: {
    fontSize: 10,
    fontWeight: "300",
    lineHeight: 15,
  },
});

// Brand Card Component
function BrandCard({ brand, onPress }: { brand: PartnerBrand; onPress: () => void }) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[boutiqueStyles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={{ alignItems: "center", marginBottom: 10 }}>
        {brand.logoUrl ? (
          <Image
            source={{ uri: brand.logoUrl }}
            style={{ width: 60, height: 60 }}
            contentFit="cover"
          />
        ) : (
          <View style={[boutiqueStyles.brandInitial, { backgroundColor: colors.border }]}>
            <Text style={[boutiqueStyles.brandInitialText, { color: colors.muted }]}>
              {brand.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <Text style={[boutiqueStyles.brandName, { color: colors.foreground }]} numberOfLines={1}>
        {brand.name}
      </Text>

      <Text style={[boutiqueStyles.brandDesc, { color: colors.muted }]} numberOfLines={2}>
        {brand.specialty || brand.description}
      </Text>

      <TouchableOpacity
        onPress={() => {
          if (brand.websiteUrl) {
            Linking.openURL(brand.websiteUrl);
          }
        }}
        className="flex-row items-center justify-center py-2 border border-border rounded-lg"
        activeOpacity={0.7}
      >
        <Text className="text-sm text-foreground mr-1">Visiter la Marque</Text>
        <IconSymbol name="arrow.up.right" size={14} color={colors.foreground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// Jewelry Card Component
function JewelryCard({
  jewelry,
  brand,
  isFavorite,
  onPress,
  onFavoriteToggle,
  onTryOn,
}: {
  jewelry: PartnerJewelry;
  brand: PartnerBrand | undefined;
  isFavorite: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
  onTryOn: () => void;
}) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[boutiqueStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.75}
    >
      {/* Image */}
      <View style={{ position: "relative" }}>
        {jewelry.imageUrl ? (
          <Image
            source={typeof jewelry.imageUrl === 'string' ? { uri: jewelry.imageUrl } : jewelry.imageUrl}
            style={{ width: "100%", height: 190 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{ width: "100%", height: 190, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }}
          >
            <IconSymbol name="diamond.fill" size={48} color={colors.muted} />
          </View>
        )}

        {/* Favorite button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          style={boutiqueStyles.cardFavBtn}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={isFavorite ? "heart.fill" : "heart"}
            size={15}
            color={isFavorite ? "#C9A96E" : "#fff"}
          />
        </TouchableOpacity>

        {/* Collection badge */}
        {jewelry.collection && (
          <View style={boutiqueStyles.cardCollectionBadge}>
            <Text style={boutiqueStyles.cardCollectionText}>
              {jewelry.collection.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={boutiqueStyles.cardContent}>
        <Text style={[boutiqueStyles.cardName, { color: colors.foreground }]} numberOfLines={2}>
          {jewelry.name}
        </Text>
        <Text style={[boutiqueStyles.cardBrand, { color: colors.primary }]}>
          {(brand?.name || "MONI'ATTITUDE").toUpperCase()}
        </Text>
        {jewelry.isTryOnEnabled && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onTryOn();
            }}
            style={[boutiqueStyles.cardTryBtn, { backgroundColor: colors.foreground }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="sparkles" size={10} color={colors.background} />
            <Text style={[boutiqueStyles.cardTryBtnText, { color: colors.background }]}>ESSAYER</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Filter Dropdown Component
function FilterDropdown({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <View className="relative">
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center bg-surface px-3 py-2 rounded-lg border border-border mr-2"
        activeOpacity={0.7}
      >
        <Text className="text-sm text-foreground mr-1" numberOfLines={1}>
          {selectedOption?.label || label}
        </Text>
        <IconSymbol name="chevron.down" size={16} color={colors.muted} />
      </TouchableOpacity>

      {isOpen && (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center"
            onPress={() => setIsOpen(false)}
          >
            <View className="bg-background rounded-2xl p-4 w-64 max-h-80">
              <Text className="text-lg font-semibold text-foreground mb-3">{label}</Text>
              <ScrollView>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`py-3 px-3 rounded-lg mb-1 ${value === option.value ? 'bg-primary/10' : ''}`}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-base ${value === option.value ? 'text-primary font-medium' : 'text-foreground'}`}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// Main Screen
export default function BoutiqueScreen() {
  const colors = useColors();
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<JewelryType | "all">("all");
  const [selectedMetal, setSelectedMetal] = useState<MetalType | "all">("all");
  const [selectedGem, setSelectedGem] = useState<GemType | "all">("all");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedJewelry, setSelectedJewelry] = useState<PartnerJewelry | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // API queries - Supabase via tRPC
  const brandsQuery = trpc.partnerBrands.list.useQuery();
  const jewelryQuery = trpc.partnerJewelry.list.useQuery({
    brandId: selectedBrandId ?? undefined,
    type: selectedType !== "all" ? selectedType : undefined,
    metalType: selectedMetal !== "all" ? selectedMetal : undefined,
    gemType: selectedGem !== "all" ? selectedGem : undefined,
    search: searchQuery || undefined,
  });

  // Fallback to demo data if Supabase returns nothing
  const rawBrands = brandsQuery.data && brandsQuery.data.length > 0 ? brandsQuery.data : [DEMO_BRAND];
  const fetchedJewelry = jewelryQuery.data ?? [];
  // Si Supabase renvoie des lignes mais sans URLs d'images utilisables,
  // on force le fallback démo (sinon on a uniquement des placeholders).
  const rawJewelry =
    fetchedJewelry.length > 0 && !shouldUseDemoJewelry(fetchedJewelry)
      ? fetchedJewelry
      : DEMO_JEWELRY;
  const isLoading = jewelryQuery.isLoading;

  // Normalize brands to PartnerBrand type
  const brands: PartnerBrand[] = rawBrands.map(b => ({
    id: String(b.id),
    name: b.name,
    slug: (b as { slug?: string }).slug ?? b.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    description: b.description ?? null,
    logoUrl: (b as { logoUrl?: string }).logoUrl ?? null,
    websiteUrl: (b as { websiteUrl?: string }).websiteUrl ?? null,
    isPremium: (b as { isPremium?: boolean }).isPremium ?? null,
    isFeatured: (b as { isFeatured?: boolean }).isFeatured ?? null,
    specialty: (b as { specialty?: string }).specialty ?? null,
    country: (b as { country?: string }).country ?? null,
  }));

  // Normalize jewelry to PartnerJewelry type
  const jewelry: PartnerJewelry[] = rawJewelry.map(j => {
    // Handle both camelCase and snake_case field names from database
    const jAny = j as any;
    const imageUrlValue = jAny.imageUrl || jAny.image_url || null;

    return {
      id: String(j.id),
      brandId: String(jAny.brandId ?? jAny.brand_id ?? 1),
      name: j.name,
      type: (j.type as JewelryType) ?? "earrings",
      description: j.description ?? null,
      priceInCents: jAny.priceInCents ?? jAny.price_in_cents ?? null,
      currency: jAny.currency ?? null,
      imageUrl: normalizePartnerJewelryImageUrl(imageUrlValue),
      productUrl: jAny.productUrl ?? jAny.product_url ?? null,
      metalType: jAny.metalType ?? jAny.metal_type ?? null,
      gemType: jAny.gemType ?? jAny.gem_type ?? null,
      collection: jAny.collection ?? null,
      tags: jAny.tags ?? null,
      isTryOnEnabled: jAny.isTryOnEnabled ?? jAny.is_try_on_enabled ?? true,
      tryOnImageUrl: jAny.tryOnImageUrl ?? jAny.try_on_image_url ?? null,
    };
  });

  // Filter jewelry
  const filteredJewelry = useMemo(() => {
    let filtered = jewelry;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(j =>
        j.name.toLowerCase().includes(query) ||
        j.description?.toLowerCase().includes(query) ||
        parseTags(j.tags).some(t => t.toLowerCase().includes(query))
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(j => j.type === selectedType);
    }

    if (selectedMetal !== "all") {
      filtered = filtered.filter(j => j.metalType === selectedMetal);
    }

    if (selectedGem !== "all") {
      filtered = filtered.filter(j => j.gemType === selectedGem);
    }

    if (selectedBrandId) {
      filtered = filtered.filter(j => j.brandId === selectedBrandId);
    }

    return filtered;
  }, [jewelry, searchQuery, selectedType, selectedMetal, selectedGem, selectedBrandId]);

  // Get brand by ID
  const getBrand = useCallback((brandId: string) => {
    return brands.find(b => b.id === brandId);
  }, [brands]);

  // Toggle favorite
  const toggleFavorite = useCallback((jewelryId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Find the jewelry item for tracking
    const jewelry = filteredJewelry.find(j => j.id === jewelryId) || DEMO_JEWELRY.find((j: PartnerJewelry) => j.id === jewelryId);

    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(jewelryId)) {
        next.delete(jewelryId);
        // Track unfavorite
        if (jewelry) {
          analytics.trackProductUnfavorited({
            productId: String(jewelry.id),
            productName: jewelry.name,
            collection: jewelry.collection || undefined,
            category: jewelry.type,
          });
        }
      } else {
        next.add(jewelryId);
        // Track favorite
        if (jewelry) {
          analytics.trackProductFavorited({
            productId: String(jewelry.id),
            productName: jewelry.name,
            collection: jewelry.collection || undefined,
            category: jewelry.type,
          });
        }
      }
      return next;
    });
  }, [filteredJewelry]);

  // Handle try-on
  const handleTryOn = useCallback((jewelry: PartnerJewelry) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Track try-on event
    analytics.trackTryOnStarted({
      productId: String(jewelry.id),
      productName: jewelry.name,
      collection: jewelry.collection || undefined,
      category: jewelry.type,
    });
    // Navigate to try-on screen with jewelry info
    router.push({
      pathname: "/(tabs)/tryon",
      params: {
        partnerJewelryId: jewelry.id,
        partnerJewelryName: jewelry.name,
        partnerJewelryType: jewelry.type,
        partnerJewelryImage: typeof jewelry.imageUrl === 'object' && jewelry.imageUrl !== null && 'uri' in jewelry.imageUrl ? jewelry.imageUrl.uri : (jewelry.imageUrl as string) || "",
      },
    });
  }, [router]);

  // Handle visit brand
  const handleVisitBrand = useCallback((brand: PartnerBrand) => {
    if (brand.websiteUrl) {
      // Track brand visit
      analytics.track('brand_website_visited', {
        brandId: String(brand.id),
        brandName: brand.name,
        websiteUrl: brand.websiteUrl,
      });
      Linking.openURL(brand.websiteUrl);
    }
  }, []);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header luxe */}
        <View style={boutiqueStyles.header}>
          <View>
            <Text style={[boutiqueStyles.title, { color: colors.foreground }]}>BOUTIQUE</Text>
            <Text style={[boutiqueStyles.subtitle, { color: colors.primary }]}>MONI'ATTITUDE · BELGIQUE</Text>
          </View>
          <TouchableOpacity
            onPress={() => handleVisitBrand(DEMO_BRAND)}
            style={[boutiqueStyles.visitBtn, { borderColor: colors.primary }]}
          >
            <Text style={[boutiqueStyles.visitBtnText, { color: colors.primary }]}>VISITER ↗</Text>
          </TouchableOpacity>
        </View>

        {/* Ligne décorative or */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.border, opacity: 0.5 }} />
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primary, marginHorizontal: 10 }} />
          <View style={{ flex: 1, height: 0.5, backgroundColor: colors.border, opacity: 0.5 }} />
        </View>

        {/* Search Bar */}
        <View style={[boutiqueStyles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={15} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher un bijou..."
            placeholderTextColor={colors.muted}
            style={[boutiqueStyles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <IconSymbol name="xmark" size={13} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        >
          {JEWELRY_TYPES.map(type => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setSelectedType(type.value)}
              style={[
                boutiqueStyles.filterChip,
                {
                  borderColor: selectedType === type.value ? colors.primary : colors.border,
                  backgroundColor: selectedType === type.value ? colors.foreground : colors.surface,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                boutiqueStyles.filterChipText,
                { color: selectedType === type.value ? colors.background : colors.muted },
              ]}>
                {type.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Jewelry Grid */}
        <View style={boutiqueStyles.grid}>
          {isLoading ? (
            <View style={{ flex: 1, alignItems: "center", paddingVertical: 48 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, fontSize: 11, color: colors.muted, letterSpacing: 1 }}>CHARGEMENT...</Text>
            </View>
          ) : filteredJewelry.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", paddingVertical: 48, gap: 12 }}>
              <IconSymbol name="magnifyingglass" size={40} color={colors.muted} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>Aucun bijou trouvé</Text>
              <Text style={{ fontSize: 11, color: colors.muted, textAlign: "center", maxWidth: 220, lineHeight: 18 }}>
                Essayez de modifier vos filtres ou votre recherche
              </Text>
            </View>
          ) : (
            <View style={boutiqueStyles.grid}>
              {filteredJewelry.map(item => (
                <JewelryCard
                  key={item.id}
                  jewelry={item}
                  brand={getBrand(item.brandId)}
                  isFavorite={favorites.has(item.id)}
                  onPress={() => {
                    analytics.trackProductViewed({
                      productId: String(item.id),
                      productName: item.name,
                      collection: item.collection || undefined,
                      category: item.type,
                    });
                    setSelectedJewelry(item);
                  }}
                  onFavoriteToggle={() => toggleFavorite(item.id)}
                  onTryOn={() => handleTryOn(item)}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─── Devenir Partenaire ─────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginBottom: 40 }}>
          <View style={[{
            padding: 28,
            alignItems: "center",
            gap: 6,
            borderRadius: 20,
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.07,
            shadowRadius: 12,
            elevation: 3,
          }, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ width: 32, height: 1, backgroundColor: colors.primary, opacity: 0.6, marginBottom: 10 }} />
            <Text style={{ fontSize: 8, letterSpacing: 3.5, fontWeight: "700", color: colors.primary }}>
              VOUS ÊTES CRÉATEUR ?
            </Text>
            <Text style={{ fontSize: 22, fontWeight: "300", letterSpacing: 1, textAlign: "center", color: colors.foreground, marginTop: 4 }}>
              Rejoignez{"\n"}L'Écrin Virtuel
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 19, textAlign: "center", color: colors.muted, maxWidth: 260, marginTop: 6 }}>
              Présentez vos créations à notre communauté et offrez une expérience d'essayage unique par IA.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/partner")}
              style={[{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 28,
                paddingVertical: 16,
                borderRadius: 14,
                marginTop: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 5,
              }, { backgroundColor: colors.foreground }]}
              activeOpacity={0.85}
            >
              <IconSymbol name="sparkles" size={15} color={colors.background} />
              <Text style={{ fontSize: 11, fontWeight: "700", letterSpacing: 2, color: colors.background }}>
                DEVENIR PARTENAIRE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Jewelry Detail Modal */}
      <Modal
        visible={selectedJewelry !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedJewelry(null)}
      >
        {selectedJewelry && (
          <View className="flex-1 bg-background">
            <ScrollView className="flex-1">
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-border">
                <TouchableOpacity onPress={() => setSelectedJewelry(null)}>
                  <IconSymbol name="xmark" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-foreground">Détails</Text>
                <TouchableOpacity onPress={() => toggleFavorite(selectedJewelry.id)}>
                  <IconSymbol
                    name={favorites.has(selectedJewelry.id) ? "heart.fill" : "heart"}
                    size={24}
                    color={favorites.has(selectedJewelry.id) ? "#EF4444" : colors.foreground}
                  />
                </TouchableOpacity>
              </View>

              {/* Image */}
              {selectedJewelry.imageUrl && (
                <Image
                  source={typeof selectedJewelry.imageUrl === 'string' ? { uri: selectedJewelry.imageUrl } : selectedJewelry.imageUrl}
                  style={{ width: "100%", height: 300 }}
                  contentFit="cover"
                />
              )}

              {/* Content */}
              <View className="p-4">
                <Text className="text-xs text-primary font-medium uppercase">
                  {getBrand(selectedJewelry.brandId)?.name || "Marque"}
                </Text>

                <Text className="text-2xl font-bold text-foreground mt-1">
                  {selectedJewelry.name}
                </Text>

                <Text className="text-2xl font-bold text-primary mt-2">
                  {formatPrice(selectedJewelry.priceInCents, selectedJewelry.currency)}
                </Text>

                {selectedJewelry.description && (
                  <Text className="text-base text-muted mt-4 leading-6">
                    {selectedJewelry.description}
                  </Text>
                )}

                {/* Tags */}
                {parseTags(selectedJewelry.tags).length > 0 && (
                  <View className="flex-row flex-wrap mt-4 gap-2">
                    {parseTags(selectedJewelry.tags).map((tag, index) => (
                      <View key={index} className="bg-surface px-3 py-1.5 rounded-full">
                        <Text className="text-sm text-foreground">{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Details */}
                <View className="mt-6 bg-surface rounded-xl p-4">
                  <Text className="text-base font-semibold text-foreground mb-3">
                    Caractéristiques
                  </Text>

                  {selectedJewelry.metalType && (
                    <View className="flex-row justify-between py-2 border-b border-border">
                      <Text className="text-sm text-muted">Matériau</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {METAL_TYPES.find(m => m.value === selectedJewelry.metalType)?.label || selectedJewelry.metalType}
                      </Text>
                    </View>
                  )}

                  {selectedJewelry.gemType && selectedJewelry.gemType !== "none" && (
                    <View className="flex-row justify-between py-2 border-b border-border">
                      <Text className="text-sm text-muted">Pierre</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {GEM_TYPES.find(g => g.value === selectedJewelry.gemType)?.label || selectedJewelry.gemType}
                      </Text>
                    </View>
                  )}

                  {selectedJewelry.collection && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-sm text-muted">Collection</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {selectedJewelry.collection}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="p-4 border-t border-border bg-background">
              <View className="flex-row gap-3">
                {selectedJewelry.isTryOnEnabled && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedJewelry(null);
                      handleTryOn(selectedJewelry);
                    }}
                    className="flex-1 bg-surface py-4 rounded-xl flex-row items-center justify-center"
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="camera.fill" size={20} color={colors.foreground} />
                    <Text className="text-base font-semibold text-foreground ml-2">
                      Essayer
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    const brand = getBrand(selectedJewelry.brandId);
                    if (selectedJewelry.productUrl) {
                      Linking.openURL(selectedJewelry.productUrl);
                    } else if (brand?.websiteUrl) {
                      Linking.openURL(brand.websiteUrl);
                    }
                  }}
                  className="flex-1 bg-primary py-4 rounded-xl flex-row items-center justify-center"
                  activeOpacity={0.7}
                >
                  <IconSymbol name="arrow.up.right" size={20} color="#fff" />
                  <Text className="text-base font-semibold text-white ml-2">
                    Voir sur le site
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </ScreenContainer>
  );
}
