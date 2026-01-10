// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for Ecrin Virtuel app.
 */
const MAPPING = {
  // Navigation icons
  "house.fill": "home",
  "camera.fill": "camera-alt",
  "photo.stack.fill": "photo-library",
  "gearshape.fill": "settings",
  // Action icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  // Feature icons
  "sparkles": "auto-awesome",
  "photo.fill": "image",
  "square.and.arrow.up": "share",
  "trash.fill": "delete",
  "heart.fill": "favorite",
  "xmark": "close",
  "checkmark": "check",
  "plus": "add",
  "minus": "remove",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
