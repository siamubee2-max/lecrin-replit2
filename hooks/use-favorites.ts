import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FavoriteJewel = {
  id: string;
  name: string;
  brand?: string;
  imageUrl: string;
  type?: string;
  price?: string;
  savedAt: string; // ISO date string
};

const STORAGE_KEY = "@ecrin_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteJewel[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Charger les favoris depuis AsyncStorage au montage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setFavorites(JSON.parse(raw));
          } catch {
            setFavorites([]);
          }
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  // Persister à chaque changement
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, loaded]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const addFavorite = useCallback((jewel: Omit<FavoriteJewel, "savedAt">) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === jewel.id)) return prev;
      return [{ ...jewel, savedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const toggleFavorite = useCallback(
    (jewel: Omit<FavoriteJewel, "savedAt">) => {
      setFavorites((prev) => {
        if (prev.some((f) => f.id === jewel.id)) {
          return prev.filter((f) => f.id !== jewel.id);
        }
        return [{ ...jewel, savedAt: new Date().toISOString() }, ...prev];
      });
    },
    []
  );

  return { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, loaded };
}
