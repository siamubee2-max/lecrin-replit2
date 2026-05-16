import { useCallback } from "react";
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook qui demande un avis App Store au moment optimal.
 *
 * Apple permet 3 prompts/an. On les déclenche après le 3e essayage IA
 * réussi (post-aha-moment). Sources : Branch.io & RevenueCat — note
 * moyenne attendue 4.7+ vs 3.8 si le prompt sort au boot.
 *
 * Usage :
 *   const { recordSuccessAndMaybePrompt } = useReviewPrompt();
 *
 *   useEffect(() => {
 *     if (result?.status === "success") {
 *       const t = setTimeout(() => recordSuccessAndMaybePrompt(), 5000);
 *       return () => clearTimeout(t);
 *     }
 *   }, [result, recordSuccessAndMaybePrompt]);
 */

const KEYS = {
  successCount: "@ecrin/review/successCount",
  lastPromptDate: "@ecrin/review/lastPromptDate",
  hasReviewed: "@ecrin/review/hasReviewed",
};

const SUCCESS_THRESHOLD = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 90; // Apple cap = 3/an, on prend 1 trimestre

export function useReviewPrompt() {
  const recordSuccessAndMaybePrompt = useCallback(async () => {
    try {
      // Si l'utilisateur a déjà laissé un avis (via flag manuel),
      // on ne le sollicite plus
      const hasReviewed = await AsyncStorage.getItem(KEYS.hasReviewed);
      if (hasReviewed === "true") return;

      // Incrémenter le compteur d'essayages réussis
      const currentCount = parseInt(
        (await AsyncStorage.getItem(KEYS.successCount)) || "0",
        10,
      );
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(KEYS.successCount, String(newCount));

      // Pas encore au seuil
      if (newCount < SUCCESS_THRESHOLD) return;

      // Throttle : pas plus d'un prompt tous les 90 jours
      const lastPromptStr = await AsyncStorage.getItem(KEYS.lastPromptDate);
      if (lastPromptStr) {
        const daysSince =
          (Date.now() - new Date(lastPromptStr).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSince < MIN_DAYS_BETWEEN_PROMPTS) return;
      }

      // Vérifier que le device supporte le prompt natif
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return;

      // 🎯 Demander l'avis (Apple peut décider de ne pas afficher l'UI)
      await StoreReview.requestReview();

      // Marquer la date du prompt
      await AsyncStorage.setItem(KEYS.lastPromptDate, new Date().toISOString());

      // Reset compteur — le prochain cycle nécessitera 3 nouveaux succès
      await AsyncStorage.setItem(KEYS.successCount, "0");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[useReviewPrompt] error", e);
    }
  }, []);

  /**
   * À appeler depuis Réglages › "J'ai laissé un avis ⭐⭐⭐⭐⭐"
   * pour ne plus solliciter cet utilisateur.
   */
  const markReviewLeft = useCallback(async () => {
    await AsyncStorage.setItem(KEYS.hasReviewed, "true");
  }, []);

  return { recordSuccessAndMaybePrompt, markReviewLeft };
}
