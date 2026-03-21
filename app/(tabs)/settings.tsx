import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Linking, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/hooks/use-subscription";
import { PaywallModal } from "@/components/paywall/PaywallModal";

const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Découverte",
    price: "Gratuit",
    period: "",
    features: ["3 essayages/mois", "Modèles de base", "Aperçu des fonctionnalités"],
    popular: false,
    isFree: true,
  },
  {
    id: "monthly_basic",
    name: "Essentiel",
    price: "14,99€",
    period: "/mois",
    features: ["100 essayages bijoux/mois", "Alertes nouvelles collections", "Snapshot cadres basiques", "Badge Communauté Bijoux"],
    popular: false,
  },
  {
    id: "monthly_premium",
    name: "Premium",
    price: "24,99€",
    period: "/mois",
    features: ["150 essayages/mois", "Essayage vêtements & chaussures", "Mode Tenue Complète — 15 slots", "Effets Snapshot premium"],
    popular: true,
  },
  {
    id: "yearly",
    name: "Annuel Premium",
    price: "199,99€",
    period: "/an",
    features: ["1 500 essayages/an", "Tout Premium inclus", "Économisez +100€ (33%)", "Badge VIP exclusif"],
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
  const subscription = useSubscription();
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [currentLang, setCurrentLang] = useState("fr");
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const PLAN_LABELS: Record<string, { name: string; emoji: string; color: string }> = {
    free:    { name: "Découverte",     emoji: "✨",  color: colors.muted },
    jewelry: { name: "Jewelry",        emoji: "💎",  color: colors.primary },
    premium: { name: "Premium",        emoji: "✦",   color: colors.primary },
  };
  const planInfo = PLAN_LABELS[subscription.tier] ?? PLAN_LABELS.free;
  const tryOnsLeft = Math.max(0, subscription.monthlyTryOnsLimit - subscription.monthlyTryOnsUsed);

  const handleToggle = (setter: (value: boolean) => void, value: boolean) => {
    if (Platform.OS !== "web" && haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!value);
  };

  const handleSubscribe = (_planId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowPaywall(true);
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await subscription.restorePurchases();
    Alert.alert("Restauration", "Vos achats ont été restaurés.", [{ text: "OK" }]);
  };

  const handleContact = () => {
    Linking.openURL("mailto:inferencevision@inferencevision.store?subject=Support%20Écrin%20Virtuel");
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header luxe */}
        <View style={settingsStyles.header}>
          <Text style={[settingsStyles.title, { color: colors.foreground }]}>PARAMÈTRES</Text>
          <Text style={[settingsStyles.subtitle, { color: colors.primary }]}>ÉCRIN VIRTUEL</Text>
        </View>
        <View style={[settingsStyles.headerLine, { backgroundColor: colors.border }]} />

        {/* Subscription Section */}
        <View style={settingsStyles.section}>
          <Text style={[settingsStyles.sectionLabel, { color: colors.muted }]}>MON ABONNEMENT</Text>

          {/* Carte plan actif */}
          <View style={[settingsStyles.row, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1.5 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ fontSize: 18 }}>{planInfo.emoji}</Text>
                <Text style={[settingsStyles.rowTitle, { color: colors.foreground }]}>PLAN {planInfo.name.toUpperCase()}</Text>
                <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700', letterSpacing: 0.5 }}>ACTIF</Text>
                </View>
              </View>
              {/* Barre de progression des essayages */}
              <View style={{ marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: colors.muted }}>
                    {subscription.monthlyTryOnsUsed} essayage{subscription.monthlyTryOnsUsed > 1 ? 's' : ''} utilisé{subscription.monthlyTryOnsUsed > 1 ? 's' : ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.primary }}>
                    {tryOnsLeft} restant{tryOnsLeft > 1 ? 's' : ''} / {subscription.monthlyTryOnsLimit}
                  </Text>
                </View>
                <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
                  <View style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: tryOnsLeft === 0 ? colors.error : colors.primary,
                    width: `${Math.min(100, (subscription.monthlyTryOnsUsed / subscription.monthlyTryOnsLimit) * 100)}%` as any,
                  }} />
                </View>
              </View>
            </View>
          </View>

          {/* Bouton upgrade si pas premium */}
          {subscription.tier !== 'premium' && (
            <TouchableOpacity
              onPress={() => setShowPaywall(true)}
              style={[settingsStyles.row, { backgroundColor: colors.primary, marginTop: 8 }]}
            >
              <Text style={{ color: '#0A1A3B', fontWeight: '700', letterSpacing: 1, fontSize: 13 }}>
                {subscription.tier === 'free' ? '✦ PASSER À JEWELRY OU PREMIUM' : '✦ PASSER À PREMIUM'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Détail plans (collapsible) */}
          <TouchableOpacity
            onPress={() => setShowSubscription(!showSubscription)}
            style={[settingsStyles.row, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[settingsStyles.rowTitle, { color: colors.foreground }]}>VOIR TOUS LES PLANS</Text>
              <Text style={[settingsStyles.rowSubtitle, { color: colors.muted }]}>Comparer Jewelry, Premium mensuel et annuel</Text>
            </View>
            <IconSymbol 
              name={showSubscription ? "chevron.up" : "chevron.down"} 
              size={16} 
              color={colors.primary} 
            />
          </TouchableOpacity>

          {showSubscription && (
            <View className="mt-4">
              {SUBSCRIPTION_PLANS.map((plan: any) => (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => plan.isFree ? null : handleSubscribe(plan.id)}
                  activeOpacity={plan.isFree ? 1 : 0.7}
                  className="p-4 rounded-2xl mb-3"
                  style={[
                    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
                    plan.popular && { borderColor: colors.primary, borderWidth: 2 },
                    plan.isFree && { borderStyle: 'dashed' as const }
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
                  {plan.isFree && (
                    <View 
                      className="absolute -top-3 right-4 px-3 py-1 rounded-full"
                      style={{ backgroundColor: colors.success }}
                    >
                      <Text className="text-xs font-bold" style={{ color: '#FFFFFF' }}>
                        ACTUEL
                      </Text>
                    </View>
                  )}
                  
                  <View className="flex-row items-baseline mb-2">
                    <Text className="text-2xl font-bold text-foreground">{plan.price}</Text>
                    <Text className="text-sm text-muted ml-1">{plan.period}</Text>
                  </View>
                  
                  <Text className="text-lg font-semibold text-foreground mb-2">{plan.name}</Text>
                  
                  {plan.features.map((feature: string, index: number) => (
                    <View key={index} className="flex-row items-center mb-1">
                      <IconSymbol name="checkmark" size={16} color={plan.isFree ? colors.success : colors.primary} />
                      <Text className="text-sm text-muted ml-2">{feature}</Text>
                    </View>
                  ))}
                  
                  {!plan.isFree && (
                    <View 
                      className="mt-3 py-2 rounded-xl items-center"
                      style={{ backgroundColor: plan.popular ? colors.primary : colors.primary + '20' }}
                    >
                      <Text
                        className="font-semibold"
                        style={{ color: plan.popular ? '#0A1A3B' : colors.primary }}
                      >
                        S{"'"}abonner
                      </Text>
                    </View>
                  )}
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

        {/* My Wardrobe Section */}
        <View className="px-4 mb-4">
          <Text className="text-sm font-semibold text-muted uppercase mb-3 tracking-wide">
            Ma Garde-Robe
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/wardrobe")}
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
          >
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">👗</Text>
              <View>
                <Text className="text-lg font-semibold text-foreground">Mes Photos</Text>
                <Text className="text-sm text-muted">Gérez vos photos pour les essayages</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
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
              onPress={() => Linking.openURL("https://inferencevision.store/faq")}
              colors={colors}
            />
            <View className="h-px bg-border mx-4" />
            <LinkRow
              icon="star.fill"
              title="Noter l'Application"
              onPress={() => {
                // Ouvre le Store pour noter l'app
                const storeUrl = Platform.OS === "ios"
                  ? "https://apps.apple.com/app/id0"
                  : "https://play.google.com/store/apps";
                Linking.openURL(storeUrl).catch(() =>
                  Alert.alert("Bientôt disponible", "La notation sera disponible après publication sur les stores.")
                );
              }}
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
          <Text className="text-lg font-semibold text-foreground">L{"'"}Écrin Virtuel</Text>
          <Text className="text-sm text-muted mt-1">Version 1.0.0</Text>
          <Text className="text-xs text-muted mt-4 text-center">
            © 2025 Inferencevision.store{"\n"}Tous droits réservés
          </Text>
          {/* Bouton admin discret */}
          <TouchableOpacity
            onPress={() => router.push("/admin-candidatures" as any)}
            className="mt-6 active:opacity-30"
          >
            <Text style={{ fontSize: 10, color: colors.border, letterSpacing: 2 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* PaywallModal */}
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchasePremium={subscription.purchasePremiumMonthly}
        onPurchasePremiumPlus={subscription.purchasePremiumYearly}
        onPurchaseJewelry={subscription.purchaseJewelry}
        onPurchaseCredits={subscription.purchaseCredits}
        onRestore={subscription.restorePurchases}
        featureName="Mon abonnement"
        showCredits
      />
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

const settingsStyles = StyleSheet.create({
  header: {
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
  headerLine: {
    height: 0.5,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 2,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 1,
  },
  rowSubtitle: {
    fontSize: 10,
    fontWeight: "300",
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
