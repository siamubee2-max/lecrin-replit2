import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
 Platform } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { WEEKLY_CHALLENGES, type Challenge } from "./ChallengesBanner";

type Colors = {
  foreground: string;
  background: string;
  surface: string;
  border: string;
  primary: string;
  muted: string;
  error: string;
};

type Props = {
  joinedIds: Set<string>;
  onJoin: (id: string) => void;
  colors: Colors;
};

const THEME_OPTIONS = [
  { color: "#C9A96E", label: "Doré" },
  { color: "#334155", label: "Ardoise" },
  { color: "#22C55E", label: "Vert" },
  { color: "#EF4444", label: "Rouge" },
  { color: "#8B5CF6", label: "Violet" },
  { color: "#0a7ea4", label: "Bleu" },
];

const EMOJI_OPTIONS = ["✨", "🖤", "🌿", "🔥", "💎", "🌸", "🎨", "👑", "🌙", "🦋"];

export function MyChallengesScreen({ joinedIds, onJoin, colors }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    emoji: "✨",
    theme: "#C9A96E",
    deadline: "Dimanche 23h59",
    prize: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const allChallenges = [...WEEKLY_CHALLENGES, ...customChallenges];
  const joinedChallenges = allChallenges.filter(c => joinedIds.has(c.id));

  const handleCreate = () => {
    if (!form.title.trim() || !form.description.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newChallenge: Challenge = {
      id: `custom-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      emoji: form.emoji,
      theme: form.theme,
      deadline: form.deadline || "Dimanche 23h59",
      participants: 1,
      prize: form.prize.trim() || "Badge ✦ Créateur",
      isJoined: true,
    };
    setCustomChallenges(prev => [newChallenge, ...prev]);
    onJoin(newChallenge.id);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowCreate(false);
      setForm({ title: "", description: "", emoji: "✨", theme: "#C9A96E", deadline: "Dimanche 23h59", prize: "" });
    }, 1800);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
    >
      {/* Bouton créer un défi */}
      <TouchableOpacity
        onPress={() => setShowCreate(true)}
        style={[styles.createBtn, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Text style={[styles.createBtnText, { color: colors.background }]}>✦ Créer un défi</Text>
      </TouchableOpacity>

      {/* Défis rejoints */}
      {joinedChallenges.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucun défi rejoint</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Rejoignez un défi depuis le fil FIL ou créez le vôtre.
          </Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>✦ MES DÉFIS EN COURS</Text>
          {joinedChallenges.map(ch => (
            <View
              key={ch.id}
              style={[styles.challengeRow, { backgroundColor: colors.surface, borderColor: ch.theme, borderWidth: 1.5 }]}
            >
              <View style={[styles.emojiBox, { backgroundColor: ch.theme + "22" }]}>
                <Text style={styles.rowEmoji}>{ch.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{ch.title}</Text>
                  <View style={[styles.joinedBadge, { backgroundColor: ch.theme + "33" }]}>
                    <Text style={[styles.joinedBadgeText, { color: ch.theme }]}>✓ Inscrit(e)</Text>
                  </View>
                </View>
                <Text style={[styles.rowDeadline, { color: colors.muted }]}>⏱ {ch.deadline}</Text>
                <Text style={[styles.rowPrize, { color: colors.muted }]}>🏆 {ch.prize}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onJoin(ch.id)}
                style={[styles.leaveBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.leaveBtnText, { color: colors.muted }]}>Quitter</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Défis personnalisés créés */}
      {customChallenges.length > 0 && (
        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 24 }}>
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>✦ MES DÉFIS CRÉÉS</Text>
          {customChallenges.map(ch => (
            <View
              key={ch.id}
              style={[styles.challengeRow, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.5 }]}
            >
              <View style={[styles.emojiBox, { backgroundColor: ch.theme + "22" }]}>
                <Text style={styles.rowEmoji}>{ch.emoji}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{ch.title}</Text>
                <Text style={[styles.rowDeadline, { color: colors.muted }]}>⏱ {ch.deadline}</Text>
                <Text style={[styles.rowParticipants, { color: colors.muted }]}>{ch.participants} participant(s)</Text>
              </View>
              <View style={[styles.pendingBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.pendingText, { color: colors.muted }]}>En attente</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modal création défi */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>NOUVEAU DÉFI</Text>
            <TouchableOpacity onPress={handleCreate} disabled={!form.title.trim() || !form.description.trim()}>
              <Text style={[styles.modalSubmit, { color: form.title.trim() && form.description.trim() ? colors.primary : colors.muted }]}>
                Créer
              </Text>
            </TouchableOpacity>
          </View>

          {submitted ? (
            <View style={styles.successState}>
              <Text style={styles.successEmoji}>✦</Text>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>Défi soumis !</Text>
              <Text style={[styles.successText, { color: colors.muted }]}>
                Votre défi est en attente de validation. Il sera publié dans le fil sous 24h.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
              {/* Emoji picker */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>EMOJI</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {EMOJI_OPTIONS.map(e => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setForm(f => ({ ...f, emoji: e }))}
                      style={[
                        styles.emojiOption,
                        {
                          backgroundColor: form.emoji === e ? colors.primary + "22" : colors.surface,
                          borderColor: form.emoji === e ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Titre */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>TITRE DU DÉFI</Text>
                <TextInput
                  value={form.title}
                  onChangeText={t => setForm(f => ({ ...f, title: t }))}
                  placeholder="Ex: Look Bohème"
                  placeholderTextColor={colors.muted}
                  maxLength={40}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                />
              </View>

              {/* Description */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>DESCRIPTION</Text>
                <TextInput
                  value={form.description}
                  onChangeText={t => setForm(f => ({ ...f, description: t }))}
                  placeholder="Décrivez le thème et les règles du défi…"
                  placeholderTextColor={colors.muted}
                  maxLength={200}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputMulti, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                />
              </View>

              {/* Couleur thème */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>COULEUR DU THÈME</Text>
                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                  {THEME_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.color}
                      onPress={() => setForm(f => ({ ...f, theme: opt.color }))}
                      style={[
                        styles.colorDot,
                        { backgroundColor: opt.color },
                        form.theme === opt.color && styles.colorDotSelected,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Récompense */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>RÉCOMPENSE (optionnel)</Text>
                <TextInput
                  value={form.prize}
                  onChangeText={t => setForm(f => ({ ...f, prize: t }))}
                  placeholder="Ex: Badge ✦ Créateur"
                  placeholderTextColor={colors.muted}
                  maxLength={80}
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                />
              </View>

              <Text style={[styles.hint, { color: colors.muted }]}>
                Votre défi sera soumis à validation avant d'être publié dans le fil de la Communauté.
              </Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  createBtn: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 4,
  },
  challengeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowEmoji: {
    fontSize: 22,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  rowDeadline: {
    fontSize: 11,
  },
  rowPrize: {
    fontSize: 11,
  },
  rowParticipants: {
    fontSize: 11,
  },
  joinedBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  joinedBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  leaveBtn: {
    borderRadius: 8,
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  leaveBtnText: {
    fontSize: 10,
  },
  pendingBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  modalClose: {
    fontSize: 14,
    fontWeight: "500",
    width: 60,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 2,
  },
  modalSubmit: {
    fontSize: 14,
    fontWeight: "600",
    width: 60,
    textAlign: "right",
  },
  successState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  successEmoji: {
    fontSize: 52,
    color: "#C9A96E",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 1,
  },
  successText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  inputMulti: {
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  hint: {
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    fontStyle: "italic",
  },
});
