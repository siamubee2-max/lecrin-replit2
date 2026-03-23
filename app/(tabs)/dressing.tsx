import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
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

interface WardrobeItem {
  id: number;
  name: string;
  category: WardrobeCategory;
  brand?: string | null;
  color?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  isFavorite?: boolean | null;
  isDemo?: boolean;
}

// ─── Sections config ──────────────────────────────────────────────────────────
const SECTIONS: {
  id: DressingSection;
  label: string;
  emoji: string;
  categories: WardrobeCategory[];
  defaultCategory: WardrobeCategory;
  placeholder: string;
}[] = [
  {
    id: "jewelry",
    label: "BIJOUX",
    emoji: "💎",
    categories: ["accessories"],
    defaultCategory: "accessories",
    placeholder: "Ex: Boucles dorées Moni'attitude",
  },
  {
    id: "shoes",
    label: "CHAUSSURES",
    emoji: "👠",
    categories: ["shoes"],
    defaultCategory: "shoes",
    placeholder: "Ex: Escarpins nude Jonak",
  },
  {
    id: "clothing",
    label: "VÊTEMENTS",
    emoji: "👗",
    categories: ["tops", "bottoms", "dresses", "outerwear"],
    defaultCategory: "tops",
    placeholder: "Ex: Robe cocktail noire Ba&sh",
  },
  {
    id: "accessories",
    label: "ACCESSOIRES",
    emoji: "👜",
    categories: ["bags", "other"],
    defaultCategory: "bags",
    placeholder: "Ex: Sac cuir caramel Polène",
  },
];

const CATEGORY_LABELS: Record<WardrobeCategory, string> = {
  tops: "Haut",
  bottoms: "Bas",
  dresses: "Robe",
  outerwear: "Veste",
  shoes: "Chaussures",
  bags: "Sac",
  accessories: "Bijou / Accessoire",
  other: "Autre",
};

const SECTION_SUBCATEGORIES: Record<
  DressingSection,
  { id: WardrobeCategory; label: string }[]
> = {
  jewelry: [{ id: "accessories", label: "Bijou" }],
  shoes: [{ id: "shoes", label: "Chaussures" }],
  clothing: [
    { id: "tops", label: "Haut" },
    { id: "bottoms", label: "Bas" },
    { id: "dresses", label: "Robe" },
    { id: "outerwear", label: "Veste" },
  ],
  accessories: [
    { id: "bags", label: "Sac" },
    { id: "other", label: "Autre" },
  ],
};

// ─── Demo items ───────────────────────────────────────────────────────────────
const DEMO_ITEMS: WardrobeItem[] = [
  // Bijoux
  {
    id: -10,
    name: "Boucles Fleur Dorée",
    category: "accessories",
    brand: "Moni'attitude",
    color: "gold",
    imageUrl:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943/foIbwvIEZnQRCkLk.jpeg",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -11,
    name: "Boucles Résine Orange",
    category: "accessories",
    brand: "Moni'attitude",
    color: "orange",
    imageUrl:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943/rjfmUlamBZcBgUfF.jpeg",
    isFavorite: false,
    isDemo: true,
  },
  {
    id: -12,
    name: "Collier Chaîne Dorée",
    category: "accessories",
    brand: "Moni'attitude",
    color: "gold",
    imageUrl:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943/jGuXuEkhGyksTrjf.png",
    isFavorite: false,
    isDemo: true,
  },
  // Chaussures
  {
    id: -20,
    name: "Escarpins Nude",
    category: "shoes",
    brand: "Jonak",
    color: "beige",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_sandals_nude-A8rHiR6HNekahFBBff3Anu.png",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -21,
    name: "Sneakers Blanches",
    category: "shoes",
    brand: "Nike",
    color: "white",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_sneakers_white-TcUCe77Tti8vbH2Tg2aasU.png",
    isFavorite: false,
    isDemo: true,
  },
  {
    id: -22,
    name: "Bottines Noires",
    category: "shoes",
    brand: "Sandro",
    color: "black",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/shoes_boots_black-h7zsKaSzi9qv5jNSQAHbHy.png",
    isFavorite: true,
    isDemo: true,
  },
  // Vêtements
  {
    id: -30,
    name: "Chemisier Soie Ivoire",
    category: "tops",
    brand: "Sandro",
    color: "beige",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_blouse_ivory-FqFvVqikVUAH8cJaGp8y2Q.png",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -31,
    name: "Pantalon Tailleur Marine",
    category: "bottoms",
    brand: "Maje",
    color: "navy",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_pants_navy-mtvRm4h698yNo9YWgMgVkq.png",
    isFavorite: false,
    isDemo: true,
  },
  {
    id: -32,
    name: "Robe Cocktail Noire",
    category: "dresses",
    brand: "Ba&sh",
    color: "black",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_dress_black-C4XiYtX54R2EZijznwBAsb.png",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -33,
    name: "Blazer Camel",
    category: "outerwear",
    brand: "The Kooples",
    color: "beige",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/clothing_blazer_camel-auFvdrjD8tJ3RwphvuczjX.png",
    isFavorite: false,
    isDemo: true,
  },
  // Accessoires
  {
    id: -40,
    name: "Sac Cuir Caramel",
    category: "bags",
    brand: "Polène",
    color: "brown",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_bag_black-gMLsmwChKXggLLiGyaLkMb.png",
    isFavorite: true,
    isDemo: true,
  },
  {
    id: -41,
    name: "Ceinture Dorée",
    category: "other",
    brand: "Zara",
    color: "gold",
    imageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK/accessory_belt_gold-Dk95mij6htDppq7nu96YMr.png",
    isFavorite: false,
    isDemo: true,
  },
];

const COLORS = [
  { id: "black", label: "Noir", hex: "#000000" },
  { id: "white", label: "Blanc", hex: "#FFFFFF" },
  { id: "beige", label: "Beige", hex: "#D4A574" },
  { id: "navy", label: "Marine", hex: "#1E3A5F" },
  { id: "red", label: "Rouge", hex: "#EF4444" },
  { id: "blue", label: "Bleu", hex: "#3B82F6" },
  { id: "green", label: "Vert", hex: "#22C55E" },
  { id: "pink", label: "Rose", hex: "#EC4899" },
  { id: "purple", label: "Violet", hex: "#8B5CF6" },
  { id: "orange", label: "Orange", hex: "#F97316" },
  { id: "brown", label: "Marron", hex: "#92400E" },
  { id: "gray", label: "Gris", hex: "#6B7280" },
  { id: "gold", label: "Doré", hex: "#D4AF37" },
  { id: "silver", label: "Argenté", hex: "#C0C0C0" },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DressingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<DressingSection>("jewelry");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { data: wardrobeItems = [], isLoading, refetch } = trpc.wardrobe.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const deleteItemMutation = trpc.wardrobe.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const allItems: WardrobeItem[] = useMemo(() => {
    if (!user || wardrobeItems.length === 0) return DEMO_ITEMS;
    return wardrobeItems as WardrobeItem[];
  }, [user, wardrobeItems]);

  const isShowingDemo = !user || wardrobeItems.length === 0;
  const currentSection = SECTIONS.find((s) => s.id === activeSection)!;

  const sectionItems = useMemo(() => {
    return allItems.filter((item) => {
      if (!currentSection.categories.includes(item.category)) return false;
      if (showFavoritesOnly) {
        const isFav = favoriteIds.has(item.id) || (item.isFavorite ?? false);
        if (!isFav) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.brand?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [allItems, currentSection, searchQuery, showFavoritesOnly, favoriteIds]);

  const handleToggleFavorite = useCallback(
    (id: number) => {
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );

  const handleTryOn = useCallback(
    (item: WardrobeItem) => {
      if (Platform.OS !== "web")
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(
        `/tryon?section=${activeSection}&itemId=${item.id}&itemName=${encodeURIComponent(item.name)}` as any
      );
    },
    [activeSection, router]
  );

  const handleDelete = useCallback(
    (id: number) => {
      if (id < 0) return;
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      deleteItemMutation.mutate({ id });
    },
    [deleteItemMutation]
  );

  // ─── Render item card ────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: WardrobeItem }) => {
      const isFav = favoriteIds.has(item.id) || (item.isFavorite ?? false);
      return (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Image */}
          <View
            style={[
              styles.cardImageContainer,
              { backgroundColor: colors.background },
            ]}
          >
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.cardImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Text style={styles.cardEmoji}>{currentSection.emoji}</Text>
              </View>
            )}
            {/* Favorite */}
            <TouchableOpacity
              style={styles.favBtn}
              onPress={() => handleToggleFavorite(item.id)}
            >
              <IconSymbol
                name="heart.fill"
                size={13}
                color={isFav ? "#E53E3E" : "rgba(255,255,255,0.6)"}
              />
            </TouchableOpacity>
            {/* Demo badge */}
            {item.isDemo && (
              <View
                style={[
                  styles.demoBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.demoBadgeText}>DÉMO</Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cardContent}>
            <Text
              style={[styles.cardName, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.brand && (
              <Text style={[styles.cardBrand, { color: colors.primary }]}>
                {item.brand.toUpperCase()}
              </Text>
            )}
            <Text style={[styles.cardCat, { color: colors.muted }]}>
              {CATEGORY_LABELS[item.category]}
            </Text>
            {/* Try-on button */}
            <TouchableOpacity
              style={[styles.tryBtn, { borderColor: colors.primary }]}
              onPress={() => handleTryOn(item)}
            >
              <IconSymbol name="wand.and.stars" size={11} color={colors.primary} />
              <Text style={[styles.tryBtnText, { color: colors.primary }]}>
                ESSAYER
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delete */}
          {!item.isDemo && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id)}
            >
              <IconSymbol name="xmark" size={11} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      );
    },
    [colors, currentSection, favoriteIds, handleToggleFavorite, handleTryOn, handleDelete]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            MON DRESSING
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>
            VIRTUEL
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus" size={18} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const count = allItems.filter((i) =>
            section.categories.includes(i.category)
          ).length;
          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.tab,
                {
                  borderBottomColor: isActive ? colors.primary : "transparent",
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => {
                if (Platform.OS !== "web")
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveSection(section.id);
                setSearchQuery("");
              }}
            >
              <Text style={styles.tabEmoji}>{section.emoji}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.primary : colors.muted },
                ]}
              >
                {section.label}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: isActive ? colors.background : colors.muted },
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.separator, { backgroundColor: colors.border }]} />

      {/* Search + Favoris filter */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
        <View
          style={[
            styles.searchBar,
            { flex: 1, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <IconSymbol name="magnifyingglass" size={15} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder={`Rechercher dans ${currentSection.label.toLowerCase()}…`}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <IconSymbol name="xmark.circle.fill" size={15} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
        {/* Bouton Favoris */}
        <TouchableOpacity
          style={[
            styles.favFilterBtn,
            {
              backgroundColor: showFavoritesOnly ? "#E53E3E" : colors.surface,
              borderColor: showFavoritesOnly ? "#E53E3E" : colors.border,
            },
          ]}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFavoritesOnly((prev) => !prev);
          }}
        >
          <IconSymbol
            name="heart.fill"
            size={16}
            color={showFavoritesOnly ? "#FFFFFF" : colors.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Demo banner */}
      {isShowingDemo && (
        <View
          style={[
            styles.demoBanner,
            {
              backgroundColor: colors.primary + "15",
              borderColor: colors.primary + "40",
            },
          ]}
        >
          <IconSymbol name="sparkles" size={13} color={colors.primary} />
          <Text style={[styles.demoBannerText, { color: colors.primary }]}>
            Connectez-vous pour sauvegarder votre dressing
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Chargement…
          </Text>
        </View>
      ) : sectionItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{currentSection.emoji}</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Aucun article
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            Ajoutez vos {currentSection.label.toLowerCase()} pour les essayer
            virtuellement
          </Text>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={[styles.emptyBtnText, { color: colors.background }]}>
              + AJOUTER
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sectionItems}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultSection={activeSection}
        colors={colors}
        onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }}
      />
    </ScreenContainer>
  );
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
function AddItemModal({
  visible,
  onClose,
  defaultSection,
  colors,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  defaultSection: DressingSection;
  colors: ReturnType<typeof import("@/hooks/use-colors").useColors>;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WardrobeCategory>(
    SECTION_SUBCATEGORIES[defaultSection][0].id
  );
  const [brand, setBrand] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [price, setPrice] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const addMutation = trpc.wardrobe.add.useMutation();
  const uploadMutation = trpc.wardrobe.uploadImage.useMutation();

  const subcats = SECTION_SUBCATEGORIES[defaultSection];
  const currentSection = SECTIONS.find((s) => s.id === defaultSection)!;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      let uploadedUrl: string | undefined;
      if (imageUri) {
        setIsUploading(true);
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const uploaded = await uploadMutation.mutateAsync({
          base64Data: base64,
          mimeType: "image/jpeg",
        });
        uploadedUrl = uploaded.url;
        setIsUploading(false);
      }
      await addMutation.mutateAsync({
        name: name.trim(),
        category,
        brand: brand.trim() || undefined,
        color: selectedColor || undefined,
        price: price ? parseFloat(price) * 100 : undefined,
        imageUrl: uploadedUrl,
      });
      setName("");
      setBrand("");
      setSelectedColor("");
      setPrice("");
      setImageUri(null);
      if (Platform.OS !== "web")
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Modal Header */}
        <View
          style={[styles.modalHeader, { borderBottomColor: colors.border }]}
        >
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.muted }]}>
              Annuler
            </Text>
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
          {/* Photo */}
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            PHOTO
          </Text>
          {imageUri ? (
            <View style={{ marginBottom: 20 }}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", aspectRatio: 1, borderRadius: 8 }}
                contentFit="cover"
              />
              {isUploading && (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: "#fff", marginTop: 8, fontSize: 12 }}>
                    Upload…
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: 12,
                  padding: 4,
                }}
                onPress={() => setImageUri(null)}
              >
                <IconSymbol name="xmark" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <TouchableOpacity
                style={[
                  styles.photoBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handlePickImage}
              >
                <IconSymbol name="photo.fill" size={26} color={colors.muted} />
                <Text style={[styles.photoBtnText, { color: colors.muted }]}>
                  Galerie
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.photoBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleTakePhoto}
              >
                <IconSymbol name="camera.fill" size={26} color={colors.muted} />
                <Text style={[styles.photoBtnText, { color: colors.muted }]}>
                  Caméra
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Name */}
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            NOM *
          </Text>
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

          {/* Sub-category (only if multiple) */}
          {subcats.length > 1 && (
            <>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                CATÉGORIE
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {subcats.map((sc) => (
                  <TouchableOpacity
                    key={sc.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          category === sc.id
                            ? colors.primary
                            : colors.surface,
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

          {/* Brand */}
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            MARQUE
          </Text>
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

          {/* Color */}
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            COULEUR
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {COLORS.map((c) => (
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
              />
            ))}
          </View>

          {/* Price */}
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
            PRIX (€)
          </Text>
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
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "300",
    letterSpacing: 4,
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsScroll: { maxHeight: 72 },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 4,
    gap: 2,
  },
  tabEmoji: { fontSize: 20, lineHeight: 24 },
  tabLabel: { fontSize: 8, fontWeight: "600", letterSpacing: 1.5 },
  tabBadge: {
    minWidth: 18,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 8, fontWeight: "600" },
  separator: { height: 0.5, marginHorizontal: 20 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 12, fontWeight: "300", letterSpacing: 0.5 },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  demoBannerText: { fontSize: 11, fontWeight: "400", flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 13, letterSpacing: 1 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "300", letterSpacing: 2 },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 10, fontWeight: "600", letterSpacing: 2 },
  grid: { paddingHorizontal: 20, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 12 },
  card: { flex: 1, borderWidth: 1, overflow: "hidden", position: "relative" },
  cardImageContainer: { aspectRatio: 1, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 36 },
  favBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  demoBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  demoBadgeText: {
    fontSize: 7,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 1,
  },
  cardContent: { padding: 10, gap: 2 },
  cardName: { fontSize: 11, fontWeight: "400", letterSpacing: 0.3, lineHeight: 15 },
  cardBrand: { fontSize: 8, fontWeight: "600", letterSpacing: 1.5 },
  cardCat: { fontSize: 9, letterSpacing: 0.5, marginBottom: 4 },
  tryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderWidth: 1,
    gap: 4,
  },
  tryBtnText: { fontSize: 8, fontWeight: "600", letterSpacing: 1.5 },
  deleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  modalEmoji: { fontSize: 18, lineHeight: 22 },
  modalTitle: { fontSize: 11, fontWeight: "400", letterSpacing: 2.5 },
  modalCancel: { fontSize: 14 },
  modalSave: { fontSize: 14, fontWeight: "600" },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: "500", letterSpacing: 0.5 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  photoBtn: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    gap: 6,
  },
  photoBtnText: { fontSize: 11, fontWeight: "400", letterSpacing: 0.5 },
  favFilterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
