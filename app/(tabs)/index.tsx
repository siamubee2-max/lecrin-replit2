import { ScrollView, Text, View, TouchableOpacity, Image, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform, Linking } from "react-native";
import { useState } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const LANGUAGES = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const [currentLang, setCurrentLang] = useState("fr");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleStartTryOn = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/tryon");
  };

  const handleLanguageSelect = (code: string) => {
    setCurrentLang(code);
    setShowLangPicker(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang);

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
                L'Écrin <Text style={{ color: colors.primary }}>Virtuel</Text>
              </Text>
            </View>
            
            {/* Language Selector */}
            <TouchableOpacity
              onPress={() => setShowLangPicker(!showLangPicker)}
              className="flex-row items-center px-3 py-2 rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-lg mr-1">{currentLanguage?.flag}</Text>
              <IconSymbol name="chevron.down" size={16} color={colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Language Picker Dropdown */}
          {showLangPicker && (
            <View 
              className="absolute top-16 right-4 rounded-xl z-50 shadow-lg"
              style={[styles.langDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => handleLanguageSelect(lang.code)}
                  className="flex-row items-center px-4 py-3"
                  style={[
                    lang.code === currentLang && { backgroundColor: colors.primary + '20' }
                  ]}
                >
                  <Text className="text-lg mr-3">{lang.flag}</Text>
                  <Text 
                    className="text-base"
                    style={{ color: lang.code === currentLang ? colors.primary : colors.foreground }}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

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
                  ✨ Essayage Virtuel
                </Text>
              </View>
              
              <Text className="text-3xl font-bold text-white mb-2">
                Essayez l'inaccessible
              </Text>
              <Text 
                className="text-3xl font-bold italic mb-4"
                style={{ color: colors.primary }}
              >
                Virtuellement.
              </Text>
              
              <Text className="text-base text-white/80 leading-relaxed mb-6">
                Importez un bijou, choisissez votre photo, et laissez la magie opérer. Visualisez le résultat avant d'acheter ou juste pour rêver.
              </Text>

              <TouchableOpacity
                onPress={handleStartTryOn}
                className="flex-row items-center self-start px-6 py-3 rounded-full"
                style={[styles.ctaButton, { backgroundColor: colors.background }]}
              >
                <Text className="text-base font-semibold mr-2" style={{ color: colors.foreground }}>
                  Nouvel Essayage
                </Text>
                <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-between px-4 mt-6">
            <QuickActionCard
              icon="📸"
              title="Photographier"
              subtitle="Capturer un bijou"
              onPress={() => router.push("/capture")}
              colors={colors}
            />
            <QuickActionCard
              icon="💎"
              title="Mon Écrin"
              subtitle="Ma collection"
              onPress={() => router.push("/ecrin")}
              colors={colors}
            />
          </View>

          <View className="flex-row justify-between px-4 mt-3">
            <QuickActionCard
              icon="🛍️"
              title="Boutique"
              subtitle="Créateurs"
              onPress={() => router.push("/boutique")}
              colors={colors}
            />
            <QuickActionCard
              icon="⭐"
              title="Premium"
              subtitle="Abonnement"
              onPress={() => router.push("/settings")}
              colors={colors}
            />
          </View>

          {/* Recent Try-ons Section */}
          <View className="px-4 mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">
                Plus récents
              </Text>
              <TouchableOpacity 
                onPress={() => router.push("/gallery")}
                className="flex-row items-center"
              >
                <Text className="text-sm mr-1" style={{ color: colors.primary }}>
                  Voir tout
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
                Vos essayages apparaîtront ici
              </Text>
              <TouchableOpacity
                onPress={handleStartTryOn}
                className="mt-4 px-6 py-2 rounded-full"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-sm font-semibold" style={{ color: '#0A1A3B' }}>
                  Commencer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View className="px-4 py-8 mt-auto">
            <Text className="text-xs text-muted text-center">
              L'ÉCRIN VIRTUEL © 2025 — LUXE & TECHNOLOGIE
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
  langDropdown: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
