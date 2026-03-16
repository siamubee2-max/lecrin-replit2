/**
 * AI-Positioned Jewelry Component
 * 
 * This component displays jewelry on an image with AI-powered positioning.
 * It analyzes the image to detect facial landmarks and positions the jewelry
 * accordingly based on the detected features.
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withSpring,
} from "react-native-reanimated";

import { useAIPositioning, type JewelryType, type JewelryPosition } from "@/hooks/use-ai-positioning";
import { useColors } from "@/hooks/use-colors";

interface AIPositionedJewelryProps {
  modelImageUrl: string | { uri: string };
  jewelryImage: any; // require() image source
  jewelryType: JewelryType;
  manualSize?: number; // Manual size override (0.5-2.0)
  onAnalysisComplete?: (success: boolean, position: JewelryPosition | null) => void;
  showDebugOverlay?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function AIPositionedJewelry({
  modelImageUrl,
  jewelryImage,
  jewelryType,
  manualSize = 1,
  onAnalysisComplete,
  showDebugOverlay = false,
}: AIPositionedJewelryProps) {
  const colors = useColors();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<JewelryPosition | null>(null);
  
  const {
    isAnalyzing,
    detection,
    positions,
    error,
    analyzeImage,
    getPrimaryPosition,
    getFallbackPosition,
  } = useAIPositioning();

  // Animated values for smooth transitions
  const animatedX = useSharedValue(50);
  const animatedY = useSharedValue(40);
  const animatedScale = useSharedValue(1);
  const animatedRotation = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);

  // Helper to get the actual URL string from modelImageUrl (which can be string or {uri: string})
  const getModelUrl = useCallback((): string => {
    if (typeof modelImageUrl === 'string') return modelImageUrl;
    if (typeof modelImageUrl === 'object' && modelImageUrl !== null && 'uri' in modelImageUrl) return modelImageUrl.uri;
    return '';
  }, [modelImageUrl]);

  // Convert model image URL to base64 and analyze
  const performAnalysis = useCallback(async () => {
    if (hasAnalyzed || !modelImageUrl) return;
    const modelUrl = getModelUrl();
    if (!modelUrl) return;
    
    try {
      // Fetch the image and convert to base64
      const response = await fetch(modelUrl);
      const blob = await response.blob();
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(",")[1] || result;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const result = await analyzeImage(base64, jewelryType);
      
      if (result) {
        const position = getPrimaryPosition(result.positions, jewelryType);
        if (position && position.visible) {
          setCurrentPosition(position);
          
          // Animate to detected position
          animatedX.value = withSpring(position.x);
          animatedY.value = withSpring(position.y);
          animatedScale.value = withSpring(position.scale * manualSize);
          animatedRotation.value = withSpring(position.rotation);
          animatedOpacity.value = withTiming(1, { duration: 300 });
          
          onAnalysisComplete?.(true, position);
        } else {
          // Use fallback position
          const fallback = getFallbackPosition(jewelryType);
          setCurrentPosition(fallback);
          
          animatedX.value = withSpring(fallback.x);
          animatedY.value = withSpring(fallback.y);
          animatedScale.value = withSpring(fallback.scale * manualSize);
          animatedRotation.value = withSpring(fallback.rotation);
          animatedOpacity.value = withTiming(1, { duration: 300 });
          
          onAnalysisComplete?.(false, fallback);
        }
      } else {
        // Use fallback on error
        const fallback = getFallbackPosition(jewelryType);
        setCurrentPosition(fallback);
        
        animatedX.value = withSpring(fallback.x);
        animatedY.value = withSpring(fallback.y);
        animatedScale.value = withSpring(fallback.scale * manualSize);
        animatedRotation.value = withSpring(fallback.rotation);
        animatedOpacity.value = withTiming(1, { duration: 300 });
        
        onAnalysisComplete?.(false, fallback);
      }
      
      setHasAnalyzed(true);
    } catch (err) {
      console.error("Analysis failed:", err);
      
      // Use fallback on error
      const fallback = getFallbackPosition(jewelryType);
      setCurrentPosition(fallback);
      
      animatedX.value = withSpring(fallback.x);
      animatedY.value = withSpring(fallback.y);
      animatedScale.value = withSpring(fallback.scale * manualSize);
      animatedOpacity.value = withTiming(1, { duration: 300 });
      
      onAnalysisComplete?.(false, fallback);
      setHasAnalyzed(true);
    }
  }, [modelImageUrl, getModelUrl, jewelryType, hasAnalyzed, analyzeImage, getPrimaryPosition, getFallbackPosition, manualSize, onAnalysisComplete]);

  // Trigger analysis when component mounts or model changes
  useEffect(() => {
    if (modelImageUrl && containerSize.width > 0) {
      performAnalysis();
    }
  }, [modelImageUrl, containerSize.width, performAnalysis]);

  // Update scale when manual size changes
  useEffect(() => {
    if (currentPosition) {
      animatedScale.value = withSpring(currentPosition.scale * manualSize);
    }
  }, [manualSize, currentPosition]);

  // Reset when model or jewelry type changes
  useEffect(() => {
    setHasAnalyzed(false);
    setCurrentPosition(null);
    animatedOpacity.value = 0;
  }, [modelImageUrl, jewelryType]);

  // Get jewelry size based on type
  const getJewelrySize = () => {
    const baseSizes: Record<JewelryType, number> = {
      necklace: 180,
      earrings: 120,
      ring: 80,
      bracelet: 140,
      anklet: 120,
    };
    return baseSizes[jewelryType] || 120;
  };

  const jewelrySize = getJewelrySize();

  // Animated style for jewelry positioning
  const animatedJewelryStyle = useAnimatedStyle(() => {
    const x = (animatedX.value / 100) * containerSize.width - (jewelrySize * animatedScale.value) / 2;
    const y = (animatedY.value / 100) * containerSize.height - (jewelrySize * animatedScale.value) / 2;
    
    return {
      position: "absolute" as const,
      left: x,
      top: y,
      width: jewelrySize,
      height: jewelrySize,
      transform: [
        { scale: animatedScale.value },
        { rotate: `${animatedRotation.value}deg` },
      ],
      opacity: animatedOpacity.value,
    };
  });

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Model Image */}
      <Image
        source={typeof modelImageUrl === 'string' ? { uri: modelImageUrl } : modelImageUrl}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={300}
      />

      {/* Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              Analyse IA en cours...
            </Text>
          </View>
        </View>
      )}

      {/* AI-Positioned Jewelry */}
      <Animated.View style={animatedJewelryStyle}>
        <Image
          source={jewelryImage}
          style={{ width: jewelrySize, height: jewelrySize }}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>

      {/* Debug Overlay */}
      {showDebugOverlay && detection && (
        <View style={styles.debugOverlay}>
          <Text style={styles.debugText}>
            Detected: {detection.detected ? "Yes" : "No"}
          </Text>
          <Text style={styles.debugText}>
            Confidence: {(detection.confidence * 100).toFixed(0)}%
          </Text>
          <Text style={styles.debugText}>
            Angle: {detection.faceAngle.toFixed(1)}°
          </Text>
          <Text style={styles.debugText}>
            Scale: {detection.faceScale.toFixed(2)}
          </Text>
          {currentPosition && (
            <>
              <Text style={styles.debugText}>
                Pos: ({currentPosition.x.toFixed(1)}%, {currentPosition.y.toFixed(1)}%)
              </Text>
              <Text style={styles.debugText}>
                Rotation: {currentPosition.rotation.toFixed(1)}°
              </Text>
            </>
          )}
        </View>
      )}

      {/* Error indicator */}
      {error && !isAnalyzing && (
        <View style={styles.errorBadge}>
          <Text style={styles.errorText}>Positionnement manuel</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  debugOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 8,
  },
  debugText: {
    color: "#00FF00",
    fontSize: 10,
    fontFamily: "monospace",
  },
  errorBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,165,0,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
});

export default AIPositionedJewelry;
