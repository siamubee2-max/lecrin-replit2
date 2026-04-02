import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect, RadialGradient } from "react-native-svg";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  edges?: Edge[];
  className?: string;
  containerClassName?: string;
  safeAreaClassName?: string;
  noGradient?: boolean;
}

/**
 * A container with a premium warm ambient light gradient.
 *
 * Dark mode  → Radial warm amber halo top-right + deep espresso base
 * Light mode → Soft parchment with warm gold bloom top-left
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  noGradient = false,
  ...props
}: ScreenContainerProps) {
  const scheme = useColorScheme() ?? "light";

  return (
    <View
      className={cn("flex-1", "bg-background", containerClassName)}
      {...props}
    >
      {!noGradient && (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          pointerEvents="none"
        >
          <Svg
            width="100%"
            height="100%"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            preserveAspectRatio="none"
          >
            <Defs>
              {scheme === "dark" ? (
                <>
                  {/* Halo ambré chaud depuis le coin supérieur droit — comme une bougie */}
                  <RadialGradient
                    id="warmHalo"
                    cx="75%"
                    cy="0%"
                    rx="60%"
                    ry="45%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0%" stopColor="#4A2E0A" stopOpacity="0.55" />
                    <Stop offset="40%" stopColor="#251508" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#0C0906" stopOpacity="0" />
                  </RadialGradient>
                  {/* Second halo subtil depuis le bas-gauche */}
                  <RadialGradient
                    id="warmHalo2"
                    cx="15%"
                    cy="100%"
                    rx="50%"
                    ry="35%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0%" stopColor="#3D2208" stopOpacity="0.30" />
                    <Stop offset="100%" stopColor="#0C0906" stopOpacity="0" />
                  </RadialGradient>
                  {/* Vignette subtile sur les bords */}
                  <RadialGradient
                    id="vignette"
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="60%" stopColor="#0C0906" stopOpacity="0" />
                    <Stop offset="100%" stopColor="#050300" stopOpacity="0.4" />
                  </RadialGradient>
                </>
              ) : (
                <>
                  {/* Bloom doré depuis l'angle supérieur gauche */}
                  <RadialGradient
                    id="warmHalo"
                    cx="20%"
                    cy="0%"
                    rx="55%"
                    ry="40%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0%" stopColor="#E8C97A" stopOpacity="0.18" />
                    <Stop offset="50%" stopColor="#D4A96A" stopOpacity="0.07" />
                    <Stop offset="100%" stopColor="#FBF7F0" stopOpacity="0" />
                  </RadialGradient>
                  {/* Bloom ivoire chaud depuis le bas-droit */}
                  <RadialGradient
                    id="warmHalo2"
                    cx="85%"
                    cy="100%"
                    rx="50%"
                    ry="38%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0%" stopColor="#C8A060" stopOpacity="0.12" />
                    <Stop offset="100%" stopColor="#FBF7F0" stopOpacity="0" />
                  </RadialGradient>
                  {/* Vignette légère */}
                  <RadialGradient
                    id="vignette"
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="65%" stopColor="#FBF7F0" stopOpacity="0" />
                    <Stop offset="100%" stopColor="#E8D8BC" stopOpacity="0.15" />
                  </RadialGradient>
                </>
              )}
            </Defs>
            <Rect width="100%" height="100%" fill="url(#warmHalo)" />
            <Rect width="100%" height="100%" fill="url(#warmHalo2)" />
            <Rect width="100%" height="100%" fill="url(#vignette)" />
          </Svg>
        </View>
      )}

      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
