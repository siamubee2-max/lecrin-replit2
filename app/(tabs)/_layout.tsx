import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { TryOnTabIcon } from "@/components/TryOnTabIcon";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 64 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginTop: 3,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={22}
              name={focused ? "house.fill" : "house.fill"}
              color={color}
              weight={focused ? "semibold" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tryon"
        options={{
          title: "Essayer",
          tabBarIcon: ({ color, focused }) => (
            <TryOnTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ecrin"
        options={{
          title: "Mon Écrin",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={22}
              name="diamond.fill"
              color={color}
              weight={focused ? "semibold" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dressing"
        options={{
          title: "Dressing",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={22}
              name="tshirt.fill"
              color={color}
              weight={focused ? "semibold" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Comm.",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={22}
              name="person.2.fill"
              color={color}
              weight={focused ? "semibold" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="boutique"
        options={{
          title: "Boutique",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={22}
              name="storefront.fill"
              color={color}
              weight={focused ? "semibold" : "regular"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Plus",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={22}
              name="menubar.rectangle"
              color={color}
              weight={focused ? "semibold" : "regular"}
            />
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="capture" options={{ href: null }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
