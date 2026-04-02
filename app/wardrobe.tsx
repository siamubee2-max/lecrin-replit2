import { ScrollView, Text, View, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, TextInput, Platform } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

// Body part types with labels and icons
const BODY_TYPES = [
  { value: "face", label: "Visage", icon: "👤" },
  { value: "neck", label: "Cou", icon: "🧣" },
  { value: "bust_with_hands", label: "Buste avec mains", icon: "💃" },
  { value: "left_ear_profile", label: "Profil oreille gauche", icon: "👂" },
  { value: "right_ear_profile", label: "Profil oreille droite", icon: "👂" },
  { value: "left_wrist", label: "Poignet gauche", icon: "⌚" },
  { value: "right_wrist", label: "Poignet droit", icon: "⌚" },
  { value: "left_hand", label: "Main gauche", icon: "✋" },
  { value: "right_hand", label: "Main droite", icon: "✋" },
  { value: "left_ankle", label: "Cheville gauche", icon: "🦶" },
  { value: "right_ankle", label: "Cheville droite", icon: "🦶" },
  { value: "full_body", label: "Corps entier", icon: "🧍" },
] as const;

type BodyPartType = typeof BODY_TYPES[number]["value"];

export default function WardrobeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();
  
  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newPart, setNewPart] = useState({
    name: "",
    type: "face" as BodyPartType,
    imageUrl: "",
  });

  // Fetch user's body parts
  const { data: bodyParts, isLoading, refetch } = trpc.bodyParts.userParts.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Mutations
  const addMutation = trpc.bodyParts.add.useMutation({
    onSuccess: () => {
      refetch();
      setIsModalOpen(false);
      setNewPart({ name: "", type: "face", imageUrl: "" });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      Alert.alert("Erreur", error.message);
    },
  });

  const deleteMutation = trpc.bodyParts.delete.useMutation({
    onSuccess: () => {
      refetch();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onError: (error) => {
      Alert.alert("Erreur", error.message);
    },
  });

  // Handle image selection
  const handleSelectImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Veuillez autoriser l'accès à la galerie photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        // For now, use the local URI - in production, upload to S3
        setNewPart(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
      } catch (error) {
        Alert.alert("Erreur", "Impossible de charger l'image");
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle camera capture
  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Veuillez autoriser l'accès à la caméra.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        setNewPart(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
      } catch (error) {
        Alert.alert("Erreur", "Impossible de charger l'image");
      } finally {
        setUploading(false);
      }
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (!newPart.name || !newPart.imageUrl) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
      return;
    }
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    addMutation.mutate({
      name: newPart.name,
      type: newPart.type,
      imageUrl: newPart.imageUrl,
    });
  };

  // Handle delete
  const handleDelete = (id: string) => {
    Alert.alert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cette photo ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id })
        },
      ]
    );
  };

  // If not logged in
  if (!isAuthLoading && !user) {
    return (
      <ScreenContainer className="bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-6xl mb-4">🔐</Text>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            Connexion requise
          </Text>
          <Text className="text-base text-muted text-center mb-6">
            Connectez-vous pour accéder à votre garde-robe personnelle.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/login")}
            className="px-8 py-4 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-base font-semibold" style={{ color: '#0A1A3B' }}>
              Se connecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Ma Garde-Robe</Text>
        <TouchableOpacity 
          onPress={() => setIsModalOpen(true)}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <IconSymbol name="plus" size={20} color="#0A1A3B" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Description */}
        <View className="px-4 py-6">
          <Text className="text-base text-muted leading-relaxed">
            Ajoutez vos propres photos pour essayer virtuellement des bijoux sur vous.
            L{"'"}IA vous aidera à trouver les correspondances parfaites.
          </Text>
        </View>

        {/* Body Parts Grid */}
        {isLoading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm text-muted mt-2">Chargement...</Text>
          </View>
        ) : bodyParts && bodyParts.length > 0 ? (
          <View className="px-4">
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
              {bodyParts.map((part) => (
                <View key={String(part.id)} className="w-1/2 p-1.5">
                  <View 
                    className="rounded-2xl overflow-hidden"
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View className="aspect-[3/4] bg-neutral-100 relative">
                      <Image
                        source={{ uri: part.imageUrl }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />
                      
                      {/* Delete button */}
                      <TouchableOpacity
                        onPress={() => handleDelete(String(part.id))}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
                      >
                        <IconSymbol name="trash.fill" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      
                      {/* Type label */}
                      <View 
                        className="absolute bottom-0 left-0 right-0 p-3"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                      >
                        <Text className="text-white text-xs uppercase tracking-wider">
                          {BODY_TYPES.find(t => t.value === part.type)?.label || part.type}
                        </Text>
                        <Text className="text-white/80 text-xs mt-0.5" numberOfLines={1}>
                          {part.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="mx-4 py-16 items-center rounded-2xl border border-dashed" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
            <Text className="text-5xl mb-4">👤</Text>
            <Text className="text-lg font-semibold text-foreground mb-1">
              Aucune photo
            </Text>
            <Text className="text-sm text-muted text-center px-8 mb-6">
              Ajoutez vos premières photos pour commencer les essayages virtuels personnalisés.
            </Text>
            <TouchableOpacity
              onPress={() => setIsModalOpen(true)}
              className="flex-row items-center px-6 py-3 rounded-full"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="plus" size={18} color="#0A1A3B" />
              <Text className="text-sm font-semibold ml-2" style={{ color: '#0A1A3B' }}>
                Ajouter une photo
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Photo Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b" style={{ borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Text className="text-base" style={{ color: colors.primary }}>Annuler</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-foreground">Nouvelle Photo</Text>
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={!newPart.name || !newPart.imageUrl || addMutation.isPending}
            >
              <Text 
                className="text-base font-semibold"
                style={{ color: (!newPart.name || !newPart.imageUrl) ? colors.muted : colors.primary }}
              >
                {addMutation.isPending ? "..." : "Ajouter"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Name Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Nom</Text>
              <TextInput
                placeholder="Ex: Ma main droite"
                value={newPart.name}
                onChangeText={(text) => setNewPart(prev => ({ ...prev, name: text }))}
                className="px-4 py-3 rounded-xl text-base"
                style={{ 
                  backgroundColor: colors.surface, 
                  borderWidth: 1, 
                  borderColor: colors.border,
                  color: colors.foreground
                }}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* Type Selector */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Type de partie du corps</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {BODY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setNewPart(prev => ({ ...prev, type: type.value }));
                      }}
                      className="px-4 py-2 rounded-full flex-row items-center"
                      style={{
                        backgroundColor: newPart.type === type.value ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: newPart.type === type.value ? colors.primary : colors.border,
                      }}
                    >
                      <Text className="mr-1">{type.icon}</Text>
                      <Text 
                        className="text-sm font-medium"
                        style={{ color: newPart.type === type.value ? '#0A1A3B' : colors.foreground }}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Photo Upload */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Photo</Text>
              <TouchableOpacity
                onPress={handleSelectImage}
                className="rounded-2xl overflow-hidden"
                style={{ 
                  borderWidth: 2, 
                  borderStyle: 'dashed', 
                  borderColor: colors.border,
                  backgroundColor: colors.surface 
                }}
              >
                {uploading ? (
                  <View className="aspect-[3/4] items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-sm text-muted mt-2">Chargement...</Text>
                  </View>
                ) : newPart.imageUrl ? (
                  <View className="aspect-[3/4] relative">
                    <Image
                      source={{ uri: newPart.imageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <View 
                      className="absolute inset-0 items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      <Text className="text-white font-semibold">Changer</Text>
                    </View>
                  </View>
                ) : (
                  <View className="aspect-[3/4] items-center justify-center">
                    <IconSymbol name="camera.fill" size={40} color={colors.muted} />
                    <Text className="text-sm font-medium text-muted mt-3">
                      Cliquez pour importer
                    </Text>
                    <Text className="text-xs text-muted mt-1">
                      JPG, PNG
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Camera button */}
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="flex-row items-center justify-center mt-3 py-3 rounded-xl"
                style={{ borderWidth: 1, borderColor: colors.border }}
              >
                <IconSymbol name="camera.fill" size={18} color={colors.foreground} />
                <Text className="text-sm font-medium text-foreground ml-2">
                  Prendre une photo
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
