import { Text, View, TouchableOpacity, ScrollView, Switch, Linking } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function SettingsScreen() {
  const colors = useColors();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);

  const handleToggle = (setter: (value: boolean) => void, value: boolean) => {
    if (Platform.OS !== "web" && haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!value);
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScreenContainer className="bg-background">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="py-4">
          <Text className="text-2xl font-bold text-foreground">
            Paramètres
          </Text>
        </View>

        {/* Profile Section */}
        <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
          <View className="flex-row items-center">
            <View 
              className="w-16 h-16 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-2xl">👤</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">Utilisateur</Text>
              <Text className="text-sm text-muted">Mode invité</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <Text className="text-sm font-semibold text-muted uppercase mb-3">
          Préférences
        </Text>
        <View className="bg-surface rounded-2xl mb-6 border border-border overflow-hidden">
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

        {/* About Section */}
        <Text className="text-sm font-semibold text-muted uppercase mb-3">
          À propos
        </Text>
        <View className="bg-surface rounded-2xl mb-6 border border-border overflow-hidden">
          <LinkRow
            title="Politique de confidentialité"
            onPress={() => handleLinkPress("https://ecrin-landing.vercel.app")}
            colors={colors}
          />
          <View className="h-px bg-border mx-4" />
          <LinkRow
            title="Conditions d'utilisation"
            onPress={() => handleLinkPress("https://ecrin-landing.vercel.app")}
            colors={colors}
          />
          <View className="h-px bg-border mx-4" />
          <LinkRow
            title="Nous contacter"
            onPress={() => handleLinkPress("mailto:chrweber@skynet.be")}
            colors={colors}
          />
        </View>

        {/* App Info */}
        <View className="items-center py-8">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-3">
            <Text className="text-3xl">💎</Text>
          </View>
          <Text className="text-lg font-semibold text-foreground">Écrin Virtuel</Text>
          <Text className="text-sm text-muted mt-1">Version 1.0.0</Text>
          <Text className="text-xs text-muted mt-4">
            © 2026 Écrin Virtuel. Tous droits réservés.
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
  title, 
  onPress,
  colors 
}: { 
  title: string; 
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 active:opacity-70"
    >
      <Text className="text-base text-foreground">{title}</Text>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </TouchableOpacity>
  );
}
