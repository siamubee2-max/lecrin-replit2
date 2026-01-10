/**
 * Try-On History Tab Component
 * Displays the user's try-on history with filtering and actions
 */

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/i18n-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  TryOnHistoryItem,
  loadTryOnHistory,
  removeTryOnFromHistory,
  clearTryOnHistory,
  getTryOnStats,
} from "@/services/style-preferences-service";

interface TryOnHistoryTabProps {
  onTryOnSelect?: (item: TryOnHistoryItem) => void;
}

export function TryOnHistoryTab({ onTryOnSelect }: TryOnHistoryTabProps) {
  const colors = useColors();
  const { t } = useI18n();
  const [history, setHistory] = useState<TryOnHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalTryOns: number;
    likedCount: number;
    sharedCount: number;
    averageDuration: number;
    mostTriedType: string | null;
    mostTriedStyle: string | null;
  } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [loadedHistory, loadedStats] = await Promise.all([
        loadTryOnHistory(),
        getTryOnStats(),
      ]);
      setHistory(loadedHistory);
      setStats(loadedStats);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      t.common?.delete || "Supprimer",
      t.profile?.historyTab?.clearConfirm || "Voulez-vous vraiment supprimer cet essayage ?",
      [
        { text: t.common?.cancel || "Annuler", style: "cancel" },
        {
          text: t.common?.delete || "Supprimer",
          style: "destructive",
          onPress: async () => {
            await removeTryOnFromHistory(id);
            setHistory((prev) => prev.filter((item) => item.id !== id));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    Alert.alert(
      t.profile?.historyTab?.clearHistory || "Effacer l'historique",
      t.profile?.historyTab?.clearConfirm || "Voulez-vous vraiment effacer tout l'historique ?",
      [
        { text: t.common?.cancel || "Annuler", style: "cancel" },
        {
          text: t.common?.delete || "Supprimer",
          style: "destructive",
          onPress: async () => {
            await clearTryOnHistory();
            setHistory([]);
            setStats(null);
          },
        },
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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

  const renderHistoryItem = ({ item }: { item: TryOnHistoryItem }) => (
    <TouchableOpacity
      onPress={() => onTryOnSelect?.(item)}
      className="rounded-xl mb-3 overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row">
        {/* Icon */}
        <View
          className="w-20 h-20 items-center justify-center"
          style={{ backgroundColor: colors.background }}
        >
          <Text className="text-3xl">{item.jewelryIcon}</Text>
        </View>
        
        {/* Info */}
        <View className="flex-1 p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-foreground">
              {item.jewelryType}
            </Text>
            <View className="flex-row items-center">
              {item.liked && (
                <View className="mr-2">
                  <IconSymbol name="heart.fill" size={14} color="#EF4444" />
                </View>
              )}
              {item.shared && (
                <IconSymbol name="square.and.arrow.up" size={14} color={colors.primary} />
              )}
            </View>
          </View>
          
          <Text className="text-sm text-muted mt-1">
            {item.jewelryStyle} • {item.modelName}
          </Text>
          
          <View className="flex-row items-center mt-2">
            <Text className="text-xs text-muted">
              {formatDate(item.createdAt)}
            </Text>
            <View className="w-1 h-1 rounded-full bg-muted mx-2" />
            <Text className="text-xs text-muted">
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
        
        {/* Delete Button */}
        <TouchableOpacity
          onPress={() => handleRemove(item.id)}
          className="px-3 items-center justify-center"
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-4xl">📜</Text>
        </View>
        <Text className="text-lg font-semibold text-foreground mb-2">
          {t.profile?.historyTab?.empty || "Aucun essayage"}
        </Text>
        <Text className="text-sm text-muted text-center px-8">
          {t.profile?.historyTab?.emptyDescription || "Vos essayages apparaîtront ici après avoir essayé des bijoux."}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Stats Summary */}
      {stats && (
        <View
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
        >
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{stats.totalTryOns}</Text>
              <Text className="text-xs text-muted">Essayages</Text>
            </View>
            <View className="w-px" style={{ backgroundColor: colors.border }} />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{stats.likedCount}</Text>
              <Text className="text-xs text-muted">{t.profile?.historyTab?.liked || "Aimés"}</Text>
            </View>
            <View className="w-px" style={{ backgroundColor: colors.border }} />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{stats.sharedCount}</Text>
              <Text className="text-xs text-muted">{t.profile?.historyTab?.shared || "Partagés"}</Text>
            </View>
          </View>
          
          {stats.mostTriedType && (
            <View className="mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text className="text-xs text-muted text-center">
                Type le plus essayé : <Text className="font-semibold text-foreground">{stats.mostTriedType}</Text>
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Clear All Button */}
      <TouchableOpacity
        onPress={handleClearAll}
        className="flex-row items-center justify-center py-2 mb-4"
      >
        <IconSymbol name="trash" size={16} color="#EF4444" />
        <Text className="text-sm font-medium ml-2" style={{ color: "#EF4444" }}>
          {t.profile?.historyTab?.clearHistory || "Effacer l'historique"}
        </Text>
      </TouchableOpacity>

      {/* History List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderHistoryItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
