import { ScrollView, Text, View, TouchableOpacity, Image, StyleSheet, Linking } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

// Active creators
const CREATORS = [
  {
    id: "1",
    name: "Moniattitude",
    description: "bijoux artisanaux! Pièce unique",
    website: "https://moniattitude.com",
    isPremium: true,
    logo: null,
  },
];

// Featured collections
const COLLECTIONS = [
  {
    id: "1",
    name: "Looks Vedettes",
    description: "Essayages inspirants",
    icon: "✨",
  },
  {
    id: "2",
    name: "Toutes les Collections",
    description: "Explorer tout",
    icon: "📚",
  },
];

export default function BoutiqueScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<"featured" | "collections">("featured");

  const handleVisitCreator = (url: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  };

  const handleBecomeCreator = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Linking.openURL("mailto:inferencevision@inferencevision.store?subject=Demande%20de%20partenariat%20Écrin%20Virtuel&body=Bonjour,%0A%0AJe%20souhaite%20devenir%20créateur%20partenaire%20sur%20L'Écrin%20Virtuel.%0A%0AMa%20marque:%0AMon%20site%20web:%0A%0ACordialement");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Section */}
        <View 
          className="mx-4 mt-4 rounded-3xl overflow-hidden"
          style={styles.heroContainer}
        >
          <View className="p-6" style={{ backgroundColor: '#0A1A3B' }}>
            <View 
              className="flex-row items-center px-3 py-1 rounded-full self-start mb-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-xs mr-1">👑</Text>
              <Text className="text-xs font-semibold" style={{ color: '#0A1A3B' }}>
                Marques & Créateurs Partenaires
              </Text>
            </View>
            
            <Text className="text-3xl font-bold text-white mb-2">
              Boutique Style
            </Text>
            <Text className="text-2xl font-bold text-white mb-4">
              Sélectionné
            </Text>
            
            <Text className="text-base text-white/80 leading-relaxed mb-6">
              Découvrez des collections exclusives de marques de luxe et de stylistes experts. Achetez le look en un clic.
            </Text>

            <TouchableOpacity
              className="flex-row items-center self-start px-6 py-3 rounded-full"
              style={[styles.ctaButton, { backgroundColor: colors.background }]}
            >
              <IconSymbol name="sparkles" size={18} color={colors.foreground} />
              <Text className="text-base font-semibold ml-2" style={{ color: colors.foreground }}>
                Explorer les Collections
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Creators Section */}
        <View className="px-4 mt-8">
          <View className="flex-row items-center mb-4">
            <Text className="text-xl mr-2" style={{ color: colors.primary }}>👑</Text>
            <Text className="text-xl font-bold text-foreground">
              Partenaires Vedettes
            </Text>
          </View>

          {CREATORS.map((creator) => (
            <View 
              key={creator.id}
              className="rounded-2xl overflow-hidden mb-4"
              style={[styles.creatorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {/* Creator Logo Placeholder */}
              <View 
                className="h-24 items-center justify-center"
                style={{ backgroundColor: colors.background }}
              >
                <Text className="text-2xl text-muted font-light tracking-widest">
                  {creator.name}
                </Text>
              </View>
              
              {/* Creator Info */}
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-lg font-bold text-foreground">
                    {creator.name}
                  </Text>
                  {creator.isPremium && (
                    <View 
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: colors.foreground }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: colors.background }}>
                        premium
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-muted mb-4">
                  {creator.description}
                </Text>
                
                <TouchableOpacity
                  onPress={() => handleVisitCreator(creator.website)}
                  className="flex-row items-center justify-center py-3 rounded-xl"
                  style={{ borderWidth: 1, borderColor: colors.border }}
                >
                  <Text className="text-sm font-semibold text-foreground mr-2">
                    Visiter la Marque
                  </Text>
                  <IconSymbol name="link" size={16} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Become a Creator CTA */}
        <View className="px-4 mt-4">
          <TouchableOpacity
            onPress={handleBecomeCreator}
            className="rounded-2xl p-6"
            style={[styles.becomeCreatorCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          >
            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-3">🎨</Text>
              <Text className="text-lg font-bold text-foreground">
                Vous êtes créateur ?
              </Text>
            </View>
            <Text className="text-sm text-muted mb-4">
              Rejoignez notre plateforme et permettez à vos clients d'essayer virtuellement vos créations avant l'achat.
            </Text>
            <View 
              className="flex-row items-center justify-center py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <IconSymbol name="envelope.fill" size={18} color="#0A1A3B" />
              <Text className="text-sm font-semibold ml-2" style={{ color: '#0A1A3B' }}>
                Devenir Partenaire
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Collections Tabs */}
        <View className="px-4 mt-8">
          <View className="flex-row mb-4">
            <TouchableOpacity
              onPress={() => setActiveTab("featured")}
              className="flex-row items-center mr-6 pb-2"
              style={activeTab === "featured" && { borderBottomWidth: 2, borderBottomColor: colors.primary }}
            >
              <IconSymbol name="sparkles" size={18} color={activeTab === "featured" ? colors.primary : colors.muted} />
              <Text 
                className="text-base font-semibold ml-2"
                style={{ color: activeTab === "featured" ? colors.primary : colors.muted }}
              >
                Looks Vedettes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTab("collections")}
              className="flex-row items-center pb-2"
              style={activeTab === "collections" && { borderBottomWidth: 2, borderBottomColor: colors.primary }}
            >
              <IconSymbol name="rectangle.stack.fill" size={18} color={activeTab === "collections" ? colors.primary : colors.muted} />
              <Text 
                className="text-base font-semibold ml-2"
                style={{ color: activeTab === "collections" ? colors.primary : colors.muted }}
              >
                Toutes les Collections
              </Text>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          <View 
            className="rounded-2xl p-8 items-center"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-4xl mb-3">
              {activeTab === "featured" ? "✨" : "📚"}
            </Text>
            <Text className="text-base text-muted text-center">
              {activeTab === "featured" 
                ? "Les looks vedettes arrivent bientôt"
                : "Explorez les collections de nos créateurs"
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creatorCard: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  becomeCreatorCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
