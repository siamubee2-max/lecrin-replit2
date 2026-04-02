/**
 * Icon component — uses native SF Symbols on iOS (expo-symbols),
 * falls back to Material Icons on Android / web.
 *
 * SF Symbols are Apple's premium icon library: crisp vector,
 * weight-aware, rendered natively — much more refined than Material Icons.
 */

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, Platform, StyleProp, TextStyle } from "react-native";

// ─── SF Symbol name → Material Icons fallback mapping ─────────────────────────
const MAPPING: Record<string, ComponentProps<typeof MaterialIcons>["name"]> = {
  // Navigation
  "house.fill":                        "home",
  "camera.fill":                       "camera-alt",
  "photo.stack.fill":                  "photo-library",
  "gearshape.fill":                    "settings",
  "bag.fill":                          "shopping-bag",
  "person.fill":                       "person",
  "crown.fill":                        "workspace-premium",
  "diamond.fill":                      "diamond",
  // Actions
  "paperplane.fill":                   "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right":                     "chevron-right",
  "chevron.left":                      "chevron-left",
  "chevron.down":                      "expand-more",
  "chevron.up":                        "expand-less",
  // Features
  "sparkles":                          "auto-awesome",
  "sparkle":                           "auto-awesome",
  "photo.fill":                        "image",
  "square.and.arrow.up":              "share",
  "trash.fill":                        "delete",
  "trash":                             "delete-outline",
  "heart.fill":                        "favorite",
  "heart":                             "favorite-border",
  "xmark":                             "close",
  "xmark.circle.fill":                 "cancel",
  "checkmark":                         "check",
  "checkmark.circle.fill":             "check-circle",
  "plus":                              "add",
  "minus":                             "remove",
  "magnifyingglass":                   "search",
  "slider.horizontal.3":               "tune",
  "arrow.down.circle.fill":            "download",
  "globe":                             "language",
  "envelope.fill":                     "email",
  "link":                              "link",
  "star.fill":                         "star",
  "lock.fill":                         "lock",
  "creditcard.fill":                   "credit-card",
  "doc.text.fill":                     "description",
  "shield.fill":                       "security",
  "info.circle.fill":                  "info",
  "questionmark.circle.fill":          "help",
  "person.2.fill":                     "people",
  "storefront.fill":                   "storefront",
  "tag.fill":                          "local-offer",
  "paintbrush.fill":                   "brush",
  "wand.and.stars":                    "auto-fix-high",
  "wand.and.sparkles":                 "auto-fix-high",
  "photo.on.rectangle":                "add-photo-alternate",
  "rectangle.stack.fill":              "layers",
  "menubar.rectangle":                 "menu",
  "apple.logo":                        "apple",
  "icloud.fill":                       "cloud",
  "arrow.triangle.2.circlepath":       "sync",
  "doc.on.doc":                        "content-copy",
  "arrow.counterclockwise":            "replay",
  "arrow.clockwise":                   "rotate-right",
  "arrow.up.arrow.down":               "swap-vert",
  "arrow.up.right":                    "open-in-new",
  "eye.fill":                          "visibility",
  "list.bullet":                       "list",
  // Wardrobe
  "tshirt.fill":                       "checkroom",
  "hanger":                            "dry-cleaning",
  // Boutique
  "cart.fill":                         "shopping-cart",
  "gift.fill":                         "card-giftcard",
  "crown":                             "workspace-premium",
  "building.2.fill":                   "business",
  "map.fill":                          "map",
  "phone.fill":                        "phone",
};

type IconSymbolName = keyof typeof MAPPING;

/**
 * Cross-platform icon component.
 * - iOS → native SF Symbols via SymbolView (crisp, weight-aware, premium)
 * - Android/Web → Material Icons fallback
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={name as SymbolViewProps["name"]}
        size={size}
        tintColor={color as string}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={[{ width: size, height: size }, style as any]}
      />
    );
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] ?? "help-outline"}
      style={style}
    />
  );
}
