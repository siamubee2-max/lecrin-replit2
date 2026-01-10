import { ScrollView, Text, View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n-context";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t, language, flags } = useI18n();

  const handleStartTryOn = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/tryon");
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1">
          {/* Header with Logo and Language */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center">
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text className="text-xl font-bold text-foreground ml-2">
                {t.brand.name.split(" ")[0]} <Text style={{ color: colors.primary }}>{t.brand.name.split(" ").slice(1).join(" ") || "Virtuel"}</Text>
              </Text>
            </View>
            
            <View className="flex-row items-center">
              {/* Language Selector */}
              <LanguageSelector variant="dropdown" showName={false} />
              
              {/* Profile Button */}
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                className="w-10 h-10 rounded-full items-center justify-center ml-2"
                style={{ backgroundColor: colors.primary }}
              >
                <IconSymbol name="person.fill" size={20} color="#0A1A3B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Section */}
          <View 
            className="mx-4 mt-4 rounded-3xl overflow-hidden"
            style={styles.heroContainer}
          >
            <View className="p-6" style={{ backgroundColor: '#0A1A3B' }}>
              <View 
                className="px-3 py-1 rounded-full self-start mb-4"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-xs font-semibold" style={{ color: '#0A1A3B' }}>
                  ✨ {t.home.virtualTryOn}
                </Text>
              </View>
              
              <Text className="text-3xl font-bold text-white mb-2">
                {t.brand.slogan.split(" ").slice(0, -1).join(" ")}
              </Text>
              <Text 
                className="text-3xl font-bold italic mb-4"
                style={{ color: colors.primary }}
              >
                {t.brand.slogan.split(" ").slice(-1)[0]}
              </Text>
              
              <Text className="text-base text-white/80 leading-relaxed mb-6">
                {t.home.tryOnDescription}
              </Text>

              <TouchableOpacity
                onPress={handleStartTryOn}
                className="flex-row items-center self-start px-6 py-3 rounded-full"
                style={[styles.ctaButton, { backgroundColor: colors.background }]}
              >
                <Text className="text-base font-semibold mr-2" style={{ color: colors.foreground }}>
                  {t.home.newTryOn}
                </Text>
                <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-between px-4 mt-6">
            <QuickActionCard
              icon="📸"
              title={t.home.photographer}
              subtitle={t.home.captureJewelry}
              onPress={() => router.push("/capture")}
              colors={colors}
            />
            <QuickActionCard
              icon="💎"
              title={t.home.myCollection}
              subtitle={t.home.myCollectionDesc}
              onPress={() => router.push("/ecrin")}
              colors={colors}
            />
          </View>

          <View className="flex-row justify-between px-4 mt-3">
            <QuickActionCard
              icon="🛍️"
              title={t.home.boutique}
              subtitle={t.home.boutiqueDesc}
              onPress={() => router.push("/boutique")}
              colors={colors}
            />
            <QuickActionCard
              icon="⭐"
              title={t.home.premium}
              subtitle={t.home.premiumDesc}
              onPress={() => router.push("/settings")}
              colors={colors}
            />
          </View>

          {/* Recent Try-ons Section */}
          <View className="px-4 mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">
                {t.home.recentItems}
              </Text>
              <TouchableOpacity 
                onPress={() => router.push("/gallery")}
                className="flex-row items-center"
              >
                <Text className="text-sm mr-1" style={{ color: colors.primary }}>
                  {t.common.seeAll}
                </Text>
                <IconSymbol name="chevron.right" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            <View 
              className="rounded-2xl p-8 items-center"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-4xl mb-3">💍</Text>
              <Text className="text-base text-muted text-center">
                {language === "fr" ? "Vos essayages apparaîtront ici" : 
                 language === "en" ? "Your try-ons will appear here" :
                 "Tus pruebas aparecerán aquí"}
              </Text>
              <TouchableOpacity
                onPress={handleStartTryOn}
                className="mt-4 px-6 py-2 rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-sm font-semibold" style={{ color: '#0A1A3B' }}>
                  {language === "fr" ? "Commencer" : 
                   language === "en" ? "Get Started" :
                   "Empezar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="px-4 py-8 mt-auto">
            <Text className="text-xs text-muted text-center">
              {t.brand.name.toUpperCase()} © 2025 — LUXE & TECHNOLOGIE
            </Text>
            <Text className="text-xs text-muted text-center mt-1">
              Powered by Inferencevision.store
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickActionCard({ 
  icon, 
  title, 
  subtitle,
  onPress,
  colors 
}: { 
  icon: string; 
  title: string; 
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-[48%] rounded-2xl p-4"
      style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Text className="text-2xl mb-2">{icon}</Text>
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      <Text className="text-xs text-muted">{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
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
  actionCard: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
