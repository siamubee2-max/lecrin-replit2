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
  "bag.fill": "shopping-bag",
  "person.fill": "person",
  "crown.fill": "workspace-premium",
  "diamond.fill": "diamond",
  // Action icons
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // Feature icons
  "sparkles": "auto-awesome",
  "photo.fill": "image",
  "square.and.arrow.up": "share",
  "trash.fill": "delete",
  "trash": "delete-outline",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "xmark": "close",
  "checkmark": "check",
  "plus": "add",
  "minus": "remove",
  "magnifyingglass": "search",
  "slider.horizontal.3": "tune",
  "arrow.down.circle.fill": "download",
  "globe": "language",
  "envelope.fill": "email",
  "link": "link",
  "star.fill": "star",
  "lock.fill": "lock",
  "creditcard.fill": "credit-card",
  "doc.text.fill": "description",
  "shield.fill": "security",
  "info.circle.fill": "info",
  "questionmark.circle.fill": "help",
  "person.2.fill": "people",
  "storefront.fill": "storefront",
  "tag.fill": "local-offer",
  "paintbrush.fill": "brush",
  "wand.and.stars": "auto-fix-high",
  "photo.on.rectangle": "add-photo-alternate",
  "rectangle.stack.fill": "layers",
  "menubar.rectangle": "menu",
  "apple.logo": "apple",
  "icloud.fill": "cloud",
  "arrow.triangle.2.circlepath": "sync",
  "doc.on.doc": "content-copy",
  "arrow.counterclockwise": "replay",
  "arrow.clockwise": "rotate-right",
  // Wardrobe icons
  "tshirt.fill": "checkroom",
  "hanger": "dry-cleaning",
  "sparkle": "auto-awesome",
  "wand.and.sparkles": "auto-fix-high",
  "arrow.up.arrow.down": "swap-vert",
  "eye.fill": "visibility",
  // Boutique icons
  "cart.fill": "shopping-cart",
  "gift.fill": "card-giftcard",
  "arrow.up.right": "open-in-new",
  "crown": "workspace-premium",
  "building.2.fill": "business",
  "map.fill": "map",
  "phone.fill": "phone",
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
