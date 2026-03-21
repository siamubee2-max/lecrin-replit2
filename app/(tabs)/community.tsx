import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { useState, useCallback, useMemo } from "react";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { SnapshotEditor, SnapshotPreview, type SnapshotConfig, type OverlayFont, type SnapshotOverlay } from "@/components/community/SnapshotEditor";
import { UserProfileModal, type UserProfile } from "@/components/community/UserProfileModal";
import { ChallengesBanner } from "@/components/community/ChallengesBanner";
import { MyChallengesScreen } from "@/components/community/MyChallengesScreen";
import { LeaderboardScreen, type LeaderboardMember } from "@/components/community/LeaderboardScreen";



type Post = {
  id: string;
  user: { name: string; avatar: string | null; initials: string };
  imageUrl: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  timeAgo: string;
  jewelryName: string;
  jewelryBrand: string;
  snapshotConfig?: SnapshotConfig;
  overlayText?: string;
  overlayFont?: OverlayFont;
  overlayColor?: string;
  overlayPosition?: "top" | "center" | "bottom";
  shares?: number;
};

// Merge DB post into local Post format
function dbPostToPost(p: any): Post {
  return {
    id: String(p.id),
    user: { name: p.authorName, avatar: p.authorAvatar || null, initials: p.authorName.slice(0, 2).toUpperCase() },
    imageUrl: p.imageUrl || "",
    caption: p.content,
    tags: [],
    likes: p.likesCount ?? 0,
    comments: p.commentsCount ?? 0,
    isLiked: false,
    timeAgo: "Récent",
    jewelryName: p.jewelryType || "",
    jewelryBrand: "",
    shares: p.sharesCount ?? 0,
  };
}

export default function CommunityScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "following" | "mychallenges" | "leaderboard">("feed");
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(new Set());
  const [trendingPeriod, setTrendingPeriod] = useState<"week" | "month">("week");
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshotConfig, setSnapshotConfig] = useState<SnapshotConfig>({
    frame: "none",
    effect: "none",
    decor: "none",
  });
  const [snapshotOverlay, setSnapshotOverlay] = useState<SnapshotOverlay>({
    text:     "",
    font:     "sans",
    color:    "#ffffff",
    position: "bottom",
  });
  const { user } = useAuth();
  // Notifications in-app pour seuils de partages
  const [notifications, setNotifications] = useState<{ id: string; message: string; emoji: string }[]>([]);
  const [shownMilestones, setShownMilestones] = useState<Set<string>>(new Set());

  const triggerShareMilestone = useCallback((postId: string, shares: number) => {
    const milestones = [{ threshold: 50, emoji: "🔥", label: "50 partages" }, { threshold: 10, emoji: "✨", label: "10 partages" }];
    for (const m of milestones) {
      const key = `${postId}-${m.threshold}`;
      if (shares >= m.threshold && !shownMilestones.has(key)) {
        setShownMilestones(prev => new Set([...prev, key]));
        const notifId = `notif-${Date.now()}`;
        setNotifications(prev => [...prev, { id: notifId, message: `Votre post a atteint ${m.label} !`, emoji: m.emoji }]);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Auto-dismiss après 4s
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== notifId)), 4000);
        break;
      }
    }
  }, [shownMilestones]);

  // Load posts from server
  const postsQuery = trpc.community.list.useQuery(undefined, { refetchOnWindowFocus: false });
  const createPostMutation = trpc.community.create.useMutation({
    onSuccess: () => postsQuery.refetch(),
  });
  const likePostMutation = trpc.community.like.useMutation();

  // Charger les posts depuis le serveur uniquement (pas de posts démo)
  const serverPosts: Post[] = (postsQuery.data ?? []).map(dbPostToPost);
  const allPosts: Post[] = serverPosts;

  // Tri selon l'onglet actif + filtre période pour Tendances
  // Les posts démo ont des timeAgo simulés ; on filtre par "semaine" (<=7j) ou "mois" (<=30j)
  const trendingPosts = [...allPosts].sort((a, b) => (b.shares ?? 0) - (a.shares ?? 0));
  const filteredTrending = trendingPeriod === "week"
    ? trendingPosts.filter(p => !p.timeAgo.includes("j") || parseInt(p.timeAgo) <= 7)
    : trendingPosts;
  const posts: Post[] = activeTab === "trending" ? filteredTrending : allPosts;

  // Calcul du classement depuis les posts
  const leaderboardMembers: LeaderboardMember[] = useMemo(() => {
    const map = new Map<string, LeaderboardMember>();
    for (const p of allPosts) {
      const key = p.user.name;
      const existing = map.get(key);
      if (existing) {
        existing.totalLikes += p.likes;
        existing.totalShares += (p.shares ?? 0);
        existing.postsCount += 1;
      } else {
        map.set(key, {
          id: key,
          name: p.user.name,
          initials: p.user.initials,
          avatar: p.user.avatar,
          totalLikes: p.likes,
          totalShares: p.shares ?? 0,
          postsCount: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [allPosts]);

  const handleChallengeJoin = useCallback((id: string) => {
    setJoinedChallengeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const openProfile = useCallback((post: Post) => {
    const userPosts = allPosts
      .filter(p => p.user.name === post.user.name)
      .map(p => ({ id: p.id, imageUrl: p.imageUrl, likes: p.likes, shares: p.shares ?? 0 }));
    const profile: UserProfile = {
      name: post.user.name,
      initials: post.user.initials,
      avatar: post.user.avatar,
      bio: "Passionné(e) de bijoux artisanaux ✨",
      posts: userPosts,
      totalLikes: userPosts.reduce((s, p) => s + p.likes, 0),
      totalShares: userPosts.reduce((s, p) => s + p.shares, 0),
      joinedAgo: "2024",
    };
    setSelectedProfile(profile);
    setShowProfile(true);
  }, [allPosts]);

  const handleLike = useCallback((postId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        // Only like server posts (numeric IDs)
        const numId = parseInt(postId, 10);
        if (!isNaN(numId)) likePostMutation.mutate({ postId: numId });
      }
      return next;
    });
  }, [likePostMutation]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!newCaption.trim() && !newImage) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsPosting(true);
    try {
      const authorName = user?.name || user?.email?.split("@")[0] || "Anonyme";
      await createPostMutation.mutateAsync({
        authorName,
        content: newCaption.trim(),
        imageUrl: newImage || undefined,
      });
    } catch {
      // Fallback: show locally if server fails
    }
    setNewCaption("");
    setNewImage(null);
    setSnapshotConfig({ frame: "none", effect: "none", decor: "none" });
    setSnapshotOverlay({ text: "", font: "sans", color: "#ffffff", position: "bottom" });
    setIsPosting(false);
    setShowNewPost(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      colors={colors}
      onLike={() => handleLike(item.id)}
      onTryOn={() =>
        router.push({
          pathname: "/(tabs)/tryon",
          params: {
            demoJewelryName: item.jewelryName,
            demoJewelryType: "earrings",
          },
        })
      }
      snapshotConfig={item.snapshotConfig}
      overlayText={item.overlayText}
      overlayFont={item.overlayFont}
      overlayColor={item.overlayColor}
      onShare={(shares) => triggerShareMilestone(item.id, shares)}
      rank={activeTab === "trending" ? (posts.indexOf(item) + 1) : undefined}
      onAvatarPress={() => openProfile(item)}
    />
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header luxe */}
      <View style={commStyles.header}>
        <View>
          <Text style={[commStyles.title, { color: colors.foreground }]}>COMMUNAUTÉ</Text>
          <Text style={[commStyles.subtitle, { color: colors.primary }]}>Partagez vos bijoux</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowNewPost(true)}
          style={[commStyles.addBtn, { borderColor: colors.primary }]}
        >
          <IconSymbol name="plus" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={[commStyles.headerLine, { backgroundColor: colors.border }]} />

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
      >
        {(["feed", "trending", "leaderboard", "mychallenges", "following"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              commStyles.tabChip,
              { borderColor: activeTab === tab ? colors.primary : colors.border },
              activeTab === tab && { backgroundColor: colors.foreground },
            ]}
          >
            <Text
              style={[
                commStyles.tabChipText,
                { color: activeTab === tab ? colors.background : colors.muted },
              ]}
            >
              {tab === "feed" ? "FIL" : tab === "trending" ? "TENDANCES" : tab === "leaderboard" ? "CLASSEMENT" : tab === "mychallenges" ? "MES DÉFIS" : "ABONNEMENTS"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtre période — visible uniquement en mode Tendances */}
      {activeTab === "trending" && (
        <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingBottom: 8, gap: 8 }}>
          {(["week", "month"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setTrendingPeriod(p)}
              style={[
                commStyles.periodChip,
                {
                  borderColor: trendingPeriod === p ? colors.primary : colors.border,
                  backgroundColor: trendingPeriod === p ? colors.primary + "22" : "transparent",
                },
              ]}
            >
              <Text style={[commStyles.periodChipText, { color: trendingPeriod === p ? colors.primary : colors.muted }]}>
                {p === "week" ? "CETTE SEMAINE" : "CE MOIS"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Profil utilisateur */}
      <UserProfileModal
        visible={showProfile}
        profile={selectedProfile}
        onClose={() => setShowProfile(false)}
      />

      {/* Notifications in-app */}
      {notifications.map(n => (
        <View
          key={n.id}
          style={[
            commStyles.notifBanner,
            { backgroundColor: colors.foreground },
          ]}
        >
          <Text style={{ fontSize: 18 }}>{n.emoji}</Text>
          <Text style={[commStyles.notifText, { color: colors.background }]}>{n.message}</Text>
        </View>
      ))}

      {/* Posts Feed ou MES DÉFIS */}
      {activeTab === "leaderboard" ? (
        <LeaderboardScreen
          members={leaderboardMembers}
          colors={colors}
          onMemberPress={(id) => {
            const post = allPosts.find(p => p.user.name === id || p.id === id);
            if (post) openProfile(post);
          }}
        />
      ) : activeTab === "mychallenges" ? (
        <MyChallengesScreen
          joinedIds={joinedChallengeIds}
          onJoin={handleChallengeJoin}
          colors={colors}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListHeaderComponent={activeTab === "feed" ? <ChallengesBanner onJoinChallenge={handleChallengeJoin} /> : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-5xl mb-4">📸</Text>
              <Text className="text-xl font-semibold text-foreground text-center mb-2">
                Aucune publication
              </Text>
              <Text className="text-base text-muted text-center">
                Soyez le premier à partager vos bijoux !
              </Text>
            </View>
          }
        />
      )}

      {/* New Post Modal */}
      <Modal
        visible={showNewPost}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewPost(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View
            className="flex-row items-center justify-between px-4 py-4 border-b border-border"
            style={{ paddingTop: 56 }}
          >
            <TouchableOpacity onPress={() => setShowNewPost(false)}>
              <Text className="text-primary font-medium">Annuler</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">Nouvelle publication</Text>
            <TouchableOpacity
              onPress={handlePost}
              disabled={(!newCaption.trim() && !newImage) || isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  className="font-semibold"
                  style={{
                    color:
                      newCaption.trim() || newImage ? colors.primary : colors.muted,
                  }}
                >
                  Publier
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 py-4">
            {/* Image picker + bouton Snapshot */}
            <TouchableOpacity
              onPress={handlePickImage}
              className="w-full aspect-square rounded-2xl overflow-hidden mb-3 items-center justify-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: newImage ? "transparent" : colors.border,
                borderStyle: "dashed",
              }}
            >
              {newImage ? (
                snapshotConfig.frame !== "none" || snapshotConfig.effect !== "none" || snapshotConfig.decor !== "none" ? (
                  <SnapshotPreview
                    imageUri={newImage}
                    config={snapshotConfig}
                    overlay={snapshotOverlay}
                    width={300}
                    height={snapshotConfig.frame === "story" ? Math.round(300 * 16 / 9) : 300}
                    colors={colors}
                  />
                ) : (
                  <Image
                    source={{ uri: newImage }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                )
              ) : (
                <View className="items-center gap-3">
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.border }}
                  >
                    <IconSymbol name="camera.fill" size={28} color={colors.muted} />
                  </View>
                  <Text className="text-muted text-sm">Appuyez pour ajouter une photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Bouton mode Snapshot */}
            {newImage && (
              <TouchableOpacity
                onPress={() => setShowSnapshot(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 14 }}>📷</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
                  MODE SNAPSHOT
                </Text>
                {(snapshotConfig.frame !== "none" || snapshotConfig.effect !== "none" || snapshotConfig.decor !== "none") && (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                )}
              </TouchableOpacity>
            )}

            {/* Caption */}
            <TextInput
              value={newCaption}
              onChangeText={setNewCaption}
              placeholder="Partagez votre coup de cœur bijou..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              className="text-base text-foreground"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                minHeight: 100,
                borderWidth: 1,
                borderColor: colors.border,
                textAlignVertical: "top",
              }}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal Snapshot ── */}
      <Modal
        visible={showSnapshot}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSnapshot(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              paddingTop: 56,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <TouchableOpacity onPress={() => setShowSnapshot(false)}>
              <Text style={{ color: colors.muted, fontSize: 14 }}>Annuler</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: "700", letterSpacing: 1.5 }}>
              📷 MODE SNAPSHOT
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowSnapshot(false);
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          {/* Éditeur Snapshot */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 20, gap: 16 }}>
            {newImage ? (
              <SnapshotEditor
                imageUri={newImage}
                config={snapshotConfig}
                overlay={snapshotOverlay}
                onChange={setSnapshotConfig}
                onOverlay={setSnapshotOverlay}
                previewSize={280}
              />
            ) : null}

            {/* Bouton reset */}
            {(snapshotConfig.frame !== "none" || snapshotConfig.effect !== "none" || snapshotConfig.decor !== "none") && (
              <TouchableOpacity
                onPress={() => setSnapshotConfig({ frame: "none", effect: "none", decor: "none" })}
                style={{
                  marginHorizontal: 20,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 12, letterSpacing: 0.5 }}>Réinitialiser</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function PostCard({
  post,
  colors,
  onLike,
  onTryOn,
  snapshotConfig,
  overlayText,
  overlayFont,
  overlayColor,
  onShare,
  rank,
  onAvatarPress,
}: {
  post: Post;
  colors: ReturnType<typeof useColors>;
  onLike: () => void;
  onTryOn: () => void;
  snapshotConfig?: SnapshotConfig;
  overlayText?: string;
  overlayFont?: OverlayFont;
  overlayColor?: string;
  onShare?: (shares: number) => void;
  rank?: number;
  onAvatarPress?: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!post.imageUrl) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSharing(true);
    // Déclencher la notification de milestone si applicable
    const newShares = (post.shares ?? 0) + 1;
    onShare?.(newShares);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        setIsSharing(false);
        return;
      }
      // Télécharger l'image localement pour pouvoir la partager
      const localUri = FileSystem.cacheDirectory + "snapshot_share.jpg";
      const download = await FileSystem.downloadAsync(post.imageUrl, localUri);
      await Sharing.shareAsync(download.uri, {
        mimeType: "image/jpeg",
        dialogTitle: "Partager sur Instagram Story",
        UTI: "public.jpeg",
      });
    } catch (e) {
      // Silently fail
    }
    setIsSharing(false);
  };

  const hasSnapshot = snapshotConfig &&
    (snapshotConfig.frame !== "none" || snapshotConfig.effect !== "none" || snapshotConfig.decor !== "none");
  const isStory = snapshotConfig?.frame === "story";
  const cardWidth = 340; // largeur approximative de la carte
  const previewW = isStory ? Math.round(cardWidth * 0.55) : cardWidth;
  const previewH = isStory ? Math.round(previewW * 16 / 9) : cardWidth;

  return (
    <View style={[commStyles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Post Header */}
      <View style={commStyles.postHeader}>
        <TouchableOpacity
          onPress={onAvatarPress}
          style={[commStyles.avatar, { borderColor: colors.primary }]}
          activeOpacity={0.75}
        >
          <Text style={[commStyles.avatarText, { color: colors.primary }]}>
            {post.user.initials}
          </Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[commStyles.posterName, { color: colors.foreground }]}>{post.user.name}</Text>
          <Text style={[commStyles.postTime, { color: colors.muted }]}>{post.timeAgo}</Text>
        </View>
        {rank ? (
          <View style={[commStyles.rankBadge, { backgroundColor: rank === 1 ? "#C9A96E" : rank === 2 ? "#A8A9AD" : rank === 3 ? "#CD7F32" : colors.surface }]}>
            <Text style={[commStyles.rankText, { color: rank <= 3 ? "#fff" : colors.muted }]}>
              {rank === 1 ? "🔥" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
            </Text>
          </View>
        ) : post.jewelryBrand ? (
          <Text style={[commStyles.brandBadge, { color: colors.primary }]}>
            {post.jewelryBrand}
          </Text>
        ) : null}
      </View>

      {/* Post Image — avec ou sans Snapshot */}
      {post.imageUrl ? (
        hasSnapshot ? (
          <View style={[
            { overflow: "hidden", alignItems: "center", justifyContent: "center" },
            isStory ? { backgroundColor: "#000", paddingVertical: 12 } : {},
          ]}>
            <SnapshotPreview
              imageUri={post.imageUrl}
              config={snapshotConfig!}
              overlay={{
                text:     overlayText     ?? "",
                font:     overlayFont     ?? "sans",
                color:    overlayColor    ?? "#ffffff",
                position: (post as any).overlayPosition ?? "bottom",
              }}
              width={previewW}
              height={previewH}
              colors={colors}
            />
          </View>
        ) : (
          <View style={{ aspectRatio: 1 }}>
            <Image
              source={{ uri: post.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
        )
      ) : null}

      {/* Actions */}
      <View style={commStyles.postActions}>
        <TouchableOpacity
          onPress={onLike}
          style={commStyles.actionBtn}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={post.isLiked ? "heart.fill" : "heart"}
            size={18}
            color={post.isLiked ? "#C9A96E" : colors.muted}
          />
          <Text style={[commStyles.actionCount, { color: colors.muted }]}>{post.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          style={commStyles.actionBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="bubble.left" size={17} color={colors.muted} />
          <Text style={[commStyles.actionCount, { color: colors.muted }]}>{post.comments}</Text>
        </TouchableOpacity>

        {/* Compteur de partages */}
        {(post.shares ?? 0) > 0 ? (
          <TouchableOpacity
            onPress={handleShare}
            style={commStyles.actionBtn}
            activeOpacity={0.7}
          >
            <IconSymbol name="square.and.arrow.up" size={16} color={colors.muted} />
            <Text style={[commStyles.actionCount, { color: colors.muted }]}>{post.shares}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1 }} />

        {/* Bouton Partager pour les posts Story */}
        {snapshotConfig?.frame === "story" && post.imageUrl ? (
          <TouchableOpacity
            onPress={handleShare}
            style={[commStyles.tryBtn, { borderColor: colors.primary, marginRight: 6 }]}
            activeOpacity={0.8}
            disabled={isSharing}
          >
            <IconSymbol name="square.and.arrow.up" size={13} color={colors.primary} />
            <Text style={[commStyles.tryBtnText, { color: colors.primary, marginLeft: 4 }]}>
              {isSharing ? "…" : "STORY"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {post.jewelryName ? (
          <TouchableOpacity
            onPress={onTryOn}
            style={[commStyles.tryBtn, { borderColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[commStyles.tryBtnText, { color: colors.primary }]}>ESSAYER</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Caption */}
      <View style={commStyles.postCaption}>
        <Text style={[commStyles.captionText, { color: colors.foreground }]}>
          <Text style={{ fontWeight: "600" }}>{post.user.name} </Text>
          {post.caption}
        </Text>
        {post.tags.length > 0 && (
          <Text style={[commStyles.tagsText, { color: colors.primary }]}>
            {post.tags.join(" ")}
          </Text>
        )}
      </View>
    </View>
  );
}

const commStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 4,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "400",
    letterSpacing: 3,
    marginTop: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLine: {
    height: 0.5,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
  },
  tabChipText: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2,
  },
  postCard: {
    marginBottom: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  posterName: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  postTime: {
    fontSize: 10,
    fontWeight: "300",
    letterSpacing: 0.3,
    marginTop: 1,
  },
  brandBadge: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 1.5,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 14,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionCount: {
    fontSize: 11,
    fontWeight: "300",
  },
  tryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  tryBtnText: {
    fontSize: 8,
    fontWeight: "500",
    letterSpacing: 2,
  },
  postCaption: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  captionText: {
    fontSize: 12,
    fontWeight: "300",
    lineHeight: 18,
  },
  tagsText: {
    fontSize: 11,
    fontWeight: "300",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  notifBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  notifText: {
    fontSize: 13,
    fontWeight: "500" as const,
    flex: 1,
  },
  rankBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodChipText: {
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 0.8,
  },
});
