import { ScrollView, Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
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
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-foreground text-center">
              Écrin Virtuel
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              Votre bijouterie virtuelle
            </Text>
          </View>

          {/* Hero Section */}
          <View 
            className="rounded-3xl p-6 mb-8"
            style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View className="flex-row items-center justify-center mb-3">
              <View 
                className="w-1 h-6 rounded-full mr-3"
                style={{ backgroundColor: colors.primary }}
              />
              <Text className="text-2xl font-bold text-foreground text-center">
                Essayez Virtuellement les Bijoux que Vous Aimez
              </Text>
              <View 
                className="w-1 h-6 rounded-full ml-3"
                style={{ backgroundColor: colors.primary }}
              />
            </View>
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
              accentColor={colors.primary}
            />
            <FeatureCard
              icon="✨"
              title="Analysez"
              description="L'IA détecte le bijou"
              accentColor={colors.primary}
            />
            <FeatureCard
              icon="👤"
              title="Essayez"
              description="Visualisez sur vous"
              accentColor={colors.primary}
            />
            <FeatureCard
              icon="💾"
              title="Sauvegardez"
              description="Gardez vos favoris"
              accentColor={colors.primary}
            />
          </View>

          {/* CTA Buttons */}
          <View className="gap-4">
            <TouchableOpacity
              onPress={handleStartTryOn}
              className="py-4 px-8 rounded-full items-center active:opacity-80"
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text className="text-lg font-bold" style={{ color: '#0A1A3B' }}>
                Commencer l'Essayage
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewGallery}
              className="py-4 px-8 rounded-full items-center active:opacity-80"
              style={[styles.secondaryButton, { borderColor: colors.primary }]}
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

function FeatureCard({ 
  icon, 
  title, 
  description,
  accentColor 
}: { 
  icon: string; 
  title: string; 
  description: string;
  accentColor: string;
}) {
  return (
    <View 
      className="w-[48%] rounded-2xl p-4 mb-4"
      style={styles.featureCard}
    >
      <View 
        className="w-12 h-12 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: accentColor + '20' }}
      >
        <Text className="text-2xl">{icon}</Text>
      </View>
      <Text className="text-base font-semibold text-foreground mb-1">{title}</Text>
      <Text className="text-sm text-muted">{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 20,
  },
  heroCard: {
    borderWidth: 1,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featureCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  primaryButton: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});
