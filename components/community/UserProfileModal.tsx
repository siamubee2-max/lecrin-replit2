import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";

export type UserProfile = {
  name: string;
  initials: string;
  avatar: string | null;
  bio?: string;
  posts: {
    id: string;
    imageUrl: string;
    likes: number;
    shares: number;
  }[];
  totalLikes: number;
  totalShares: number;
  joinedAgo: string;
};

type Badge = { id: string; emoji: string; label: string; description: string; color: string };

function computeBadges(profile: UserProfile): Badge[] {
  const badges: Badge[] = [];
  // ✦ Styliste : au moins 3 publications
  if (profile.posts.length >= 3) {
    badges.push({ id: "styliste", emoji: "✦", label: "Styliste", description: "A publié au moins 3 looks", color: "#C9A96E" });
  }
  // 🔥 Tendance : au moins 50 partages au total
  if (profile.totalShares >= 50) {
    badges.push({ id: "tendance", emoji: "🔥", label: "Tendance", description: "Plus de 50 partages reçus", color: "#EF4444" });
  }
  // 🌿 Explorateur : au moins 1 publication (rejoindre la communauté)
  if (profile.posts.length >= 1) {
    badges.push({ id: "explorateur", emoji: "🌿", label: "Explorateur", description: "A rejoint la Communauté", color: "#22C55E" });
  }
  // 💎 Connaisseur : plus de 100 likes reçus
  if (profile.totalLikes >= 100) {
    badges.push({ id: "connaisseur", emoji: "💎", label: "Connaisseur", description: "Plus de 100 j'aime reçus", color: "#8B5CF6" });
  }
  // 👑 Icône : 5+ publications ET 50+ likes
  if (profile.posts.length >= 5 && profile.totalLikes >= 50) {
    badges.push({ id: "icone", emoji: "👑", label: "Icône", description: "5 publications et plus de 50 j'aime", color: "#0a7ea4" });
  }
  return badges;
}

type Props = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onTryPost?: (postId: string) => void;
};

export function UserProfileModal({ visible, profile, onClose, onTryPost }: Props) {
  const colors = useColors();

  if (!profile) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: colors.primary }]}>Fermer</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>PROFIL</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Avatar + infos */}
          <View style={styles.profileSection}>
            <View style={[styles.avatarLarge, { borderColor: colors.primary }]}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.primary }]}>{profile.initials}</Text>
              )}
            </View>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{profile.name}</Text>
            {profile.bio ? (
              <Text style={[styles.profileBio, { color: colors.muted }]}>{profile.bio}</Text>
            ) : null}
            <Text style={[styles.joinedText, { color: colors.muted }]}>Membre depuis {profile.joinedAgo}</Text>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.posts.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Publications</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.totalLikes}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>J'aime reçus</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{profile.totalShares}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Partages</Text>
            </View>
          </View>

          {/* Badges */}
          {(() => {
            const badges = computeBadges(profile);
            if (badges.length === 0) return null;
            return (
              <>
                <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>❖ BADGES</Text>
                <View style={styles.badgesRow}>
                  {badges.map(b => (
                    <View key={b.id} style={[styles.badgeChip, { backgroundColor: b.color + "18", borderColor: b.color }]}>
                      <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                      <View>
                        <Text style={[styles.badgeLabel, { color: b.color }]}>{b.label}</Text>
                        <Text style={[styles.badgeDesc, { color: colors.muted }]}>{b.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            );
          })()}

          {/* Ligne décorative */}
          <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>❖ SES PUBLICATIONS</Text>

          {/* Grille de posts */}
          {profile.posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Aucune publication pour l'instant</Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {profile.posts.map((post) => (
                <TouchableOpacity
                  key={post.id}
                  style={[styles.postThumb, { backgroundColor: colors.surface }]}
                  activeOpacity={0.85}
                  onPress={() => onTryPost?.(post.id)}
                >
                  {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} style={styles.postThumbImg} contentFit="cover" />
                  ) : (
                    <View style={[styles.postThumbPlaceholder, { backgroundColor: colors.surface }]}>
                      <Text style={{ fontSize: 24 }}>📸</Text>
                    </View>
                  )}
                  {/* Overlay stats */}
                  <View style={styles.postThumbOverlay}>
                    <Text style={styles.postThumbStat}>❤️ {post.likes}</Text>
                    {post.shares > 0 && (
                      <Text style={styles.postThumbStat}>↗ {post.shares}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
  },
  closeBtn: {
    width: 60,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "300",
    letterSpacing: 2,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  avatarImg: {
    width: 80,
    height: 80,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "300",
    letterSpacing: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 1,
  },
  profileBio: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
  joinedText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderWidth: 0.5,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "300",
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 0.5,
    height: "100%",
  },
  sectionDivider: {
    height: 0.5,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  emptyPosts: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 4,
  },
  postThumb: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  postThumbImg: {
    width: "100%",
    height: "100%",
  },
  postThumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  postThumbOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  postThumbStat: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  badgesRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  badgeDesc: {
    fontSize: 11,
    fontWeight: "300",
  },
});
