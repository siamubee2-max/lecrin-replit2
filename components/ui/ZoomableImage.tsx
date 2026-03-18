/**
 * ZoomableImage
 * An interactive image component supporting:
 * - Pinch-to-zoom (up to 4×)
 * - Double-tap to zoom in/out
 * - Pan while zoomed
 * - Smooth reset on double-tap at max zoom
 *
 * Uses react-native-gesture-handler + react-native-reanimated (already in project).
 * Falls back to a plain Image on web (no gesture support needed).
 */

import { useRef, useState } from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import { useColors } from "@/hooks/use-colors";

interface ZoomableImageProps {
  uri: string;
  width: number;
  height: number;
  /** Show the "pinch to zoom" hint on first render */
  showHint?: boolean;
  /** Called with true when zoomed in (scale > 1), false when back to 1 */
  onZoomChange?: (isZoomed: boolean) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

export function ZoomableImage({ uri, width, height, showHint = true, onZoomChange }: ZoomableImageProps) {
  const colors = useColors();
  const [hintVisible, setHintVisible] = useState(showHint);

  const notifyZoom = (currentScale: number) => {
    if (onZoomChange) onZoomChange(currentScale > 1.05);
  };

  // Shared values for transform
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Clamp translation so image doesn't go out of bounds
  const clampTranslation = (tx: number, ty: number, currentScale: number) => {
    "worklet";
    const maxX = (width * (currentScale - 1)) / 2;
    const maxY = (height * (currentScale - 1)) / 2;
    return {
      x: Math.min(Math.max(tx, -maxX), maxX),
      y: Math.min(Math.max(ty, -maxY), maxY),
    };
  };

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      if (hintVisible) runOnJS(setHintVisible)(false);
    })
    .onUpdate((e) => {
      const newScale = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
      scale.value = newScale;
      // Clamp translation as scale changes
      const clamped = clampTranslation(savedTranslateX.value, savedTranslateY.value, newScale);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      if (scale.value < 1.05) {
        // Snap back to 1
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        runOnJS(notifyZoom)(1);
      } else {
        runOnJS(notifyZoom)(scale.value);
      }
    });

  // Pan gesture (only active when zoomed in)
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      if (scale.value <= 1.05) return;
      const clamped = clampTranslation(
        savedTranslateX.value + e.translationX,
        savedTranslateY.value + e.translationY,
        scale.value,
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    });

  // Double-tap gesture
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onEnd((e) => {
      if (hintVisible) runOnJS(setHintVisible)(false);
      if (scale.value > 1.5) {
        // Reset to 1
        scale.value = withTiming(1, { duration: 250 });
        translateX.value = withTiming(0, { duration: 250 });
        translateY.value = withTiming(0, { duration: 250 });
        runOnJS(notifyZoom)(1);
      } else {
        // Zoom in centred on tap point
        const newScale = DOUBLE_TAP_SCALE;
        scale.value = withTiming(newScale, { duration: 250 });
        // Offset so the tapped point stays centred
        const focalX = e.x - width / 2;
        const focalY = e.y - height / 2;
        const targetTx = -focalX * (newScale - 1);
        const targetTy = -focalY * (newScale - 1);
        const clamped = clampTranslation(targetTx, targetTy, newScale);
        translateX.value = withTiming(clamped.x, { duration: 250 });
        translateY.value = withTiming(clamped.y, { duration: 250 });
      }
    });

  const composed = Gesture.Simultaneous(
    Gesture.Race(doubleTapGesture, panGesture),
    pinchGesture,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Web fallback — no gesture support needed
  if (Platform.OS === "web") {
    return (
      <Image
        source={{ uri }}
        style={{ width, height }}
        contentFit="contain"
      />
    );
  }

  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ width, height }, animatedStyle]}>
          <Image
            source={{ uri }}
            style={{ width, height }}
            contentFit="contain"
          />
        </Animated.View>
      </GestureDetector>

      {/* Hint overlay */}
      {hintVisible && (
        <View style={[styles.hintContainer, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
          <Text style={styles.hintText}>Pincez pour zoomer · Double-tap</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hintContainer: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  hintText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.9,
  },
});
