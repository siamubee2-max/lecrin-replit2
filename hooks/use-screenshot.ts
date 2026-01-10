import { useRef, useCallback, useState } from "react";
import { Platform, Alert } from "react-native";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";

interface UseScreenshotOptions {
  format?: "png" | "jpg" | "webm";
  quality?: number;
  width?: number;
  height?: number;
}

interface UseScreenshotReturn {
  viewShotRef: React.RefObject<ViewShot | null>;
  isCapturing: boolean;
  lastCaptureUri: string | null;
  capture: () => Promise<string | null>;
  shareCapture: () => Promise<void>;
  saveToGallery: () => Promise<boolean>;
  reset: () => void;
}

export function useScreenshot(options: UseScreenshotOptions = {}): UseScreenshotReturn {
  const viewShotRef = useRef<ViewShot | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCaptureUri, setLastCaptureUri] = useState<string | null>(null);

  const {
    format = "png",
    quality = 1,
    width,
    height,
  } = options;

  const handleHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleSuccessHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const capture = useCallback(async (): Promise<string | null> => {
    if (!viewShotRef.current) {
      console.warn("ViewShot ref is not attached");
      return null;
    }

    setIsCapturing(true);
    handleHaptic();

    try {
      const uri = await captureRef(viewShotRef, {
        format,
        quality,
        ...(width && { width }),
        ...(height && { height }),
      });

      setLastCaptureUri(uri);
      handleSuccessHaptic();
      return uri;
    } catch (error) {
      console.error("Erreur lors de la capture:", error);
      Alert.alert(
        "Erreur",
        "Impossible de capturer l'image. Veuillez réessayer."
      );
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [format, quality, width, height, handleHaptic, handleSuccessHaptic]);

  const shareCapture = useCallback(async (): Promise<void> => {
    let uri = lastCaptureUri;

    // Si pas de capture existante, en faire une nouvelle
    if (!uri) {
      uri = await capture();
    }

    if (!uri) return;

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: format === "png" ? "image/png" : "image/jpeg",
          dialogTitle: "Partager mon essayage",
        });
      } else {
        Alert.alert(
          "Partage indisponible",
          "Le partage n'est pas disponible sur cet appareil."
        );
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
    }
  }, [lastCaptureUri, capture, format]);

  const saveToGallery = useCallback(async (): Promise<boolean> => {
    let uri = lastCaptureUri;

    // Si pas de capture existante, en faire une nouvelle
    if (!uri) {
      uri = await capture();
    }

    if (!uri) return false;

    try {
      // Demander la permission d'accès à la galerie
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "L'accès à la galerie est nécessaire pour sauvegarder l'image."
        );
        return false;
      }

      // Sauvegarder l'image
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      // Optionnel: créer un album dédié
      const album = await MediaLibrary.getAlbumAsync("Écrin Virtuel");
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("Écrin Virtuel", asset, false);
      }

      handleSuccessHaptic();
      Alert.alert(
        "Image sauvegardée",
        "Votre essayage a été enregistré dans la galerie."
      );
      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder l'image. Veuillez réessayer."
      );
      return false;
    }
  }, [lastCaptureUri, capture, handleSuccessHaptic]);

  const reset = useCallback(() => {
    setLastCaptureUri(null);
  }, []);

  return {
    viewShotRef,
    isCapturing,
    lastCaptureUri,
    capture,
    shareCapture,
    saveToGallery,
    reset,
  };
}
