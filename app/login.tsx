import { Text, View, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getLoginUrl } from "@/constants/oauth";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsLoading(true);
    
    try {
      const loginUrl = getLoginUrl();
      
      if (Platform.OS === "web") {
        // Web: redirect to OAuth portal
        window.location.href = loginUrl;
      } else {
        // Native: open OAuth in browser
        const result = await WebBrowser.openAuthSessionAsync(
          loginUrl,
          undefined,
          { showInRecents: true }
        );
        
        if (result.type === "success") {
          // OAuth callback will handle the rest via deep link
          console.log("[Login] OAuth session completed successfully");
        }
      }
    } catch (error) {
      console.error("[Login] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="bg-background">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity onPress={handleSkip} className="p-2 -ml-2">
            <IconSymbol name="xmark" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Logo and Title */}
        <View className="items-center mt-8 mb-12">
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-foreground mt-6">
            L'Écrin <Text style={{ color: colors.primary }}>Virtuel</Text>
          </Text>
          <Text className="text-base text-muted text-center mt-3 px-4">
            Connectez-vous pour synchroniser vos favoris sur tous vos appareils
          </Text>
        </View>

        {/* Benefits */}
        <View className="mb-8">
          <BenefitItem
            icon="❤️"
            title="Synchronisez vos favoris"
            description="Retrouvez vos essayages préférés sur tous vos appareils"
            colors={colors}
          />
          <BenefitItem
            icon="💎"
            title="Sauvegardez votre écrin"
            description="Votre collection de bijoux toujours accessible"
            colors={colors}
          />
          <BenefitItem
            icon="👑"
            title="Gérez votre abonnement"
            description="Accédez à toutes les fonctionnalités premium"
            colors={colors}
          />
        </View>

        {/* Login Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="flex-row items-center justify-center py-4 rounded-xl"
            style={[styles.loginButton, { backgroundColor: '#000000' }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol name="apple.logo" size={20} color="#FFFFFF" />
                <Text className="text-base font-semibold ml-3" style={{ color: '#FFFFFF' }}>
                  Continuer avec Apple
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="flex-row items-center justify-center py-4 rounded-xl"
            style={[styles.loginButton, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.foreground} />
            ) : (
              <>
                <Text className="text-xl mr-2">🔵</Text>
                <Text className="text-base font-semibold text-foreground">
                  Continuer avec Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          className="items-center mt-6"
        >
          <Text className="text-base text-muted">
            Continuer sans compte
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <View className="mt-auto pb-6">
          <Text className="text-xs text-muted text-center leading-relaxed">
            En continuant, vous acceptez nos{" "}
            <Text 
              style={{ color: colors.primary }} 
              onPress={() => router.push("/terms")}
            >
              Conditions d'utilisation
            </Text>
            {" "}et notre{" "}
            <Text 
              style={{ color: colors.primary }}
              onPress={() => router.push("/privacy")}
            >
              Politique de confidentialité
            </Text>
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

function BenefitItem({ 
  icon, 
  title, 
  description,
  colors 
}: { 
  icon: string; 
  title: string; 
  description: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View className="flex-row items-start mb-4">
      <View 
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: colors.primary + '20' }}
      >
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted mt-1">{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
  },
  loginButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
