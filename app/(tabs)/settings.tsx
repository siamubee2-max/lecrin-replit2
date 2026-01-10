import { Text, View, TouchableOpacity, ScrollView, Switch, Linking, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const SUBSCRIPTION_PLANS = [
  {
    id: "monthly_basic",
    name: "Essentiel",
    price: "9,99€",
    period: "/mois",
    features: ["10 essayages/mois", "Modèles de base", "Sauvegarde illimitée"],
    popular: false,
  },
  {
    id: "monthly_premium",
    name: "Premium",
    price: "12,99€",
    period: "/mois",
    features: ["Essayages illimités", "Tous les modèles", "Garde-robe virtuelle", "Support prioritaire"],
    popular: true,
  },
  {
    id: "yearly",
    name: "Annuel",
    price: "100€",
    period: "/an",
    features: ["Tout inclus", "Économisez 56€", "Accès anticipé nouveautés", "Badge VIP"],
    popular: false,
  },
];

const LANGUAGES = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [currentLang, setCurrentLang] = useState("fr");
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const handleToggle = (setter: (value: boolean) => void, value: boolean) => {
    if (Platform.OS !== "web" && haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!value);
  };

  const handleSubscribe = (planId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // TODO: Implement StoreKit purchase
    Alert.alert(
      "Abonnement",
      "L'achat in-app sera disponible après publication sur l'App Store.",
      [{ text: "OK" }]
    );
  };

  const handleRestorePurchases = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      "Restauration",
      "Vos achats seront restaurés après publication sur l'App Store.",
      [{ text: "OK" }]
    );
  };

  const handleContact = () => {
    Linking.openURL("mailto:inferencevision@inferencevision.store?subject=Support%20Écrin%20Virtuel");
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang);

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-3xl font-bold text-foreground">Paramètres</Text>
        </View>

        {/* Subscription Section */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            onPress={() => setShowSubscription(!showSubscription)}
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: colors.primary + '15', borderColor: colors.primary, borderWidth: 1 }}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">👑</Text>
              <View>
                <Text className="text-lg font-bold text-foreground">Abonnement Premium</Text>
                <Text className="text-sm text-muted">Débloquez toutes les fonctionnalités</Text>
              </View>
            </View>
            <IconSymbol 
              name={showSubscription ? "chevron.up" : "chevron.down"} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>

          {showSubscription && (
            <View className="mt-4">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => handleSubscribe(plan.id)}
                  className="p-4 rounded-2xl mb-3"
                  style={[
                    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                    plan.popular && { borderColor: colors.primary, borderWidth: 2 }
                  ]}
                >
                  {plan.popular && (
                    <View 
                      className="absolute -top-3 right-4 px-3 py-1 rounded-full"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Text className="text-xs font-bold" style={{ color: '#0A1A3B' }}>
                        POPULAIRE
                      </Text>
                    </View>
                  )}
                  
                  <View className="flex-row items-baseline mb-2">
                    <Text className="text-2xl font-bold text-foreground">{plan.price}</Text>
                    <Text className="text-sm text-muted ml-1">{plan.period}</Text>
                  </View>
                  
                  <Text className="text-lg font-semibold text-foreground mb-2">{plan.name}</Text>
                  
                  {plan.features.map((feature, index) => (
                    <View key={index} className="flex-row items-center mb-1">
                      <IconSymbol name="checkmark" size={16} color={colors.primary} />
                      <Text className="text-sm text-muted ml-2">{feature}</Text>
                    </View>
                  ))}
                </TouchableOpacity>
              ))}

              {/* Restore Purchases - Required by Apple */}
              <TouchableOpacity
                onPress={handleRestorePurchases}
                className="flex-row items-center justify-center py-3"
              >
                <IconSymbol name="arrow.clockwise" size={16} color={colors.primary} />
                <Text className="text-sm ml-2" style={{ color: colors.primary }}>
                  Restaurer mes achats
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Language Section */}
        <View className="px-4 mb-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3 tracking-wide">
            Langue
          </Text>
          <TouchableOpacity
            onPress={() => setShowLanguages(!showLanguages)}
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <View className="flex-row items-center">
              <Text className="text-lg mr-3">{currentLanguage?.flag}</Text>
              <Text className="text-base text-foreground">{currentLanguage?.name}</Text>
            </View>
            <IconSymbol 
              name={showLanguages ? "chevron.up" : "chevron.down"} 
              size={18} 
              color={colors.muted} 
            />
          </TouchableOpacity>

          {showLanguages && (
            <View 
              className="mt-2 rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
            >
              {LANGUAGES.map((lang, index) => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => {
                    setCurrentLang(lang.code);
                    setShowLanguages(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3"
                  style={index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-3">{lang.flag}</Text>
                    <Text className="text-base text-foreground">{lang.name}</Text>
                  </View>
                  {currentLang === lang.code && (
                    <IconSymbol name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Preferences Section */}
        <View className="px-4 mb-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3 tracking-wide">
            Préférences
          </Text>
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            <SettingRow
              title="Notifications"
              subtitle="Recevoir des alertes"
              value={notifications}
              onToggle={() => handleToggle(setNotifications, notifications)}
              colors={colors}
            />
            <View className="h-px bg-border mx-4" />
            <SettingRow
              title="Retour haptique"
              subtitle="Vibrations tactiles"
              value={haptics}
              onToggle={() => handleToggle(setHaptics, haptics)}
              colors={colors}
            />
          </View>
        </View>

        {/* Legal Section - Required by Apple */}
        <View className="px-4 mb-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3 tracking-wide">
            Légal
          </Text>
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            <LinkRow
              icon="shield.fill"
              title="Politique de Confidentialité"
              onPress={() => router.push("/privacy")}
              colors={colors}
            />
            <View className="h-px bg-border mx-4" />
            <LinkRow
              icon="doc.text.fill"
              title="Conditions d'Utilisation"
              onPress={() => router.push("/terms")}
              colors={colors}
            />
          </View>
        </View>

        {/* Support Section */}
        <View className="px-4 mb-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3 tracking-wide">
            Support
          </Text>
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            <LinkRow
              icon="envelope.fill"
              title="Nous Contacter"
              onPress={handleContact}
              colors={colors}
            />
            <View className="h-px bg-border mx-4" />
            <LinkRow
              icon="questionmark.circle.fill"
              title="Aide & FAQ"
              onPress={() => {}}
              colors={colors}
            />
            <View className="h-px bg-border mx-4" />
            <LinkRow
              icon="star.fill"
              title="Noter l'Application"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* App Info */}
        <View className="items-center py-8 px-4">
          <View 
            className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-3xl">💎</Text>
          </View>
          <Text className="text-lg font-semibold text-foreground">L'Écrin Virtuel</Text>
          <Text className="text-sm text-muted mt-1">Version 1.0.0</Text>
          <Text className="text-xs text-muted mt-4 text-center">
            © 2025 Inferencevision.store{"\n"}Tous droits réservés
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingRow({ 
  title, 
  subtitle, 
  value, 
  onToggle,
  colors 
}: { 
  title: string; 
  subtitle: string; 
  value: boolean; 
  onToggle: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <View className="flex-1 mr-4">
        <Text className="text-base text-foreground">{title}</Text>
        <Text className="text-sm text-muted">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.background}
      />
    </View>
  );
}

function LinkRow({ 
  icon,
  title, 
  onPress,
  colors 
}: { 
  icon?: string;
  title: string; 
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 active:opacity-70"
    >
      <View className="flex-row items-center">
        {icon && <IconSymbol name={icon as any} size={20} color={colors.muted} />}
        <Text className="text-base text-foreground ml-3">{title}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}
