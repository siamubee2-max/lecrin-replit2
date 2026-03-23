/**
 * WelcomeBackModal
 * Displayed on app launch when the user has pending try-on history.
 * Shows the last try-on thumbnail, a welcome message, and a CTA to resume.
 */
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

const TRYON_HISTORY_KEY = "tryon_history";
const WELCOME_BACK_SHOWN_KEY = "welcome_back_last_shown";

type TryOnEntry = {
  id: string;
  resultImageUri: string;
  itemName?: string;
  createdAt: string;
};

export function WelcomeBackModal() {
  const colors = useColors();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [lastEntry, setLastEntry] = useState<TryOnEntry | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const checkHistory = async () => {
      try {
        // Ne montrer qu'une fois par session (pas plus d'une fois par 24h)
        const lastShown = await AsyncStorage.getItem(WELCOME_BACK_SHOWN_KEY);
        if (lastShown) {
          const diff = Date.now() - parseInt(lastShown, 10);
          if (diff < 24 * 60 * 60 * 1000) return; // moins de 24h
        }

        const raw = await AsyncStorage.getItem(TRYON_HISTORY_KEY);
        if (!raw) return;
        const history: TryOnEntry[] = JSON.parse(raw);
        if (!history || history.length === 0) return;

        if (cancelled) return;
        setLastEntry(history[0]);
        setHistoryCount(history.length);

        // Marquer comme montré
        await AsyncStorage.setItem(WELCOME_BACK_SHOWN_KEY, String(Date.now()));

        // Délai pour laisser l'app s'initialiser
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setVisible(true);
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
              toValue: 0,
              friction: 8,
              tension: 50,
              useNativeDriver: true,
            }),
          ]).start();
        }, 1200);
      } catch {}
    };

    checkHistory();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 60, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleViewHistory = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    dismiss();
    setTimeout(() => router.push("/tryon-history"), 300);
  };

  const handleResume = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    dismiss();
    setTimeout(() => router.push("/(tabs)/tryon"), 300);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Bouton fermer */}
          <TouchableOpacity onPress={dismiss} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={[styles.closeText, { color: colors.muted }]}>✕</Text>
          </TouchableOpacity>

          {/* Miniature du dernier essayage */}
          {lastEntry?.resultImageUri ? (
            <View style={[styles.thumbnailContainer, { borderColor: colors.primary }]}>
              <Image
                source={{ uri: lastEntry.resultImageUri }}
                style={styles.thumbnail}
                resizeMode="cover"
                accessibilityLabel={lastEntry.itemName ? `Dernier essayage : ${lastEntry.itemName}` : "Dernier essayage virtuel"}
              />
            </View>
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.placeholderIcon}>💎</Text>
            </View>
          )}

          {/* Titre */}
          <Text style={[styles.title, { color: colors.foreground }]}>
            Bienvenue de retour !
          </Text>

          {/* Sous-titre */}
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {historyCount === 1
              ? "Vous avez 1 essayage dans votre historique."
              : `Vous avez ${historyCount} essayages dans votre historique.`}
            {lastEntry?.itemName ? ` Dernier : ${lastEntry.itemName}.` : ""}
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleViewHistory}
              style={[styles.btnSecondary, { borderColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnSecondaryText, { color: colors.primary }]}>
                Voir l{"'"}historique
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResume}
              style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnPrimaryText, { color: "#0A1A3B" }]}>
                Nouvel essayage
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 32,
    alignItems: "center",
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
