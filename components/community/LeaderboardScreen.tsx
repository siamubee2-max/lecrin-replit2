import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { Image } from "expo-image";

type Colors = {
  foreground: string;
  background: string;
  surface: string;
  border: string;
  primary: string;
  muted: string;
};

export type LeaderboardMember = {
  id: string;
  name: string;
  initials: string;
  avatar: string | null;
  totalLikes: number;
  totalShares: number;
  postsCount: number;
};

type SortMode = "likes" | "shares";

type Props = {
  members: LeaderboardMember[];
  colors: Colors;
  onMemberPress?: (id: string) => void;
};

// Calcul des badges selon les stats
function getMemberBadges(m: LeaderboardMember): { emoji: string; color: string }[] {
  const badges: { emoji: string; color: string }[] = [];
  if (m.postsCount >= 3) badges.push({ emoji: "✦", color: "#C9A96E" });
  if (m.totalShares >= 50) badges.push({ emoji: "🔥", color: "#EF4444" });
  if (m.postsCount >= 1) badges.push({ emoji: "🌿", color: "#22C55E" });
  if (m.totalLikes >= 100) badges.push({ emoji: "💎", color: "#8B5CF6" });
  if (m.postsCount >= 5 && m.totalLikes >= 50) badges.push({ emoji: "👑", color: "#0a7ea4" });
  return badges.slice(0, 3); // max 3 badges affichés
}

const RANK_COLORS = ["#C9A96E", "#9BA1A6", "#CD7F32"]; // or, argent, bronze
const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export function LeaderboardScreen({ members, colors, onMemberPress }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("likes");

  const sorted = [...members]
    .sort((a, b) =>
      sortMode === "likes"
        ? b.totalLikes - a.totalLikes
        : b.totalShares - a.totalShares
    )
    .slice(0, 10);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
    >
      {/* Titre */}
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.primary }]}>✦ CLASSEMENT</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Top 10 de la Communauté</Text>
      </View>

      {/* Sélecteur de tri */}
      <View style={[styles.sortRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {(["likes", "shares"] as SortMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            onPress={() => setSortMode(mode)}
            style={[
              styles.sortChip,
              sortMode === mode && { backgroundColor: colors.primary },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sortChipText,
                { color: sortMode === mode ? colors.background : colors.muted },
              ]}
            >
              {mode === "likes" ? "❤️  J'AIME" : "↗  PARTAGES"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Podium top 3 */}
      {sorted.length >= 3 && (
        <View style={styles.podiumRow}>
          {/* 2e place */}
          <PodiumCard
            member={sorted[1]}
            rank={2}
            sortMode={sortMode}
            colors={colors}
            onPress={() => onMemberPress?.(sorted[1].id)}
          />
          {/* 1re place */}
          <PodiumCard
            member={sorted[0]}
            rank={1}
            sortMode={sortMode}
            colors={colors}
            onPress={() => onMemberPress?.(sorted[0].id)}
            elevated
          />
          {/* 3e place */}
          <PodiumCard
            member={sorted[2]}
            rank={3}
            sortMode={sortMode}
            colors={colors}
            onPress={() => onMemberPress?.(sorted[2].id)}
          />
        </View>
      )}

      {/* Rang 4-10 */}
      <View style={{ paddingHorizontal: 16, gap: 8, marginTop: 16 }}>
        {sorted.slice(3).map((member, idx) => {
          const rank = idx + 4;
          const badges = getMemberBadges(member);
          const score = sortMode === "likes" ? member.totalLikes : member.totalShares;
          return (
            <TouchableOpacity
              key={member.id}
              onPress={() => onMemberPress?.(member.id)}
              style={[styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.rowRank, { color: colors.muted }]}>#{rank}</Text>
              <View style={[styles.rowAvatar, { borderColor: colors.border }]}>
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={styles.rowAvatarImg} contentFit="cover" />
                ) : (
                  <Text style={[styles.rowAvatarText, { color: colors.primary }]}>{member.initials}</Text>
                )}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.rowName, { color: colors.foreground }]}>{member.name}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {badges.map((b, i) => (
                    <Text key={i} style={{ fontSize: 12 }}>{b.emoji}</Text>
                  ))}
                </View>
              </View>
              <View style={styles.rowScoreBox}>
                <Text style={[styles.rowScore, { color: colors.primary }]}>{score}</Text>
                <Text style={[styles.rowScoreLabel, { color: colors.muted }]}>
                  {sortMode === "likes" ? "j'aime" : "partages"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function PodiumCard({
  member,
  rank,
  sortMode,
  colors,
  onPress,
  elevated = false,
}: {
  member: LeaderboardMember;
  rank: number;
  sortMode: SortMode;
  colors: Colors;
  onPress: () => void;
  elevated?: boolean;
}) {
  const badges = getMemberBadges(member);
  const score = sortMode === "likes" ? member.totalLikes : member.totalShares;
  const rankColor = RANK_COLORS[rank - 1] ?? colors.muted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.podiumCard,
        { backgroundColor: colors.surface, borderColor: rankColor },
        elevated && styles.podiumCardElevated,
      ]}
      activeOpacity={0.85}
    >
      <Text style={styles.podiumEmoji}>{RANK_EMOJIS[rank - 1]}</Text>
      <View style={[styles.podiumAvatar, { borderColor: rankColor }]}>
        {member.avatar ? (
          <Image source={{ uri: member.avatar }} style={styles.podiumAvatarImg} contentFit="cover" />
        ) : (
          <Text style={[styles.podiumAvatarText, { color: rankColor }]}>{member.initials}</Text>
        )}
      </View>
      <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>
        {member.name.split(" ")[0]}
      </Text>
      <Text style={[styles.podiumScore, { color: rankColor }]}>{score}</Text>
      <Text style={[styles.podiumScoreLabel, { color: colors.muted }]}>
        {sortMode === "likes" ? "j'aime" : "partages"}
      </Text>
      {badges.length > 0 && (
        <View style={styles.podiumBadges}>
          {badges.map((b, i) => (
            <Text key={i} style={{ fontSize: 11 }}>{b.emoji}</Text>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "300",
  },
  sortRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 30,
    borderWidth: 0.5,
    padding: 3,
    marginBottom: 16,
    gap: 4,
  },
  sortChip: {
    flex: 1,
    borderRadius: 26,
    paddingVertical: 8,
    alignItems: "center",
  },
  sortChipText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 4,
  },
  podiumCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 4,
  },
  podiumCardElevated: {
    paddingVertical: 20,
    shadowColor: "#C9A96E",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  podiumEmoji: {
    fontSize: 22,
  },
  podiumAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  podiumAvatarImg: {
    width: 44,
    height: 44,
  },
  podiumAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },
  podiumName: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  podiumScore: {
    fontSize: 18,
    fontWeight: "700",
  },
  podiumScoreLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
  },
  podiumBadges: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 12,
    gap: 10,
  },
  rowRank: {
    fontSize: 12,
    fontWeight: "600",
    width: 28,
    textAlign: "center",
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowAvatarImg: {
    width: 38,
    height: 38,
  },
  rowAvatarText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rowName: {
    fontSize: 13,
    fontWeight: "500",
  },
  rowScoreBox: {
    alignItems: "flex-end",
  },
  rowScore: {
    fontSize: 16,
    fontWeight: "700",
  },
  rowScoreLabel: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
