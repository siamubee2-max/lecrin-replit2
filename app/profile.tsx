import { ScrollView, Text, View, TouchableOpacity, StyleSheet, FlatList, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFavorites, FavoriteTryOn } from "@/lib/favorites-context";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { favorites, stats, removeFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<"favorites" | "history">("favorites");

  const handleRemoveFavorite = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      "Supprimer des favoris",
      "Voulez-vous vraiment supprimer cet essayage de vos favoris ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => removeFavorite(id)
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderFavoriteItem = ({ item }: { item: FavoriteTryOn }) => (
    <View 
      className="rounded-2xl overflow-hidden mb-4"
      style={[styles.favoriteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {/* Image Placeholder */}
      <View 
        className="aspect-[4/3] items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <View className="items-center">
          <Text className="text-5xl mb-2">{item.jewelryIcon}</Text>
          <Text className="text-sm text-muted">sur {item.modelName}</Text>
        </View>
        
        {/* Actions Overlay */}
        <View className="absolute top-3 right-3 flex-row">
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item.id)}
            className="w-10 h-10 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="heart.fill" size={20} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.surface }}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Info */}
      <View className="p-4">
        <Text className="text-lg font-semibold text-foreground">{item.jewelryType}</Text>
        <Text className="text-sm text-muted mt-1">{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground ml-2">Mon Profil</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Header */}
        <View className="items-center py-6 px-4">
          <View 
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-4xl">👤</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Utilisateur</Text>
          <Text className="text-base text-muted mt-1">Mode invité</Text>
          
          {/* Premium Badge */}
          <View 
            className="flex-row items-center mt-3 px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.primary + '20' }}
          >
            <Text className="text-sm mr-1">👑</Text>
            <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
              Compte Gratuit
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-4 mb-6">
          <View 
            className="flex-row rounded-2xl overflow-hidden"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <StatItem
              icon="💎"
              value={stats.totalTryOns.toString()}
              label="Essayages"
              colors={colors}
            />
            <View className="w-px" style={{ backgroundColor: colors.border }} />
            <StatItem
              icon="❤️"
              value={stats.favoritesCount.toString()}
              label="Favoris"
              colors={colors}
            />
            <View className="w-px" style={{ backgroundColor: colors.border }} />
            <StatItem
              icon="📅"
              value={stats.lastTryOnDate ? formatDate(stats.lastTryOnDate).split(" ")[0] : "-"}
              label="Dernier"
              colors={colors}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-4 mb-6">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/tryon")}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="sparkles" size={18} color="#0A1A3B" />
              <Text className="text-base font-semibold ml-2" style={{ color: '#0A1A3B' }}>
                Nouvel Essayage
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <IconSymbol name="gearshape.fill" size={18} color={colors.foreground} />
              <Text className="text-base font-semibold ml-2 text-foreground">
                Paramètres
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-4 mb-4">
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setActiveTab("favorites")}
              className="flex-1 py-3 items-center"
              style={activeTab === "favorites" && { borderBottomWidth: 2, borderBottomColor: colors.primary }}
            >
              <Text 
                className="text-base font-semibold"
                style={{ color: activeTab === "favorites" ? colors.primary : colors.muted }}
              >
                ❤️ Favoris ({favorites.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab("history")}
              className="flex-1 py-3 items-center"
              style={activeTab === "history" && { borderBottomWidth: 2, borderBottomColor: colors.primary }}
            >
              <Text 
                className="text-base font-semibold"
                style={{ color: activeTab === "history" ? colors.primary : colors.muted }}
              >
                📜 Historique
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="px-4">
          {activeTab === "favorites" ? (
            favorites.length > 0 ? (
              <FlatList
                data={favorites}
                keyExtractor={(item) => item.id}
                renderItem={renderFavoriteItem}
                scrollEnabled={false}
              />
            ) : (
              <EmptyState
                icon="❤️"
                title="Aucun favori"
                description="Sauvegardez vos essayages préférés en appuyant sur le cœur lors d'un essayage."
                actionLabel="Commencer un essayage"
                onAction={() => router.push("/tryon")}
                colors={colors}
              />
            )
          ) : (
            <EmptyState
              icon="📜"
              title="Historique vide"
              description="Vos essayages récents apparaîtront ici."
              actionLabel="Commencer un essayage"
              onAction={() => router.push("/tryon")}
              colors={colors}
            />
          )}
        </View>

        {/* Upgrade CTA */}
        <View className="px-4 mt-6">
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="rounded-2xl p-5"
            style={[styles.upgradeCta, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          >
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">👑</Text>
              <Text className="text-lg font-bold text-foreground">
                Passez à Premium
              </Text>
            </View>
            <Text className="text-sm text-muted mb-4">
              Débloquez les essayages illimités, tous les modèles et la garde-robe virtuelle.
            </Text>
            <View 
              className="flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-sm font-semibold" style={{ color: '#0A1A3B' }}>
                Voir les offres
              </Text>
              <IconSymbol name="chevron.right" size={16} color="#0A1A3B" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function StatItem({ 
  icon, 
  value, 
  label, 
  colors 
}: { 
  icon: string; 
  value: string; 
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View className="flex-1 items-center py-4">
      <Text className="text-xl mb-1">{icon}</Text>
      <Text className="text-xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}

function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel,
  onAction,
  colors 
}: { 
  icon: string; 
  title: string; 
  description: string;
  actionLabel: string;
  onAction: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View 
      className="rounded-2xl p-8 items-center"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
    >
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-lg font-semibold text-foreground text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-muted text-center mb-4">
        {description}
      </Text>
      <TouchableOpacity
        onPress={onAction}
        className="px-6 py-2 rounded-full"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-sm font-semibold" style={{ color: '#0A1A3B' }}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  favoriteCard: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  upgradeCta: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
