import { ScrollView, Text, View, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useFavorites, FavoriteTryOn } from "@/lib/favorites-context";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n-context";
import { StylePreferencesTab } from "@/components/profile/StylePreferencesTab";
import { TryOnHistoryTab } from "@/components/profile/TryOnHistoryTab";
import { WishlistTab } from "@/components/profile/WishlistTab";

type ProfileTab = "favorites" | "preferences" | "history" | "wishlist";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t } = useI18n();
  const { favorites, stats, removeFavorite, syncWithServer, isLoading: favoritesLoading } = useFavorites();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("favorites");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRemoveFavorite = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      t.common?.delete || "Supprimer des favoris",
      "Voulez-vous vraiment supprimer cet essayage de vos favoris ?",
      [
        { text: t.common?.cancel || "Annuler", style: "cancel" },
        { 
          text: t.common?.delete || "Supprimer", 
          style: "destructive",
          onPress: () => removeFavorite(id)
        },
      ]
    );
  };

  const handleSync = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSyncing(true);
    try {
      await syncWithServer();
      Alert.alert("Synchronisation", "Vos favoris ont été synchronisés avec succès !");
    } catch (error) {
      Alert.alert(t.common?.error || "Erreur", "Impossible de synchroniser vos favoris.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t.settings?.logout || "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: t.common?.cancel || "Annuler", style: "cancel" },
        { 
          text: t.settings?.logout || "Déconnexion", 
          style: "destructive",
          onPress: async () => {
            await logout();
            router.back();
          }
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

  const tabs: { id: ProfileTab; label: string; icon: string }[] = [
    { id: "favorites", label: "❤️", icon: "heart.fill" },
    { id: "preferences", label: "⚙️", icon: "gearshape.fill" },
    { id: "history", label: "📜", icon: "clock.fill" },
    { id: "wishlist", label: "💝", icon: "gift.fill" },
  ];

  if (authLoading) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground ml-2">
            {t.profile?.title || "Mon Profil"}
          </Text>
        </View>
        
        {isAuthenticated && (
          <TouchableOpacity 
            onPress={handleSync}
            disabled={isSyncing}
            className="p-2"
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol name="arrow.triangle.2.circlepath" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
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
            {isAuthenticated && user?.name ? (
              <Text className="text-4xl font-bold" style={{ color: '#0A1A3B' }}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Text className="text-4xl">👤</Text>
            )}
          </View>
          
          {isAuthenticated ? (
            <>
              <Text className="text-2xl font-bold text-foreground">
                {user?.name || "Utilisateur"}
              </Text>
              <Text className="text-base text-muted mt-1">{user?.email}</Text>
              
              {/* Cloud Sync Badge */}
              <View 
                className="flex-row items-center mt-3 px-4 py-2 rounded-full"
                style={{ backgroundColor: '#22C55E20' }}
              >
                <IconSymbol name="icloud.fill" size={16} color="#22C55E" />
                <Text className="text-sm font-semibold ml-2" style={{ color: '#22C55E' }}>
                  Synchronisé
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text className="text-2xl font-bold text-foreground">
                {t.profile?.anonymousUser || "Utilisateur"}
              </Text>
              <Text className="text-base text-muted mt-1">Mode invité</Text>
              
              {/* Login CTA */}
              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="flex-row items-center mt-4 px-6 py-3 rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <IconSymbol name="person.fill" size={18} color="#0A1A3B" />
                <Text className="text-base font-semibold ml-2" style={{ color: '#0A1A3B' }}>
                  Se connecter
                </Text>
              </TouchableOpacity>
              
              <Text className="text-xs text-muted mt-3 text-center px-8">
                Connectez-vous pour synchroniser vos favoris sur tous vos appareils
              </Text>
            </>
          )}
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
              onPress={() => router.push("/(tabs)/tryon")}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="sparkles" size={18} color="#0A1A3B" />
              <Text className="text-base font-semibold ml-2" style={{ color: '#0A1A3B' }}>
                Nouvel Essayage
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/settings")}
              className="flex-1 flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <IconSymbol name="gearshape.fill" size={18} color={colors.foreground} />
              <Text className="text-base font-semibold ml-2 text-foreground">
                {t.settings?.title || "Paramètres"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="px-4 mb-4">
          <View className="flex-row">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveTab(tab.id);
                }}
                className="flex-1 py-3 items-center"
                style={activeTab === tab.id ? { borderBottomWidth: 2, borderBottomColor: colors.primary } : undefined}
              >
                <Text 
                  className="text-lg"
                  style={{ opacity: activeTab === tab.id ? 1 : 0.5 }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Tab Labels */}
          <View className="flex-row mt-1">
            <View className="flex-1 items-center">
              <Text 
                className="text-xs"
                style={{ color: activeTab === "favorites" ? colors.primary : colors.muted }}
              >
                Favoris
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text 
                className="text-xs"
                style={{ color: activeTab === "preferences" ? colors.primary : colors.muted }}
              >
                {t.profile?.stylePreferences || "Style"}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text 
                className="text-xs"
                style={{ color: activeTab === "history" ? colors.primary : colors.muted }}
              >
                {t.profile?.history || "Historique"}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text 
                className="text-xs"
                style={{ color: activeTab === "wishlist" ? colors.primary : colors.muted }}
              >
                {t.profile?.myList || "Envies"}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-4">
          {activeTab === "favorites" && (
            favoritesLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : favorites.length > 0 ? (
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
                onAction={() => router.push("/(tabs)/tryon")}
                colors={colors}
              />
            )
          )}
          
          {activeTab === "preferences" && (
            <StylePreferencesTab />
          )}
          
          {activeTab === "history" && (
            <TryOnHistoryTab />
          )}
          
          {activeTab === "wishlist" && (
            <WishlistTab />
          )}
        </View>

        {/* Upgrade CTA or Logout */}
        <View className="px-4 mt-6">
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center justify-center py-4 rounded-xl"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <IconSymbol name="rectangle.stack.fill" size={18} color="#EF4444" />
              <Text className="text-base font-semibold ml-2" style={{ color: '#EF4444' }}>
                {t.settings?.logout || "Se déconnecter"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/settings")}
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
          )}
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
