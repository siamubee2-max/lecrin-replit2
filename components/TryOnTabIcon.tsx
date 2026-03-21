/**
 * TryOnTabIcon
 * Icône de l'onglet "Essayer" avec un badge indiquant le nombre d'essayages restants.
 * Le badge s'affiche uniquement quand il reste 5 essayages ou moins (rouge si 0).
 */
import { View, Text, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSubscription } from "@/hooks/use-subscription";

interface TryOnTabIconProps {
  color: string;
  focused: boolean;
}

export function TryOnTabIcon({ color, focused }: TryOnTabIconProps) {
  const colors = useColors();
  const { monthlyTryOnsUsed, monthlyTryOnsLimit } = useSubscription();
  const remaining = Math.max(0, monthlyTryOnsLimit - monthlyTryOnsUsed);
  const showBadge = remaining <= 5;

  return (
    <View style={[
      focused
        ? [styles.activeIconBg, { backgroundColor: colors.primary + "20" }]
        : styles.iconWrapper,
    ]}>
      <IconSymbol size={24} name="wand.and.stars" color={color} />
      {showBadge && (
        <View style={[
          styles.badge,
          { backgroundColor: remaining === 0 ? "#EF4444" : colors.primary },
        ]}>
          <Text style={styles.badgeText}>{remaining}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: "relative",
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconBg: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#0A1A3B",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
  },
});
