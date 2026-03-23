import { useState } from "react";
import { View, type ViewStyle } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

interface ImageWithFallbackProps {
  source: ImageSource | { uri: string } | null | undefined;
  style: ViewStyle;
  contentFit?: "cover" | "contain" | "fill";
  fallbackIcon?: string;
  fallbackIconSize?: number;
  fallbackContent?: React.ReactNode;
}

export function ImageWithFallback({
  source,
  style,
  contentFit = "cover",
  fallbackIcon = "diamond.fill",
  fallbackIconSize = 32,
  fallbackContent,
}: ImageWithFallbackProps) {
  const colors = useColors();
  const [hasError, setHasError] = useState(false);

  if (!source || hasError) {
    return (
      <View style={[style, { alignItems: "center", justifyContent: "center", backgroundColor: colors.border }]}>
        {fallbackContent ?? <IconSymbol name={fallbackIcon as any} size={fallbackIconSize} color={colors.muted} />}
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      onError={() => setHasError(true)}
    />
  );
}
