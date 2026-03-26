import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet , Platform } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  theme: string;
  deadline: string;
  participants: number;
  prize: string;
  isJoined: boolean;
};

export const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: "ch-1",
    title: "Look Doré",
    description: "Créez un look avec au moins un bijou doré. Partagez votre photo avec #LookDoré pour participer.",
    emoji: "✨",
    theme: "#C9A96E",
    deadline: "Dimanche 23h59",
    participants: 47,
    prize: "Bon d'achat 30€ Moni'Attitude",
    isJoined: false,
  },
  {
    id: "ch-2",
    title: "Monochrome Chic",
    description: "Un look entièrement dans une seule couleur, bijoux inclus. Minimalisme et élégance.",
    emoji: "🖤",
    theme: "#334155",
    deadline: "Dimanche 23h59",
    participants: 31,
    prize: "Mise en avant sur la page Communauté",
    isJoined: false,
  },
  {
    id: "ch-3",
    title: "Nature & Bijoux",
    description: "Photographiez votre bijou dans un cadre naturel : jardin, parc, plage… La nature comme décor.",
    emoji: "🌿",
    theme: "#22C55E",
    deadline: "Dimanche 23h59",
    participants: 23,
    prize: "Badge ✦ Explorateur dans la Communauté",
    isJoined: false,
  },
];

type Props = {
  onJoinChallenge?: (challengeId: string) => void;
};

export function ChallengesBanner({ onJoinChallenge }: Props) {
  const colors = useColors();
  const [challenges, setChallenges] = useState(WEEKLY_CHALLENGES);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const handleJoin = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setChallenges(prev =>
      prev.map(c => c.id === id ? { ...c, isJoined: !c.isJoined, participants: c.isJoined ? c.participants - 1 : c.participants + 1 } : c)
    );
    onJoinChallenge?.(id);
  };

  return (
    <>
      {/* Bandeau Défis */}
      <View style={styles.wrapper}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>✦ DÉFIS DE LA SEMAINE</Text>
          <Text style={[styles.sectionSub, { color: colors.muted }]}>Participez et gagnez</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}
        >
          {challenges.map((ch) => (
            <TouchableOpacity
              key={ch.id}
              onPress={() => setSelectedChallenge(ch)}
              activeOpacity={0.85}
              style={[
                styles.challengeCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: ch.isJoined ? ch.theme : colors.border,
                  borderWidth: ch.isJoined ? 1.5 : 0.5,
                },
              ]}
            >
              <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
              <Text style={[styles.challengeTitle, { color: colors.foreground }]}>{ch.title}</Text>
              <Text style={[styles.challengeParticipants, { color: colors.muted }]}>
                {ch.participants} participants
              </Text>
              <View style={[styles.challengeDeadline, { backgroundColor: colors.border }]}>
                <Text style={[styles.challengeDeadlineText, { color: colors.muted }]}>⏱ {ch.deadline}</Text>
              </View>
              {ch.isJoined && (
                <View style={[styles.joinedBadge, { backgroundColor: ch.theme + "33" }]}>
                  <Text style={[styles.joinedBadgeText, { color: ch.theme }]}>✓ Inscrit(e)</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Modal détail défi */}
      <Modal
        visible={!!selectedChallenge}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedChallenge(null)}
      >
        {selectedChallenge && (
          <View style={[styles.detailContainer, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setSelectedChallenge(null)}>
                <Text style={[styles.closeText, { color: colors.primary }]}>Fermer</Text>
              </TouchableOpacity>
              <Text style={[styles.detailHeaderTitle, { color: colors.foreground }]}>DÉFI</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
              {/* Emoji + titre */}
              <View style={styles.detailHero}>
                <Text style={styles.detailEmoji}>{selectedChallenge.emoji}</Text>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedChallenge.title}</Text>
                <Text style={[styles.detailTheme, { color: selectedChallenge.theme }]}>
                  #{selectedChallenge.title.replace(/\s/g, "")}
                </Text>
              </View>

              {/* Description */}
              <View style={[styles.detailSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.detailSectionLabel, { color: colors.primary }]}>DESCRIPTION</Text>
                <Text style={[styles.detailDescription, { color: colors.foreground }]}>
                  {selectedChallenge.description}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.detailStatsRow}>
                <View style={[styles.detailStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailStatValue, { color: colors.foreground }]}>{selectedChallenge.participants}</Text>
                  <Text style={[styles.detailStatLabel, { color: colors.muted }]}>Participants</Text>
                </View>
                <View style={[styles.detailStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.detailStatValue, { color: colors.foreground }]}>⏱</Text>
                  <Text style={[styles.detailStatLabel, { color: colors.muted }]}>{selectedChallenge.deadline}</Text>
                </View>
              </View>

              {/* Prix */}
              <View style={[styles.prizeBox, { backgroundColor: selectedChallenge.theme + "18", borderColor: selectedChallenge.theme }]}>
                <Text style={[styles.prizeLabel, { color: selectedChallenge.theme }]}>🏆 RÉCOMPENSE</Text>
                <Text style={[styles.prizeText, { color: colors.foreground }]}>{selectedChallenge.prize}</Text>
              </View>

              {/* Bouton participer */}
              <TouchableOpacity
                onPress={() => {
                  handleJoin(selectedChallenge.id);
                  setSelectedChallenge(prev => prev ? { ...prev, isJoined: !prev.isJoined } : null);
                }}
                style={[
                  styles.joinBtn,
                  {
                    backgroundColor: selectedChallenge.isJoined ? colors.surface : selectedChallenge.theme,
                    borderColor: selectedChallenge.theme,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text style={[styles.joinBtnText, { color: selectedChallenge.isJoined ? selectedChallenge.theme : "#fff" }]}>
                  {selectedChallenge.isJoined ? "✓ Se désinscrire" : "✦ Participer au défi"}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.participateHint, { color: colors.muted }]}>
                Pour participer, publiez une photo dans la Communauté avec le hashtag #{selectedChallenge.title.replace(/\s/g, "")}.
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
  sectionSub: {
    fontSize: 11,
    fontWeight: "300",
  },
  challengeCard: {
    width: 160,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  challengeEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  challengeTitle: {
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  challengeParticipants: {
    fontSize: 11,
    fontWeight: "300",
  },
  challengeDeadline: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  challengeDeadlineText: {
    fontSize: 10,
    fontWeight: "400",
  },
  joinedBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  joinedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  closeText: {
    fontSize: 14,
    fontWeight: "500",
    width: 60,
  },
  detailHeaderTitle: {
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 2,
  },
  detailHero: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  detailEmoji: {
    fontSize: 52,
  },
  detailTitle: {
    fontSize: 26,
    fontWeight: "300",
    letterSpacing: 1,
  },
  detailTheme: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  detailSection: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    gap: 8,
  },
  detailSectionLabel: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "300",
  },
  detailStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailStat: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  detailStatValue: {
    fontSize: 20,
    fontWeight: "300",
  },
  detailStatLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  prizeBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  prizeLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  prizeText: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  joinBtn: {
    borderRadius: 30,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: "center",
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  participateHint: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
  },
});
