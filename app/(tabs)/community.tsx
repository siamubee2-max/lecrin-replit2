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
import { useState, useCallback } from "react";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Demo community posts with real Moniattitude jewelry images
const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663144691943/CiR7qZ3C59qboMiNR9PxaK";
const MONI_CDN = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";

const DEMO_POSTS = [
  {
    id: "post-1",
    user: { name: "Sophie M.", avatar: null, initials: "SM" },
    imageUrl: `${MONI_CDN}/foIbwvIEZnQRCkLk.jpeg`,
    caption: "Mes nouvelles boucles d'oreilles fleur dorée de Moni'attitude 🌸 Parfaites pour l'été !",
    tags: ["#bijoux", "#moniattitude", "#fleur", "#artisanal"],
    likes: 42,
    comments: 8,
    isLiked: false,
    timeAgo: "2h",
    jewelryName: "Boucles fleur dorée",
    jewelryBrand: "MONI'ATTITUDE",
  },
  {
    id: "post-2",
    user: { name: "Léa B.", avatar: null, initials: "LB" },
    imageUrl: `${MONI_CDN}/haAwgRGsClqKFANk.jpeg`,
    caption: "Look du jour avec ces boucles vertes 💚 J'adore comment elles illuminent ma tenue !",
    tags: ["#ootd", "#bijoux", "#vert", "#handmade"],
    likes: 67,
    comments: 14,
    isLiked: true,
    timeAgo: "5h",
    jewelryName: "Boucles fleur vertes",
    jewelryBrand: "MONI'ATTITUDE",
  },
  {
    id: "post-3",
    user: { name: "Marie C.", avatar: null, initials: "MC" },
    imageUrl: `${MONI_CDN}/jxfiqAoWKZPAIFjU.jpeg`,
    caption: "Cadeau de ma meilleure amie 💕 Ces boucles cœur sont trop mignonnes !",
    tags: ["#cadeau", "#coeur", "#amitié", "#bijoux"],
    likes: 89,
    comments: 23,
    isLiked: false,
    timeAgo: "1j",
    jewelryName: "Boucles cœur tendre",
    jewelryBrand: "MONI'ATTITUDE",
  },
  {
    id: "post-4",
    user: { name: "Clara D.", avatar: null, initials: "CD" },
    imageUrl: `${MONI_CDN}/rjfmUlamBZcBgUfF.jpeg`,
    caption: "Ces boucles en résine orange sont incroyables ! Chaque paire est unique 🧡✨",
    tags: ["#résine", "#artisanat", "#unique", "#orange"],
    likes: 54,
    comments: 11,
    isLiked: false,
    timeAgo: "2j",
    jewelryName: "Boucles résine orange",
    jewelryBrand: "MONI'ATTITUDE",
  },
  {
    id: "post-5",
    user: { name: "Emma R.", avatar: null, initials: "ER" },
    imageUrl: `${MONI_CDN}/enfnjOfHaPReDorw.jpeg`,
    caption: "Ma collection s'agrandit ! Ces feuilles métallisées sont parfaites pour l'automne 🍂",
    tags: ["#feuille", "#automne", "#collection", "#bijoux"],
    likes: 38,
    comments: 6,
    isLiked: true,
    timeAgo: "3j",
    jewelryName: "Boucles feuille métalisée",
    jewelryBrand: "MONI'ATTITUDE",
  },
];

type Post = typeof DEMO_POSTS[0];

export default function CommunityScreen() {
  const colors = useColors();
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [activeTab, setActiveTab] = useState<"feed" | "trending" | "following">("feed");
  const [showNewPost, setShowNewPost] = useState(false);
  const [newCaption, setNewCaption] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleLike = useCallback((postId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

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
    await new Promise(r => setTimeout(r, 800));
    const newPost: Post = {
      id: `post-${Date.now()}`,
      user: { name: "Vous", avatar: null, initials: "V" },
      imageUrl: newImage || "",
      caption: newCaption.trim(),
      tags: [],
      likes: 0,
      comments: 0,
      isLiked: false,
      timeAgo: "À l'instant",
      jewelryName: "",
      jewelryBrand: "",
    };
    setPosts(prev => [newPost, ...prev]);
    setNewCaption("");
    setNewImage(null);
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
        {(["feed", "trending", "following"] as const).map((tab) => (
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
              {tab === "feed" ? "FIL" : tab === "trending" ? "TENDANCES" : "ABONNEMENTS"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: 100 }}
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
            {/* Image picker */}
            <TouchableOpacity
              onPress={handlePickImage}
              className="w-full aspect-square rounded-2xl overflow-hidden mb-4 items-center justify-center"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 2,
                borderColor: newImage ? "transparent" : colors.border,
                borderStyle: "dashed",
              }}
            >
              {newImage ? (
                <Image
                  source={{ uri: newImage }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
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
    </ScreenContainer>
  );
}

function PostCard({
  post,
  colors,
  onLike,
  onTryOn,
}: {
  post: Post;
  colors: ReturnType<typeof useColors>;
  onLike: () => void;
  onTryOn: () => void;
}) {
  const [showComments, setShowComments] = useState(false);

  return (
    <View style={[commStyles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Post Header */}
      <View style={commStyles.postHeader}>
        <View style={[commStyles.avatar, { borderColor: colors.primary }]}>
          <Text style={[commStyles.avatarText, { color: colors.primary }]}>
            {post.user.initials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[commStyles.posterName, { color: colors.foreground }]}>{post.user.name}</Text>
          <Text style={[commStyles.postTime, { color: colors.muted }]}>{post.timeAgo}</Text>
        </View>
        {post.jewelryBrand ? (
          <Text style={[commStyles.brandBadge, { color: colors.primary }]}>
            {post.jewelryBrand}
          </Text>
        ) : null}
      </View>

      {/* Post Image */}
      {post.imageUrl ? (
        <View style={{ aspectRatio: 1 }}>
          <Image
            source={{ uri: post.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </View>
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

        <View style={{ flex: 1 }} />

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
});
