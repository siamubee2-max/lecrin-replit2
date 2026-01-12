/**
 * Notifications Settings Screen
 * Configure daily look suggestions based on weather and calendar
 */

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/i18n-context";
import { useColors } from "@/hooks/use-colors";
import {
  configureNotifications,
  requestNotificationPermissions,
  getNotificationSettings,
  saveNotificationSettings,
  scheduleDailyNotification,
  sendTestNotification,
  cancelAllScheduledNotifications,
  generateFreshSuggestion,
  areNotificationsEnabled,
  NotificationSettings,
} from "@/services/notification-service";
import {
  requestLocationPermission,
  checkLocationPermission,
  getUserLocation,
  clearLocationCache,
  UserLocation,
} from "@/services/weather-service";
import { EventType, EVENT_TYPE_ICONS } from "@/services/calendar-service";
import { DailySuggestion } from "@/services/daily-look-suggestion-service";

// Event types for selection
const EVENT_TYPES: EventType[] = [
  "none",
  "work",
  "meeting",
  "interview",
  "presentation",
  "casual",
  "formal",
  "party",
  "date",
  "dinner",
  "brunch",
  "wedding",
  "shopping",
  "travel",
  "sport",
];

export default function NotificationsScreen() {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [suggestion, setSuggestion] = useState<DailySuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    configureNotifications();
    loadLocation();
  }, []);

  const loadLocation = async () => {
    const hasPermission = await checkLocationPermission();
    setHasLocationPermission(hasPermission);
    
    if (hasPermission) {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error("Error loading location:", error);
      }
    }
  };

  const handleRequestLocationPermission = async () => {
    setLoadingLocation(true);
    try {
      const granted = await requestLocationPermission();
      setHasLocationPermission(granted);
      
      if (granted) {
        const location = await getUserLocation();
        setUserLocation(location);
        
        // Refresh suggestion with new location
        if (settings) {
          const freshSuggestion = await generateFreshSuggestion(settings);
          setSuggestion(freshSuggestion);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert(
          t.notifications.locationPermissionRequired || "Localisation requise",
          t.notifications.locationPermissionMessage || "Activez la localisation pour des suggestions météo précises."
        );
      }
    } catch (error) {
      console.error("Error requesting location:", error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleRefreshLocation = async () => {
    setLoadingLocation(true);
    clearLocationCache();
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      
      // Refresh suggestion with new location
      if (settings) {
        const freshSuggestion = await generateFreshSuggestion(settings);
        setSuggestion(freshSuggestion);
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error("Error refreshing location:", error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadSettings = async () => {
    try {
      const [loadedSettings, permissionGranted] = await Promise.all([
        getNotificationSettings(),
        areNotificationsEnabled(),
      ]);
      setSettings(loadedSettings);
      setHasPermission(permissionGranted);

      // Generate initial suggestion
      if (loadedSettings) {
        const freshSuggestion = await generateFreshSuggestion(loadedSettings);
        setSuggestion(freshSuggestion);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!settings) return;

    if (enabled && !hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          t.notifications.permissionRequired,
          t.notifications.permissionMessage
        );
        return;
      }
      setHasPermission(true);
    }

    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    await saveNotificationSettings({ enabled });

    if (enabled) {
      await scheduleDailyNotification(newSettings);
    } else {
      await cancelAllScheduledNotifications();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleTimeChange = async (time: "morning" | "evening") => {
    if (!settings) return;

    const newSettings = { ...settings, time };
    setSettings(newSettings);
    await saveNotificationSettings({ time });

    if (settings.enabled) {
      await scheduleDailyNotification(newSettings);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEventTypeChange = async (eventType: EventType) => {
    if (!settings) return;

    const newSettings = { ...settings, todayEventType: eventType };
    setSettings(newSettings);
    await saveNotificationSettings({ todayEventType: eventType });
    setShowEventPicker(false);

    // Regenerate suggestion with new event type
    setGenerating(true);
    try {
      const freshSuggestion = await generateFreshSuggestion(newSettings);
      setSuggestion(freshSuggestion);
    } finally {
      setGenerating(false);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRefreshSuggestion = async () => {
    if (!settings) return;

    setGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const freshSuggestion = await generateFreshSuggestion(settings);
      setSuggestion(freshSuggestion);
    } catch (error) {
      console.error("Error refreshing suggestion:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleTestNotification = async () => {
    if (!settings) return;

    if (!hasPermission) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          t.notifications.permissionRequired,
          t.notifications.permissionMessage
        );
        return;
      }
      setHasPermission(true);
    }

    try {
      await sendTestNotification(settings);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t.notifications.testSent);
    } catch (error) {
      console.error("Error sending test notification:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            style={{ opacity: 0.7 }}
          >
            <Text className="text-primary text-base">← {t.common.close}</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground">
            {t.notifications.title}
          </Text>
          <Text className="text-base text-muted mt-2">
            {t.notifications.dailySuggestionsDesc}
          </Text>
        </View>

        {/* Settings Section */}
        <View className="px-6 mb-6">
          {/* Location Section */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">
              📍 {t.notifications.location}
            </Text>
            {hasLocationPermission && userLocation ? (
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-base text-foreground">
                    {userLocation.city || "Position actuelle"}
                    {userLocation.country ? `, ${userLocation.country}` : ""}
                  </Text>
                  <Text className="text-sm text-muted mt-1">
                    {t.notifications.locationEnabled}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleRefreshLocation}
                  disabled={loadingLocation}
                  className="px-3 py-2"
                >
                  <Text className="text-primary text-sm">
                    {loadingLocation ? "..." : `↻ ${t.notifications.refreshLocation}`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text className="text-sm text-muted mb-3">
                  {t.notifications.usingDefaultLocation}
                </Text>
                <TouchableOpacity
                  onPress={handleRequestLocationPermission}
                  disabled={loadingLocation}
                  className="bg-primary py-3 rounded-xl items-center"
                >
                  <Text className="text-background font-semibold">
                    {loadingLocation ? "..." : `📍 ${t.notifications.enableLocation}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Enable/Disable Toggle */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">
                  {t.notifications.dailySuggestions}
                </Text>
                <Text className="text-sm text-muted mt-1">
                  {settings?.enabled
                    ? t.notifications.enabled
                    : t.notifications.disabled}
                </Text>
              </View>
              <Switch
                value={settings?.enabled || false}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          {/* Notification Time */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">
              {t.notifications.notificationTime}
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleTimeChange("morning")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  settings?.time === "morning" ? "bg-primary" : "bg-background"
                }`}
                style={
                  settings?.time !== "morning"
                    ? { borderWidth: 1, borderColor: colors.border }
                    : undefined
                }
              >
                <Text
                  className={`text-base font-medium ${
                    settings?.time === "morning"
                      ? "text-background"
                      : "text-foreground"
                  }`}
                >
                  🌅 {t.notifications.morning}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleTimeChange("evening")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  settings?.time === "evening" ? "bg-primary" : "bg-background"
                }`}
                style={
                  settings?.time !== "evening"
                    ? { borderWidth: 1, borderColor: colors.border }
                    : undefined
                }
              >
                <Text
                  className={`text-base font-medium ${
                    settings?.time === "evening"
                      ? "text-background"
                      : "text-foreground"
                  }`}
                >
                  🌙 {t.notifications.evening}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Event Type */}
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-3">
              {t.notifications.todayEvent}
            </Text>
            <TouchableOpacity
              onPress={() => setShowEventPicker(!showEventPicker)}
              className="bg-background rounded-xl p-4 flex-row items-center justify-between"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">
                  {EVENT_TYPE_ICONS[settings?.todayEventType || "none"]}
                </Text>
                <Text className="text-base text-foreground">
                  {t.eventTypes[settings?.todayEventType || "none"]}
                </Text>
              </View>
              <Text className="text-muted">{showEventPicker ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {/* Event Type Picker */}
            {showEventPicker && (
              <View className="mt-3 bg-background rounded-xl p-2" style={{ borderWidth: 1, borderColor: colors.border }}>
                {EVENT_TYPES.map((eventType) => (
                  <TouchableOpacity
                    key={eventType}
                    onPress={() => handleEventTypeChange(eventType)}
                    className={`flex-row items-center p-3 rounded-lg ${
                      settings?.todayEventType === eventType
                        ? "bg-primary/10"
                        : ""
                    }`}
                  >
                    <Text className="text-xl mr-3">
                      {EVENT_TYPE_ICONS[eventType]}
                    </Text>
                    <Text
                      className={`text-base ${
                        settings?.todayEventType === eventType
                          ? "text-primary font-semibold"
                          : "text-foreground"
                      }`}
                    >
                      {t.eventTypes[eventType]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Test Notification Button */}
          {Platform.OS !== "web" && (
            <TouchableOpacity
              onPress={handleTestNotification}
              className="bg-surface rounded-2xl p-4 mb-4 items-center"
              style={{ borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="text-base font-medium text-primary">
                🔔 {t.notifications.testNotification}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Today's Suggestion Preview */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">
              {t.notifications.yourLookToday}
            </Text>
            <TouchableOpacity
              onPress={handleRefreshSuggestion}
              disabled={generating}
              className="px-3 py-1"
            >
              <Text className="text-primary text-sm">
                {generating ? "..." : `↻ ${t.notifications.refreshSuggestion}`}
              </Text>
            </TouchableOpacity>
          </View>

          {suggestion ? (
            <View className="bg-surface rounded-2xl p-5">
              {/* Weather & Event Context */}
              <View className="flex-row items-center mb-4">
                <View className="flex-1 flex-row items-center">
                  <Text className="text-3xl mr-2">{suggestion.weather.icon}</Text>
                  <View>
                    <Text className="text-lg font-semibold text-foreground">
                      {suggestion.weather.temperature}°C
                    </Text>
                    <Text className="text-sm text-muted">
                      {suggestion.weather.description}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-2">{suggestion.event.icon}</Text>
                  <Text className="text-sm text-muted">
                    {suggestion.event.name}
                  </Text>
                </View>
              </View>

              {/* Main Tip */}
              <View className="bg-primary/10 rounded-xl p-4 mb-4">
                <Text className="text-base text-foreground leading-relaxed">
                  {suggestion.mainTip}
                </Text>
              </View>

              {/* Look Inspiration */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted mb-2">
                  {t.notifications.lookInspiration}
                </Text>
                <Text className="text-base text-foreground italic">
                  {'"'}{suggestion.lookInspiration}{'"'}
                </Text>
              </View>

              {/* Mood Keywords */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {suggestion.moodKeywords.map((keyword, index) => (
                  <View
                    key={index}
                    className="bg-background px-3 py-1 rounded-full"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                  >
                    <Text className="text-sm text-muted">{keyword}</Text>
                  </View>
                ))}
              </View>

              {/* Recommended Jewelry */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted mb-2">
                  ✨ {t.notifications.recommendedJewelry}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {suggestion.recommendedJewelry.map((item, index) => (
                    <View
                      key={index}
                      className="bg-primary/10 px-3 py-2 rounded-lg"
                    >
                      <Text className="text-sm text-primary">{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Recommended Metals */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-muted mb-2">
                  💎 {t.notifications.recommendedMetals}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {suggestion.recommendedMetals.map((metal, index) => (
                    <View
                      key={index}
                      className="bg-background px-3 py-2 rounded-lg"
                      style={{ borderWidth: 1, borderColor: colors.border }}
                    >
                      <Text className="text-sm text-foreground">{metal}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Avoid */}
              {suggestion.avoidJewelry.length > 0 && (
                <View>
                  <Text className="text-sm font-semibold text-muted mb-2">
                    ⚠️ {t.notifications.avoidJewelry}
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {suggestion.avoidJewelry.map((item, index) => (
                      <View
                        key={index}
                        className="bg-error/10 px-3 py-2 rounded-lg"
                      >
                        <Text className="text-sm text-error">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Styling Tips */}
              <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text className="text-sm font-semibold text-muted mb-3">
                  💡 {t.notifications.stylingTips}
                </Text>
                {suggestion.tips.map((tip, index) => (
                  <View key={index} className="flex-row mb-2">
                    <Text className="text-muted mr-2">•</Text>
                    <Text className="text-sm text-foreground flex-1">{tip}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-8 items-center">
              <Text className="text-4xl mb-4">💎</Text>
              <Text className="text-base text-muted text-center">
                {t.notifications.noSuggestionYet}
              </Text>
              <TouchableOpacity
                onPress={handleRefreshSuggestion}
                className="mt-4 bg-primary px-6 py-3 rounded-full"
              >
                <Text className="text-background font-semibold">
                  {t.notifications.generateFirst}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
