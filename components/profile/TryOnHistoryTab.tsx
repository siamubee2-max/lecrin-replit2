/**
 * Try-On History Tab Component
 * Displays the user's try-on history with filtering by category
 */

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { TryOnHistoryEntry } from "@/app/(tabs)/tryon";

const HISTORY_KEY = "tryon_history";

type CategoryFilter = "all" | "jewelry" | "shoes" | "clothing" | "accessories";

const CATEGORY_FILTERS: { key: CategoryFilter; label: string; emoji: string }[] = [
  { key: "all", label: "Tous", emoji: "✦" },
  { key: "jewelry", label: "Bijoux", emoji: "💎" },
  { key: "shoes", label: "Chaussures", emoji: "👠" },
  { key: "clothing", label: "Vêtements", emoji: "👗" },
  { key: "accessories", label: "Accessoires", emoji: "👜" },
];

const CATEGORY_LABELS: Record<string, string> = {
  jewelry: "Bijou",
  shoes: "Chaussures",
  clothing: "Vêtement",
  accessories: "Accessoire",
};

export function TryOnHistoryTab() {
  const colors = useColors();
  const [history, setHistory] = useState<TryOnHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const data: TryOnHistoryEntry[] = raw ? JSON.parse(raw) : [];
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRemove = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cet essayage ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const updated = history.filter((e) => e.id !== id);
            setHistory(updated);
            await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Effacer l'historique",
      "Voulez-vous vraiment effacer tout l'historique d'essayages ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: async () => {
            setHistory([]);
            await AsyncStorage.removeItem(HISTORY_KEY);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredHistory = activeFilter === "all"
    ? history
    : history.filter((e) => e.category === activeFilter);

  // Statistiques par catégorie
  const stats = {
    total: history.length,
    jewelry: history.filter((e) => e.category === "jewelry").length,
    shoes: history.filter((e) => e.category === "shoes").length,
    clothing: history.filter((e) => e.category === "clothing").length,
    accessories: history.filter((e) => e.category === "accessories").length,
  };

  const renderItem = ({ item }: { item: TryOnHistoryEntry }) => (
    <View
      style={[
        histStyles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Image résultat */}
      <View style={histStyles.imageContainer}>
        {item.resultImageUrl ? (
          <Image
            source={{ uri: item.resultImageUrl }}
            style={histStyles.resultImage}
            contentFit="cover"
          />
        ) : (
          <View style={[histStyles.resultImage, { backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 24 }}>
              {item.category === "jewelry" ? "💎" : item.category === "shoes" ? "👠" : item.category === "clothing" ? "👗" : "👜"}
            </Text>
          </View>
        )}
        {/* Badge catégorie */}
        <View style={[histStyles.categoryBadge, { backgroundColor: colors.primary }]}>
          <Text style={[histStyles.categoryBadgeText, { color: colors.background }]}>
            {CATEGORY_LABELS[item.category] ?? item.category}
          </Text>
        </View>
      </View>

      {/* Infos */}
      <View style={histStyles.infoContainer}>
        <Text style={[histStyles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {item.itemName}
        </Text>
        {item.subType && (
          <Text style={[histStyles.subType, { color: colors.primary }]}>
            {item.subType}
          </Text>
        )}
        <Text style={[histStyles.date, { color: colors.muted }]}>
          {formatDate(item.date)}
        </Text>
      </View>

      {/* Bouton supprimer */}
      <TouchableOpacity
        onPress={() => handleRemove(item.id)}
        style={histStyles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <IconSymbol name="trash" size={16} color={colors.error ?? "#EF4444"} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Statistiques */}
      {history.length > 0 && (
        <View
          style={[
            histStyles.statsCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={histStyles.statsRow}>
            <View style={histStyles.statItem}>
              <Text style={[histStyles.statNumber, { color: colors.foreground }]}>{stats.total}</Text>
              <Text style={[histStyles.statLabel, { color: colors.muted }]}>Total</Text>
            </View>
            <View style={[histStyles.statDivider, { backgroundColor: colors.border }]} />
            <View style={histStyles.statItem}>
              <Text style={[histStyles.statNumber, { color: colors.foreground }]}>{stats.jewelry}</Text>
              <Text style={[histStyles.statLabel, { color: colors.muted }]}>💎 Bijoux</Text>
            </View>
            <View style={[histStyles.statDivider, { backgroundColor: colors.border }]} />
            <View style={histStyles.statItem}>
              <Text style={[histStyles.statNumber, { color: colors.foreground }]}>{stats.shoes}</Text>
              <Text style={[histStyles.statLabel, { color: colors.muted }]}>👠 Chaussures</Text>
            </View>
            <View style={[histStyles.statDivider, { backgroundColor: colors.border }]} />
            <View style={histStyles.statItem}>
              <Text style={[histStyles.statNumber, { color: colors.foreground }]}>{stats.clothing + stats.accessories}</Text>
              <Text style={[histStyles.statLabel, { color: colors.muted }]}>👗 Autres</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filtres par catégorie */}
      <View style={histStyles.filtersRow}>
        {CATEGORY_FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          const count = f.key === "all" ? history.length : history.filter(e => e.category === f.key).length;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                setActiveFilter(f.key);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                histStyles.filterChip,
                {
                  backgroundColor: isActive ? colors.foreground : "transparent",
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 11 }}>{f.emoji}</Text>
              <Text style={[histStyles.filterChipText, { color: isActive ? colors.background : colors.muted }]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[histStyles.countBadge, { backgroundColor: isActive ? colors.background : colors.border }]}>
                  <Text style={[histStyles.countBadgeText, { color: isActive ? colors.foreground : colors.muted }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Liste ou état vide */}
      {filteredHistory.length === 0 ? (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 48 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>
            {activeFilter === "all" ? "📜" : activeFilter === "jewelry" ? "💎" : activeFilter === "shoes" ? "👠" : activeFilter === "clothing" ? "👗" : "👜"}
          </Text>
          <Text style={[histStyles.emptyTitle, { color: colors.foreground }]}>
            {activeFilter === "all" ? "Aucun essayage" : `Aucun essayage ${CATEGORY_LABELS[activeFilter] ?? ""}`}
          </Text>
          <Text style={[histStyles.emptyDesc, { color: colors.muted }]}>
            {activeFilter === "all"
              ? "Vos essayages virtuels apparaîtront ici."
              : `Essayez des ${CATEGORY_LABELS[activeFilter] ?? "articles"} pour les voir ici.`}
          </Text>
        </View>
      ) : (
        <>
          {/* Bouton effacer tout */}
          <TouchableOpacity onPress={handleClearAll} style={histStyles.clearBtn}>
            <IconSymbol name="trash" size={14} color="#EF4444" />
            <Text style={histStyles.clearBtnText}>Effacer l'historique</Text>
          </TouchableOpacity>

          <FlatList
            data={filteredHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, gap: 10 }}
          />
        </>
      )}
    </View>
  );
}

const histStyles = StyleSheet.create({
  statsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "400",
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: "center",
  },
  statDivider: {
    width: 0.5,
    height: 32,
    marginHorizontal: 4,
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 0,
  },
  filterChipText: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  resultImage: {
    width: 80,
    height: 100,
  },
  categoryBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subType: {
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 10,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#EF4444",
    letterSpacing: 0.5,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "300",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 32,
    letterSpacing: 0.3,
  },
});
