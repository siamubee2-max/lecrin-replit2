import { forwardRef, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import ViewShot from "react-native-view-shot";

import { useColors } from "@/hooks/use-colors";
import { WatermarkMinimal } from "@/components/watermark";

// Types
interface WardrobeItem {
  id: number;
  name: string;
  category?: string | null;
  imageUrl?: string | null;
}

interface JewelryItem {
  id: number;
  jewelryType: string;
  imageUri?: string | null;
  jewelryIcon?: string | null;
  modelName?: string | null;
}

interface LookShareCardProps {
  name: string;
  description?: string | null;
  occasion?: string | null;
  season?: string | null;
  stylingTips?: string | null;
  wardrobeItems: WardrobeItem[];
  jewelryItems: JewelryItem[];
  isAiGenerated?: boolean | null;
}

// Constants
const OCCASION_LABELS: Record<string, { label: string; icon: string }> = {
  casual: { label: "Casual", icon: "👕" },
  work: { label: "Travail", icon: "💼" },
  formal: { label: "Soirée", icon: "🎩" },
  sport: { label: "Sport", icon: "🏃" },
  party: { label: "Fête", icon: "🎉" },
  all: { label: "Tous", icon: "✨" },
};

const SEASON_LABELS: Record<string, { label: string; icon: string }> = {
  spring: { label: "Printemps", icon: "🌸" },
  summer: { label: "Été", icon: "☀️" },
  fall: { label: "Automne", icon: "🍂" },
  winter: { label: "Hiver", icon: "❄️" },
  all: { label: "Toutes saisons", icon: "🌍" },
};

/**
 * LookShareCard - A shareable card component for looks
 * 
 * This component renders a visually appealing card that can be captured
 * as an image for sharing on social media.
 */
export const LookShareCard = forwardRef<ViewShot, LookShareCardProps>(
  function LookShareCard(
    {
      name,
      description,
      occasion,
      season,
      stylingTips,
      wardrobeItems,
      jewelryItems,
      isAiGenerated,
    },
    ref
  ) {
    const colors = useColors();

    const occasionInfo = occasion ? OCCASION_LABELS[occasion] : null;
    const seasonInfo = season ? SEASON_LABELS[season] : null;

    // Combine all items for display (max 6)
    const displayItems = useMemo(() => {
      const items: { type: "wardrobe" | "jewelry"; imageUrl: string | null; icon?: string; name: string }[] = [];
      
      wardrobeItems.slice(0, 4).forEach((item) => {
        items.push({
          type: "wardrobe",
          imageUrl: item.imageUrl || null,
          name: item.name,
        });
      });
      
      jewelryItems.slice(0, 6 - items.length).forEach((item) => {
        items.push({
          type: "jewelry",
          imageUrl: item.imageUri || null,
          icon: item.jewelryIcon || "💎",
          name: item.modelName || item.jewelryType,
        });
      });
      
      return items;
    }, [wardrobeItems, jewelryItems]);

    return (
      <ViewShot
        ref={ref}
        options={{ format: "png", quality: 1 }}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header with branding */}
        <View style={[styles.header, { backgroundColor: "#1a2744" }]}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandIcon}>💎</Text>
            <View>
              <Text style={styles.brandName}>L{"'"}Écrin Virtuel</Text>
              <Text style={styles.brandTagline}>Essayage virtuel de bijoux</Text>
            </View>
          </View>
          {isAiGenerated && (
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>✨ IA</Text>
            </View>
          )}
        </View>

        {/* Look name and description */}
        <View style={[styles.titleSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.lookName, { color: colors.foreground }]}>{name}</Text>
          {description && (
            <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
              {description}
            </Text>
          )}
          
          {/* Tags */}
          <View style={styles.tagsContainer}>
            {occasionInfo && (
              <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                <Text style={styles.tagIcon}>{occasionInfo.icon}</Text>
                <Text style={[styles.tagText, { color: colors.foreground }]}>{occasionInfo.label}</Text>
              </View>
            )}
            {seasonInfo && (
              <View style={[styles.tag, { backgroundColor: colors.surface }]}>
                <Text style={styles.tagIcon}>{seasonInfo.icon}</Text>
                <Text style={[styles.tagText, { color: colors.foreground }]}>{seasonInfo.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items grid */}
        <View style={styles.itemsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Pièces du look ({wardrobeItems.length + jewelryItems.length})
          </Text>
          <View style={styles.itemsGrid}>
            {displayItems.map((item, index) => (
              <View
                key={`${item.type}-${index}`}
                style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.itemPlaceholder, { backgroundColor: colors.background }]}>
                    <Text style={styles.itemIcon}>
                      {item.type === "jewelry" ? item.icon : "👕"}
                    </Text>
                  </View>
                )}
                <Text
                  style={[styles.itemName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Styling tips */}
        {stylingTips && (
          <View style={[styles.tipsSection, { backgroundColor: "#f0f7ff" }]}>
            <View style={styles.tipsHeader}>
              <Text style={styles.tipsIcon}>✨</Text>
              <Text style={[styles.tipsTitle, { color: "#1a2744" }]}>Conseils de style</Text>
            </View>
            <Text style={[styles.tipsText, { color: "#1a2744" }]} numberOfLines={3}>
              {stylingTips}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: "#1a2744" }]}>
          <Text style={styles.footerText}>
            Créé avec L{"'"}Écrin Virtuel • ecrin-virtuel.app
          </Text>
        </View>

        {/* Watermark */}
        <WatermarkMinimal position="bottom-right" opacity={0.5} theme="dark" />
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: 360,
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  brandName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  brandTagline: {
    fontSize: 11,
    color: "#C9A227",
  },
  aiTag: {
    backgroundColor: "rgba(201, 162, 39, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C9A227",
  },
  titleSection: {
    padding: 16,
    borderBottomWidth: 1,
  },
  lookName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  itemsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  itemCard: {
    width: 100,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemImage: {
    width: "100%",
    height: 80,
  },
  itemPlaceholder: {
    width: "100%",
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    fontSize: 28,
  },
  itemName: {
    fontSize: 11,
    fontWeight: "500",
    padding: 6,
    textAlign: "center",
  },
  tipsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipsIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
});

export default LookShareCard;
