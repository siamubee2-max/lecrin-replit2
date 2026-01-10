import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // Load favorites and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [favoritesData, statsData] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(STATS_KEY),
      ]);

      if (favoritesData) {
        const parsed = JSON.parse(favoritesData);
        setFavorites(parsed);
      }

      if (statsData) {
        const parsed = JSON.parse(statsData);
        setStats(parsed);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
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

    const newFavorites = [newFavorite, ...favorites];
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);

    const newStats = {
      ...stats,
      favoritesCount: newFavorites.length,
    };
    setStats(newStats);
    await saveStats(newStats);
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
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        stats,
        addFavorite,
        removeFavorite,
        isFavorite,
        incrementTryOnCount,
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
