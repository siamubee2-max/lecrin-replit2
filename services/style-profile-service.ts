import AsyncStorage from "@react-native-async-storage/async-storage";

export type StyleProfile = "elegant" | "minimal" | "street" | "business";

const STYLE_PROFILE_KEY = "@ecrin_style_profile";

export async function getStyleProfile(): Promise<StyleProfile> {
  try {
    const raw = await AsyncStorage.getItem(STYLE_PROFILE_KEY);
    if (raw === "elegant" || raw === "minimal" || raw === "street" || raw === "business") {
      return raw;
    }
  } catch (error) {
    console.warn("[StyleProfile] Read failed:", error);
  }
  return "elegant";
}

export async function setStyleProfile(profile: StyleProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STYLE_PROFILE_KEY, profile);
  } catch (error) {
    console.warn("[StyleProfile] Write failed:", error);
  }
}
