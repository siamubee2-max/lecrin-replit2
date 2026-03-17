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
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-foreground">Communauté</Text>
          <Text className="text-sm text-muted mt-0.5">Partagez vos bijoux préférés</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowNewPost(true)}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.foreground }}
        >
          <IconSymbol name="plus" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-3 gap-2">
        {(["feed", "trending", "following"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-full"
            style={[
              { borderWidth: 1, borderColor: colors.border },
              activeTab === tab && { backgroundColor: colors.foreground },
            ]}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: activeTab === tab ? colors.background : colors.foreground }}
            >
              {tab === "feed" ? "Fil" : tab === "trending" ? "Tendances" : "Abonnements"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
    <View
      className="mb-4 mx-4 rounded-2xl overflow-hidden"
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
    >
      {/* Post Header */}
      <View className="flex-row items-center px-4 py-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: colors.primary + "30" }}
        >
          <Text className="text-sm font-bold" style={{ color: colors.primary }}>
            {post.user.initials}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{post.user.name}</Text>
          <Text className="text-xs text-muted">{post.timeAgo}</Text>
        </View>
        {post.jewelryBrand ? (
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: colors.primary + "20" }}
          >
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>
              {post.jewelryBrand}
            </Text>
          </View>
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
      <View className="flex-row items-center px-4 py-3 gap-4">
        <TouchableOpacity
          onPress={onLike}
          className="flex-row items-center gap-1.5"
          activeOpacity={0.7}
        >
          <IconSymbol
            name={post.isLiked ? "heart.fill" : "heart"}
            size={22}
            color={post.isLiked ? "#EF4444" : colors.muted}
          />
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowComments(!showComments)}
          className="flex-row items-center gap-1.5"
          activeOpacity={0.7}
        >
          <IconSymbol name="bubble.left" size={20} color={colors.muted} />
          <Text className="text-sm font-medium" style={{ color: colors.muted }}>
            {post.comments}
          </Text>
        </TouchableOpacity>

        <View className="flex-1" />

        {/* Try On button */}
        {post.jewelryName ? (
          <TouchableOpacity
            onPress={onTryOn}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: colors.foreground }}
            activeOpacity={0.8}
          >
            <IconSymbol name="sparkles" size={14} color={colors.background} />
            <Text className="text-xs font-semibold" style={{ color: colors.background }}>
              Essayer
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Caption */}
      <View className="px-4 pb-3">
        <Text className="text-sm text-foreground leading-5">
          <Text className="font-semibold">{post.user.name} </Text>
          {post.caption}
        </Text>
        {post.tags.length > 0 && (
          <Text className="text-sm mt-1" style={{ color: colors.primary }}>
            {post.tags.join(" ")}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
