import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

export type WatermarkPosition = 
  | "top-left" 
  | "top-right" 
  | "bottom-left" 
  | "bottom-right" 
  | "center";

export type WatermarkSize = "small" | "medium" | "large";

interface WatermarkProps {
  /** Position of the watermark on the image */
  position?: WatermarkPosition;
  /** Opacity of the watermark (0-1) */
  opacity?: number;
  /** Size of the watermark */
  size?: WatermarkSize;
  /** Whether to show the logo image */
  showLogo?: boolean;
  /** Whether to show the text */
  showText?: boolean;
  /** Custom text to display */
  customText?: string;
  /** Light or dark theme for the watermark */
  theme?: "light" | "dark";
}

const SIZE_CONFIG = {
  small: {
    logoSize: 20,
    fontSize: 10,
    padding: 8,
    gap: 4,
  },
  medium: {
    logoSize: 28,
    fontSize: 12,
    padding: 12,
    gap: 6,
  },
  large: {
    logoSize: 36,
    fontSize: 14,
    padding: 16,
    gap: 8,
  },
};

/**
 * Watermark component for branding screenshots and shared images
 * 
 * Usage:
 * ```tsx
 * <ViewShot ref={viewShotRef}>
 *   <View style={{ flex: 1 }}>
 *     {/* Your content *\/}
 *     <Watermark position="bottom-right" opacity={0.7} />
 *   </View>
 * </ViewShot>
 * ```
 */
export function Watermark({
  position = "bottom-right",
  opacity = 0.6,
  size = "medium",
  showLogo = true,
  showText = true,
  customText,
  theme = "light",
}: WatermarkProps) {
  const config = SIZE_CONFIG[size];
  const textColor = theme === "light" ? "#FFFFFF" : "#1a1a2e";
  const shadowColor = theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
  
  const positionStyle = getPositionStyle(position, config.padding);
  
  return (
    <View 
      style={[
        styles.container, 
        positionStyle,
        { opacity }
      ]}
      pointerEvents="none"
    >
      <View style={[styles.content, { gap: config.gap }]}>
        {showLogo && (
          <View style={[styles.logoContainer, { width: config.logoSize, height: config.logoSize }]}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={[styles.logo, { width: config.logoSize, height: config.logoSize }]}
              contentFit="contain"
            />
          </View>
        )}
        {showText && (
          <View style={styles.textContainer}>
            <Text 
              style={[
                styles.brandText, 
                { 
                  fontSize: config.fontSize,
                  color: textColor,
                  textShadowColor: shadowColor,
                }
              ]}
            >
              {customText || "L'Écrin Virtuel"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getPositionStyle(position: WatermarkPosition, padding: number) {
  switch (position) {
    case "top-left":
      return { top: padding, left: padding };
    case "top-right":
      return { top: padding, right: padding };
    case "bottom-left":
      return { bottom: padding, left: padding };
    case "bottom-right":
      return { bottom: padding, right: padding };
    case "center":
      return { 
        top: "50%" as const, 
        left: "50%" as const, 
        transform: [{ translateX: -50 }, { translateY: -50 }] 
      };
    default:
      return { bottom: padding, right: padding };
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    borderRadius: 4,
    overflow: "hidden",
  },
  logo: {
    borderRadius: 4,
  },
  textContainer: {
    justifyContent: "center",
  },
  brandText: {
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

/**
 * Minimal watermark for subtle branding
 */
export function WatermarkMinimal({
  position = "bottom-right",
  opacity = 0.5,
  theme = "light",
}: Pick<WatermarkProps, "position" | "opacity" | "theme">) {
  return (
    <Watermark
      position={position}
      opacity={opacity}
      size="small"
      showLogo={true}
      showText={false}
      theme={theme}
    />
  );
}

/**
 * Full watermark with logo and text
 */
export function WatermarkFull({
  position = "bottom-right",
  opacity = 0.7,
  theme = "light",
}: Pick<WatermarkProps, "position" | "opacity" | "theme">) {
  return (
    <Watermark
      position={position}
      opacity={opacity}
      size="medium"
      showLogo={true}
      showText={true}
      theme={theme}
    />
  );
}
