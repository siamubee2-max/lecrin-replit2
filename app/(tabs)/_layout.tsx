import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, StyleSheet } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
          title: "Accueil",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tryon"
        options={{
          title: "Essayer",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? [styles.activeIconBg, { backgroundColor: colors.primary + "20" }] : null}>
              <IconSymbol size={24} name="wand.and.stars" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ecrin"
        options={{
          title: "Mon Écrin",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="diamond.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="dressing"
        options={{
          title: "Dressing",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="tshirt.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Comm.",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="boutique"
        options={{
          title: "Boutique",
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="storefront.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Plus",
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
