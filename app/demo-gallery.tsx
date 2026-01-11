import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

type BodyPartCategory = "hands" | "ears" | "necks";

interface DemoImage {
  id: string;
  source: any;
  skinTone: string;
  bodyPart: BodyPartCategory;
}

const DEMO_IMAGES: DemoImage[] = [
  // Hands
  {
    id: "hand_light",
    source: require("@/assets/demo-gallery/hand_light.png"),
    skinTone: "light",
    bodyPart: "hands",
  },
  {
    id: "hand_medium",
    source: require("@/assets/demo-gallery/hand_medium.png"),
    skinTone: "medium",
    bodyPart: "hands",
  },
  {
    id: "hand_dark",
    source: require("@/assets/demo-gallery/hand_dark.png"),
    skinTone: "dark",
    bodyPart: "hands",
  },
  // Ears
  {
    id: "ear_light",
    source: require("@/assets/demo-gallery/ear_light.png"),
    skinTone: "light",
    bodyPart: "ears",
  },
  {
    id: "ear_medium",
    source: require("@/assets/demo-gallery/ear_medium.png"),
    skinTone: "medium",
    bodyPart: "ears",
  },
  {
    id: "ear_dark",
    source: require("@/assets/demo-gallery/ear_dark.png"),
    skinTone: "dark",
    bodyPart: "ears",
  },
  // Necks
  {
    id: "neck_light",
    source: require("@/assets/demo-gallery/neck_light.png"),
    skinTone: "light",
    bodyPart: "necks",
  },
  {
    id: "neck_dark",
    source: require("@/assets/demo-gallery/neck_dark.png"),
    skinTone: "dark",
    bodyPart: "necks",
  },
];

export default function DemoGalleryScreen() {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<BodyPartCategory | "all">("all");
  const [selectedImage, setSelectedImage] = useState<DemoImage | null>(null);

  const filteredImages =
    selectedCategory === "all"
      ? DEMO_IMAGES
      : DEMO_IMAGES.filter((img) => img.bodyPart === selectedCategory);

  const getSkinToneLabel = (skinTone: string): string => {
    switch (skinTone) {
      case "light":
        return t.demoGallery.skinTones.light;
      case "medium":
        return t.demoGallery.skinTones.medium;
      case "dark":
        return t.demoGallery.skinTones.dark;
      default:
        return skinTone;
    }
  };

  const getBodyPartLabel = (bodyPart: BodyPartCategory): string => {
    switch (bodyPart) {
      case "hands":
        return t.demoGallery.categories.hands;
      case "ears":
        return t.demoGallery.categories.ears;
      case "necks":
        return t.demoGallery.categories.necks;
      default:
        return bodyPart;
    }
  };

  const getCategoryLabel = (key: BodyPartCategory | "all"): string => {
    switch (key) {
      case "all":
        return t.demoGallery.categories.all;
      case "hands":
        return t.demoGallery.categories.hands;
      case "ears":
        return t.demoGallery.categories.ears;
      case "necks":
        return t.demoGallery.categories.necks;
      default:
        return key;
    }
  };

  const categories: (BodyPartCategory | "all")[] = ["all", "hands", "ears", "necks"];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t.demoGallery.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Intro Text */}
      <View style={styles.introContainer}>
        <Text style={[styles.introText, { color: colors.muted }]}>
          {t.demoGallery.intro}
        </Text>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={({ pressed }) => [
              styles.tab,
              {
                backgroundColor:
                  selectedCategory === cat ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    selectedCategory === cat
                      ? "#FFFFFF"
                      : colors.foreground,
                },
              ]}
            >
              {getCategoryLabel(cat)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Gallery Grid */}
      <ScrollView
        contentContainerStyle={styles.galleryContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {filteredImages.map((image) => (
            <Pressable
              key={image.id}
              onPress={() => setSelectedImage(image)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Image
                source={image.source}
                style={styles.cardImage}
                contentFit="cover"
              />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardBodyPart, { color: colors.foreground }]}>
                  {getBodyPartLabel(image.bodyPart)}
                </Text>
                <Text style={[styles.cardSkinTone, { color: colors.muted }]}>
                  {getSkinToneLabel(image.skinTone)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Inclusivity Message */}
        <View style={[styles.messageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.messageTitle, { color: colors.foreground }]}>
            {t.demoGallery.inclusivityTitle}
          </Text>
          <Text style={[styles.messageText, { color: colors.muted }]}>
            {t.demoGallery.inclusivityMessage}
          </Text>
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedImage(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Image
              source={selectedImage.source}
              style={styles.modalImage}
              contentFit="contain"
            />
            <View style={styles.modalInfo}>
              <Text style={[styles.modalBodyPart, { color: colors.foreground }]}>
                {getBodyPartLabel(selectedImage.bodyPart)}
              </Text>
              <Text style={[styles.modalSkinTone, { color: colors.muted }]}>
                {getSkinToneLabel(selectedImage.skinTone)}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedImage(null)}
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.closeButtonText}>
                {t.common.close}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  introContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  galleryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH,
  },
  cardInfo: {
    padding: 12,
  },
  cardBodyPart: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardSkinTone: {
    fontSize: 12,
    marginTop: 2,
  },
  messageContainer: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: 300,
  },
  modalInfo: {
    padding: 16,
    alignItems: "center",
  },
  modalBodyPart: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalSkinTone: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    margin: 16,
    marginTop: 0,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
