import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    tag: "ESSAYAGE VIRTUEL",
    title: "Essayez avant\nd'acheter",
    subtitle:
      "Sélectionnez un bijou, choisissez votre photo ou un mannequin, et visualisez le résultat en quelques secondes grâce à l'intelligence artificielle.",
    icon: "✦",
    accent: "#C9A96E",
  },
  {
    id: "2",
    tag: "MON ÉCRIN",
    title: "Votre collection\npersonnelle",
    subtitle:
      "Photographiez vos bijoux, organisez-les par type, métal ou créateur. Votre écrin numérique vous suit partout, synchronisé et sécurisé.",
    icon: "◈",
    accent: "#C9A96E",
  },
  {
    id: "3",
    tag: "BOUTIQUE & COMMUNAUTÉ",
    title: "Découvrez des\ncréateurs d'exception",
    subtitle:
      "Explorez les collections de créateurs indépendants, partagez vos coups de cœur avec la communauté et inspirez-vous des looks de nos membres.",
    icon: "❋",
    accent: "#C9A96E",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await handleFinish();
    }
  };

  const handleFinish = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem("onboarding_completed", "true");
    router.replace("/(tabs)");
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: "#0A0A0A" }]}>
      {/* Skip button */}
      {!isLast && (
        <Pressable
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={[styles.skipText, { color: "#C9A96E" }]}>Passer</Text>
        </Pressable>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            {/* Large decorative icon */}
            <View style={styles.iconContainer}>
              <Text style={[styles.decorativeIcon, { color: item.accent }]}>
                {item.icon}
              </Text>
              {/* Decorative ring */}
              <View style={[styles.iconRing, { borderColor: item.accent + "30" }]} />
              <View style={[styles.iconRingOuter, { borderColor: item.accent + "15" }]} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.tag, { color: item.accent }]}>{item.tag}</Text>
              <Text style={[styles.title, { color: "#F5F0E8" }]}>{item.title}</Text>
              <View style={[styles.divider, { backgroundColor: item.accent }]} />
              <Text style={[styles.subtitle, { color: "#9A9A9A" }]}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom controls */}
      <View style={styles.bottomContainer}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [6, 24, 6],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor: "#C9A96E" },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaButton,
            { backgroundColor: "#C9A96E", opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleNext}
        >
          <Text style={styles.ctaText}>
            {isLast ? "COMMENCER" : "SUIVANT"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 13,
    letterSpacing: 1.5,
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 160,
  },
  iconContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    position: "relative",
  },
  decorativeIcon: {
    fontSize: 64,
    lineHeight: 72,
  },
  iconRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
  },
  iconRingOuter: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
  },
  content: {
    alignItems: "center",
    gap: 0,
  },
  tag: {
    fontSize: 9,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 20,
  },
  divider: {
    width: 32,
    height: 1,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "700",
    color: "#0A0A0A",
  },
});
