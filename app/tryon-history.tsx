import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Share,
  Platform,
  Animated,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { TryOnHistoryEntry } from "@/app/(tabs)/tryon";

const HISTORY_KEY = "tryon_history";
const MAX_DISPLAY = 20;

const CATEGORY_LABELS: Record<string, string> = {
  jewelry: "Bijoux",
  shoes: "Chaussures",
  clothing: "Vêtement",
  accessories: "Accessoire",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  jewelry: "💎",
  shoes: "👠",
  clothing: "👗",
  accessories: "✨",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Aujourd'hui à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays === 1) {
    return `Hier à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  } else {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  }
}

export default function TryOnHistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const [history, setHistory] = useState<TryOnHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<TryOnHistoryEntry | null>(null);
  // Référence pour fermer les swipeables ouverts
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const all: TryOnHistoryEntry[] = raw ? JSON.parse(raw) : [];
      setHistory(all.slice(0, MAX_DISPLAY));
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ─── Suppression individuelle ─────────────────────────────────────────────────
  const handleDeleteEntry = useCallback(async (id: string, confirm = true) => {
    const doDelete = async () => {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      // Fermer le swipeable avant de supprimer
      swipeableRefs.current.get(id)?.close();
      // Mettre à jour l'état local immédiatement
      setHistory((prev) => prev.filter((e) => e.id !== id));
      // Mettre à jour AsyncStorage
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        const all: TryOnHistoryEntry[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(all.filter((e) => e.id !== id)));
      } catch {}
      // Fermer le modal si l'entrée supprimée était ouverte
      setSelectedEntry((prev) => (prev?.id === id ? null : prev));
    };

    if (confirm) {
      Alert.alert(
        "Supprimer cet essayage",
        "Voulez-vous supprimer cet essayage de l'historique ?",
        [
          { text: "Annuler", style: "cancel", onPress: () => swipeableRefs.current.get(id)?.close() },
          { text: "Supprimer", style: "destructive", onPress: doDelete },
        ]
      );
    } else {
      await doDelete();
    }
  }, []);

  const handleClearHistory = () => {
    Alert.alert(
      "Effacer l'historique",
      "Voulez-vous supprimer tous vos essayages de l'historique ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Effacer",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await AsyncStorage.removeItem(HISTORY_KEY);
            setHistory([]);
          },
        },
      ]
    );
  };

  const handleShare = async (entry: TryOnHistoryEntry) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Découvrez mon essayage virtuel ${CATEGORY_LABELS[entry.category] ?? entry.category} sur L'Écrin Virtuel ✦`,
        url: entry.resultImageUrl,
      });
    } catch {}
  };

  // ─── Action swipe gauche : bouton Supprimer rouge ────────────────────────────
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
    itemId: string
  ) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity
        onPress={() => handleDeleteEntry(itemId, false)}
        style={styles.swipeDeleteBtn}
        activeOpacity={0.85}
      >
        <Animated.View style={[styles.swipeDeleteInner, { transform: [{ scale }] }]}>
          <Text style={styles.swipeDeleteIcon}>🗑</Text>
          <Text style={styles.swipeDeleteLabel}>Supprimer</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }: { item: TryOnHistoryEntry; index: number }) => (
    <Swipeable
      ref={(ref) => { swipeableRefs.current.set(item.id, ref); }}
      renderRightActions={(progress, drag) => renderRightActions(progress, drag, item.id)}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={() => {
        // Fermer les autres swipeables ouverts
        swipeableRefs.current.forEach((ref, key) => {
          if (key !== item.id) ref?.close();
        });
      }}
    >
      <TouchableOpacity
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Fermer tout swipeable ouvert avant d'ouvrir le modal
          swipeableRefs.current.forEach((ref) => ref?.close());
          setSelectedEntry(item);
        }}
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {/* Numéro */}
        <View style={[styles.indexBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.indexText, { color: colors.primary }]}>{index + 1}</Text>
        </View>

        {/* Miniature résultat */}
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: item.resultImageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* Badge catégorie */}
          <View style={[styles.categoryBadge, { backgroundColor: "#0A1A3B" }]}>
            <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[item.category] ?? "✨"}</Text>
          </View>
        </View>

        {/* Infos */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.itemName}
          </Text>
          <Text style={[styles.cardCategory, { color: colors.primary }]}>
            {CATEGORY_LABELS[item.category] ?? item.category}
            {item.subType ? ` · ${item.subType}` : ""}
          </Text>
          <Text style={[styles.cardDate, { color: colors.muted }]}>
            {formatDate(item.date)}
          </Text>
        </View>

        {/* Hint swipe */}
        <View style={styles.swipeHint}>
          <IconSymbol name="chevron.right" size={14} color={colors.muted} />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScreenContainer containerClassName="bg-background">
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>HISTORIQUE</Text>
            <Text style={[styles.headerSubtitle, { color: colors.primary }]}>MES ESSAYAGES</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory} style={styles.clearBtn}>
              <IconSymbol name="trash" size={18} color={colors.error ?? "#EF4444"} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : history.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📸</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun essayage</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Vos essayages IA apparaîtront ici après votre première utilisation.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/tryon" as any)}
              style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.ctaBtnText}>✦ COMMENCER UN ESSAYAGE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.listHeaderRow}>
                <Text style={[styles.listHeader, { color: colors.muted }]}>
                  {history.length} essayage{history.length > 1 ? "s" : ""} récent{history.length > 1 ? "s" : ""}
                </Text>
                <Text style={[styles.listHint, { color: colors.muted }]}>
                  ← Glisser pour supprimer
                </Text>
              </View>
            }
          />
        )}

        {/* Modal détail */}
        <Modal
          visible={!!selectedEntry}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedEntry(null)}
        >
          {selectedEntry && (
            <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
              {/* Modal Header avec bouton corbeille */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setSelectedEntry(null)} style={styles.modalCloseBtn}>
                  <Text style={[styles.modalCloseTxt, { color: colors.muted }]}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>DÉTAIL</Text>
                {/* Bouton corbeille dans le modal */}
                <TouchableOpacity
                  onPress={() => handleDeleteEntry(selectedEntry.id, true)}
                  style={styles.modalDeleteBtn}
                >
                  <IconSymbol name="trash" size={18} color={colors.error ?? "#EF4444"} />
                </TouchableOpacity>
              </View>

              {/* Image résultat grande */}
              <View style={styles.modalImageContainer}>
                <Image
                  source={{ uri: selectedEntry.resultImageUrl }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>

              {/* Infos détaillées */}
              <View style={[styles.modalInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalInfoLabel, { color: colors.muted }]}>ARTICLE</Text>
                  <Text style={[styles.modalInfoValue, { color: colors.foreground }]}>{selectedEntry.itemName}</Text>
                </View>
                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalInfoLabel, { color: colors.muted }]}>CATÉGORIE</Text>
                  <Text style={[styles.modalInfoValue, { color: colors.primary }]}>
                    {CATEGORY_EMOJIS[selectedEntry.category]} {CATEGORY_LABELS[selectedEntry.category] ?? selectedEntry.category}
                    {selectedEntry.subType ? ` · ${selectedEntry.subType}` : ""}
                  </Text>
                </View>
                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                <View style={styles.modalInfoRow}>
                  <Text style={[styles.modalInfoLabel, { color: colors.muted }]}>DATE</Text>
                  <Text style={[styles.modalInfoValue, { color: colors.foreground }]}>{formatDate(selectedEntry.date)}</Text>
                </View>
              </View>

              {/* Miniatures modèle + article */}
              <View style={styles.modalThumbs}>
                <View style={styles.modalThumb}>
                  <Image source={{ uri: selectedEntry.modelImageUrl }} style={styles.modalThumbImg} resizeMode="cover" />
                  <Text style={[styles.modalThumbLabel, { color: colors.muted }]}>Modèle</Text>
                </View>
                <View style={[styles.modalThumbArrow]}>
                  <Text style={{ color: colors.primary, fontSize: 20 }}>✦</Text>
                </View>
                <View style={styles.modalThumb}>
                  <Image source={{ uri: selectedEntry.itemImageUrl }} style={styles.modalThumbImg} resizeMode="contain" />
                  <Text style={[styles.modalThumbLabel, { color: colors.muted }]}>Article</Text>
                </View>
              </View>

              {/* CTAs : Réessayer + Partager */}
              <View style={styles.modalCtaRow}>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedEntry(null);
                    router.push({
                      pathname: "/(tabs)/tryon",
                      params: {
                        section: selectedEntry.category,
                        retryModelUrl: selectedEntry.modelImageUrl,
                        retryItemUrl: selectedEntry.itemImageUrl,
                        retryItemName: selectedEntry.itemName,
                        ...(selectedEntry.subType ? { retrySubType: selectedEntry.subType } : {}),
                      },
                    } as any);
                  }}
                  style={[styles.modalRetryCta, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.modalRetryCtaText, { color: colors.primary }]}>↺ RÉESSAYER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleShare(selectedEntry)}
                  style={[styles.modalShareCta, { backgroundColor: colors.primary, flex: 1 }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalShareCtaText}>❖ PARTAGER</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Modal>
      </ScreenContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 3 },
  headerSubtitle: { fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  clearBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  ctaBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30 },
  ctaBtnText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  listContent: { padding: 16, gap: 12 },
  listHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  listHeader: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  listHint: { fontSize: 10, letterSpacing: 0.5, fontStyle: "italic" },
  // Swipe delete
  swipeDeleteBtn: {
    width: 90,
    marginLeft: 8,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 0,
  },
  swipeDeleteInner: { alignItems: "center", gap: 4 },
  swipeDeleteIcon: { fontSize: 20 },
  swipeDeleteLabel: { fontSize: 10, color: "#fff", fontWeight: "700", letterSpacing: 0.5 },
  swipeHint: { width: 20, alignItems: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 12,
    gap: 12,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: { fontSize: 11, fontWeight: "700" },
  thumbnailContainer: { position: "relative", width: 72, height: 72 },
  thumbnail: { width: 72, height: 72, borderRadius: 12 },
  categoryBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmoji: { fontSize: 11 },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardCategory: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  cardDate: { fontSize: 11 },
  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  modalCloseBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalCloseTxt: { fontSize: 18 },
  modalTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 3 },
  modalDeleteBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  modalImageContainer: {
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  modalImage: { width: "100%", height: 260 },
  modalInfo: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    overflow: "hidden",
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalInfoLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  modalInfoValue: { fontSize: 13, fontWeight: "500", maxWidth: "65%", textAlign: "right" },
  modalDivider: { height: 0.5, marginHorizontal: 16 },
  modalThumbs: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  modalThumb: { alignItems: "center", gap: 6 },
  modalThumbImg: { width: 80, height: 80, borderRadius: 12 },
  modalThumbLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  modalThumbArrow: { alignItems: "center" },
  modalCtaRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  modalRetryCta: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  modalRetryCtaText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  modalShareCta: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalShareCtaText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
});
