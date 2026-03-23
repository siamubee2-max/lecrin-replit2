import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export interface FavoriteTryOn {
  id: string;
  jewelryType: string;
  jewelryIcon: string;
  modelName: string;
  createdAt: string;
  imageUri?: string;
}

interface FavoritesContextType {
  favorites: FavoriteTryOn[];
  stats: {
    totalTryOns: number;
    favoritesCount: number;
    lastTryOnDate: string | null;
  };
  addFavorite: (tryOn: Omit<FavoriteTryOn, "id" | "createdAt">) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  incrementTryOnCount: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_KEY = "@ecrin_favorites";
const STATS_KEY = "@ecrin_stats";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteTryOn[]>([]);
  const [stats, setStats] = useState({
    totalTryOns: 0,
    favoritesCount: 0,
    lastTryOnDate: null as string | null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const { isAuthenticated, user } = useAuth();

  // tRPC mutations
  const addFavoriteMutation = trpc.favorites.add.useMutation();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation();
  const syncFavoritesMutation = trpc.favorites.sync.useMutation();
  const incrementTryOnMutation = trpc.stats.incrementTryOn.useMutation();

  // tRPC queries (only fetch when authenticated)
  const { data: serverFavorites, refetch: refetchFavorites } = trpc.favorites.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: serverStats, refetch: refetchStats } = trpc.stats.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Load local data on mount
  useEffect(() => {
    loadLocalData();
  }, []);

  // Sync with server when user logs in
  useEffect(() => {
    if (isAuthenticated && serverFavorites) {
      mergeServerFavorites(serverFavorites);
    }
  }, [isAuthenticated, serverFavorites]);

  // Update stats from server
  useEffect(() => {
    if (isAuthenticated && serverStats) {
      setStats(prev => ({
        totalTryOns: Math.max(prev.totalTryOns, serverStats.totalTryOns || 0),
        favoritesCount: Math.max(prev.favoritesCount, serverStats.favoritesCount || 0),
        lastTryOnDate: serverStats.lastTryOnDate?.toString() || prev.lastTryOnDate,
      }));
    }
  }, [isAuthenticated, serverStats]);

  const loadLocalData = async () => {
    try {
      setIsLoading(true);
      const [favoritesData, statsData] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(STATS_KEY),
      ]);

      if (favoritesData) {
        try {
          const parsed = JSON.parse(favoritesData);
          if (Array.isArray(parsed)) setFavorites(parsed);
        } catch (e) {
          if (__DEV__) console.warn("[Favorites] Failed to parse favorites:", e);
          /* corrupted data, ignore */
        }
      }

      if (statsData) {
        try {
          const parsed = JSON.parse(statsData);
          if (parsed && typeof parsed.totalTryOns === "number") setStats(parsed);
        } catch (e) {
          if (__DEV__) console.warn("[Favorites] Failed to parse stats:", e);
          /* corrupted data, ignore */
        }
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mergeServerFavorites = (serverFavs: any[]) => {
    // Convert server favorites to local format
    const serverFormatted: FavoriteTryOn[] = serverFavs.map(f => ({
      id: f.id.toString(),
      jewelryType: f.jewelryType,
      jewelryIcon: f.jewelryIcon || "",
      modelName: f.modelName || "",
      createdAt: f.createdAt?.toString() || new Date().toISOString(),
      imageUri: f.imageUri,
    }));

    // Merge with local favorites (avoid duplicates)
    setFavorites(prev => {
      const localIds = new Set(prev.map(f => `${f.jewelryType}-${f.modelName}-${f.jewelryIcon}`));
      const newFromServer = serverFormatted.filter(
        f => !localIds.has(`${f.jewelryType}-${f.modelName}-${f.jewelryIcon}`)
      );
      const merged = [...prev, ...newFromServer];
      saveFavorites(merged);
      return merged;
    });
  };

  const saveFavorites = async (newFavorites: FavoriteTryOn[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const saveStats = async (newStats: typeof stats) => {
    try {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.error("Error saving stats:", error);
    }
  };

  const addFavorite = async (tryOn: Omit<FavoriteTryOn, "id" | "createdAt">) => {
    const newFavorite: FavoriteTryOn = {
      ...tryOn,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    const previousFavorites = favorites;
    const previousStats = stats;
    const newFavorites = [newFavorite, ...favorites];
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);

    const newStats = {
      ...stats,
      favoritesCount: newFavorites.length,
    };
    setStats(newStats);
    await saveStats(newStats);

    // Sync to server if authenticated
    if (isAuthenticated) {
      try {
        await addFavoriteMutation.mutateAsync({
          jewelryType: tryOn.jewelryType,
          jewelryIcon: tryOn.jewelryIcon,
          modelName: tryOn.modelName,
          imageUri: tryOn.imageUri,
        });
      } catch (error) {
        // Rollback optimistic update on server failure
        setFavorites(previousFavorites);
        setStats(previousStats);
        await saveFavorites(previousFavorites);
        await saveStats(previousStats);
        console.error("Error syncing favorite to server:", error);
        // Notify user that their action couldn't be saved
        const { Alert } = await import('react-native');
        Alert.alert(
          'Erreur',
          'Impossible de sauvegarder cet essayage. Veuillez reessayer.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  };

  const removeFavorite = async (id: string) => {
    const newFavorites = favorites.filter((f) => f.id !== id);
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);

    const newStats = {
      ...stats,
      favoritesCount: newFavorites.length,
    };
    setStats(newStats);
    await saveStats(newStats);

    // Sync to server if authenticated
    if (isAuthenticated) {
      try {
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
          await removeFavoriteMutation.mutateAsync({ id: numericId });
        }
      } catch (error) {
        console.error("Error removing favorite from server:", error);
      }
    }
  };

  const isFavorite = (id: string) => {
    return favorites.some((f) => f.id === id);
  };

  const incrementTryOnCount = async () => {
    const newStats = {
      ...stats,
      totalTryOns: stats.totalTryOns + 1,
      lastTryOnDate: new Date().toISOString(),
    };
    setStats(newStats);
    await saveStats(newStats);

    // Sync to server if authenticated
    if (isAuthenticated) {
      try {
        await incrementTryOnMutation.mutateAsync();
      } catch (error) {
        console.error("Error syncing try-on count to server:", error);
      }
    }
  };

  const syncWithServer = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Upload local favorites to server
      await syncFavoritesMutation.mutateAsync(
        favorites.map(f => ({
          jewelryType: f.jewelryType,
          jewelryIcon: f.jewelryIcon,
          modelName: f.modelName,
          imageUri: f.imageUri,
          createdAt: f.createdAt,
        }))
      );

      // Refresh from server
      await refetchFavorites();
      await refetchStats();
    } catch (error) {
      console.error("Error syncing with server:", error);
    }
  }, [isAuthenticated, favorites, syncFavoritesMutation, refetchFavorites, refetchStats]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        stats,
        addFavorite,
        removeFavorite,
        isFavorite,
        incrementTryOnCount,
        syncWithServer,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
