import { ScrollView, Text, View, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();

  const handleStartTryOn = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/capture");
  };

  const handleViewGallery = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/gallery");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/* Logo Section */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-4">
              <Text className="text-4xl">💎</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground text-center">
              Écrin Virtuel
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              Votre bijouterie virtuelle
            </Text>
          </View>

          {/* Hero Section */}
          <View className="bg-surface rounded-3xl p-6 mb-8 border border-border">
            <Text className="text-2xl font-bold text-foreground text-center mb-4">
              Essayez Virtuellement les Bijoux que Vous Aimez
            </Text>
            <Text className="text-base text-muted text-center leading-relaxed">
              Photographiez un bijou en vitrine ou dans un magazine, et essayez-le sur vous instantanément grâce à la réalité augmentée.
            </Text>
          </View>

          {/* Features Grid */}
          <View className="flex-row flex-wrap justify-between mb-8">
            <FeatureCard
              icon="📸"
              title="Photographiez"
              description="Capturez n'importe quel bijou"
            />
            <FeatureCard
              icon="✨"
              title="Analysez"
              description="L'IA détecte le bijou"
            />
            <FeatureCard
              icon="👤"
              title="Essayez"
              description="Visualisez sur vous"
            />
            <FeatureCard
              icon="💾"
              title="Sauvegardez"
              description="Gardez vos favoris"
            />
          </View>

          {/* CTA Buttons */}
          <View className="gap-4">
            <TouchableOpacity
              onPress={handleStartTryOn}
              className="bg-primary py-4 px-8 rounded-full items-center active:opacity-80"
              style={{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
            >
              <Text className="text-background text-lg font-bold">
                Commencer l'Essayage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewGallery}
              className="border-2 border-primary py-4 px-8 rounded-full items-center active:opacity-80"
            >
              <Text className="text-primary text-lg font-semibold">
                Voir mes Essayages
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="mt-auto pt-8">
            <Text className="text-sm text-muted text-center">
              Écrin Virtuel v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View className="w-[48%] bg-surface rounded-2xl p-4 mb-4 border border-border">
      <Text className="text-3xl mb-2">{icon}</Text>
      <Text className="text-base font-semibold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted">{description}</Text>
    </View>
  );
}
