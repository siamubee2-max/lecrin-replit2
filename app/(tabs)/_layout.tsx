import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { TryOnTabIcon } from "@/components/TryOnTabIcon";
import { useI18n } from "@/lib/i18n-context";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 10,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tryon"
        options={{
          title: t.tabs.tryOn,
          tabBarIcon: ({ color, focused }) => (
            <TryOnTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ecrin"
        options={{
          title: t.tabs.ecrin,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="diamond.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dressing"
        options={{
          title: t.tabs.wardrobe,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="tshirt.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t.tabs.community,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="boutique"
        options={{
          title: t.tabs.boutique,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="storefront.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="menubar.rectangle" color={color} />,
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
