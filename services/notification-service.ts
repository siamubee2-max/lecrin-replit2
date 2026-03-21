/**
 * Notification Service
 * Handles push notifications for daily look suggestions
 * Uses expo-notifications for local notifications
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getCurrentWeather, DEFAULT_LOCATION, Location } from "./weather-service";
import { getTodaySchedule, CalendarEvent, EventType, createManualEvent } from "./calendar-service";
import {
  generateDailySuggestion,
  generateNotificationContent,
  getNextNotificationTime,
  DailySuggestion,
  NOTIFICATION_TIMES,
} from "./daily-look-suggestion-service";

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATIONS_ENABLED: "notifications_enabled",
  NOTIFICATION_TIME: "notification_time",
  USER_LOCATION: "user_location",
  TODAY_EVENT_TYPE: "today_event_type",
  LAST_SUGGESTION: "last_suggestion",
  PUSH_TOKEN: "push_token",
} as const;

// Notification settings type
export type NotificationSettings = {
  enabled: boolean;
  time: "morning" | "evening";
  location: Location;
  todayEventType: EventType;
};

// Default settings
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  time: "morning",
  location: DEFAULT_LOCATION,
  todayEventType: "none",
};

/**
 * Configure notification handler
 */
export function configureNotifications(): void {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  if (!Device.isDevice) {
    console.log("[Notifications] Must use physical device for push notifications");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Notifications] Permission not granted");
    return false;
  }

  // Configure Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("daily-looks", {
      name: "Suggestions de Looks",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#D4AF37",
      description: "Recevez des suggestions de bijoux quotidiennes",
    });
  }

  return true;
}

/**
 * Get notification settings from storage
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const [enabled, time, locationStr, eventType] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED),
      AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_TIME),
      AsyncStorage.getItem(STORAGE_KEYS.USER_LOCATION),
      AsyncStorage.getItem(STORAGE_KEYS.TODAY_EVENT_TYPE),
    ]);

    return {
      enabled: enabled === "true",
      time: (time as "morning" | "evening") || "morning",
      location: locationStr ? JSON.parse(locationStr) : DEFAULT_LOCATION,
      todayEventType: (eventType as EventType) || "none",
    };
  } catch (error) {
    console.error("[Notifications] Error loading settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save notification settings to storage
 */
export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
  try {
    const promises: Promise<void>[] = [];

    if (settings.enabled !== undefined) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, String(settings.enabled))
      );
    }

    if (settings.time !== undefined) {
      promises.push(AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_TIME, settings.time));
    }

    if (settings.location !== undefined) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(settings.location))
      );
    }

    if (settings.todayEventType !== undefined) {
      promises.push(
        AsyncStorage.setItem(STORAGE_KEYS.TODAY_EVENT_TYPE, settings.todayEventType)
      );
    }

    await Promise.all(promises);
  } catch (error) {
    console.error("[Notifications] Error saving settings:", error);
  }
}

/**
 * Schedule daily notification
 */
export async function scheduleDailyNotification(
  settings: NotificationSettings
): Promise<string | null> {
  if (!settings.enabled) {
    return null;
  }

  try {
    // Cancel existing notifications
    await cancelAllScheduledNotifications();

    // Get weather and generate suggestion
    const weather = await getCurrentWeather(settings.location);
    
    // Create a simple event based on user's selection
    const events: CalendarEvent[] = settings.todayEventType !== "none"
      ? [createManualEvent(settings.todayEventType, settings.todayEventType)]
      : [];
    
    const schedule = getTodaySchedule(events);
    const suggestion = generateDailySuggestion(weather, schedule);
    const notificationContent = generateNotificationContent(suggestion);

    // Save suggestion for later display
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SUGGESTION, JSON.stringify(suggestion));

    // Schedule notification
    const { hour, minute } = NOTIFICATION_TIMES[settings.time];
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationContent.title,
        body: notificationContent.body,
        data: notificationContent.data,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log(`[Notifications] Scheduled daily notification at ${hour}:${minute}`);
    return notificationId;
  } catch (error) {
    console.error("[Notifications] Error scheduling notification:", error);
    return null;
  }
}

/**
 * Send an immediate test notification
 */
export async function sendTestNotification(settings: NotificationSettings): Promise<void> {
  try {
    // Get weather and generate suggestion
    const weather = await getCurrentWeather(settings.location);
    
    const events: CalendarEvent[] = settings.todayEventType !== "none"
      ? [createManualEvent(settings.todayEventType, settings.todayEventType)]
      : [];
    
    const schedule = getTodaySchedule(events);
    const suggestion = generateDailySuggestion(weather, schedule);
    const notificationContent = generateNotificationContent(suggestion);

    // Save suggestion
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SUGGESTION, JSON.stringify(suggestion));

    // Send immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationContent.title,
        body: notificationContent.body,
        data: notificationContent.data,
        sound: true,
      },
      trigger: null, // Immediate
    });

    console.log("[Notifications] Test notification sent");
  } catch (error) {
    console.error("[Notifications] Error sending test notification:", error);
    throw error;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log("[Notifications] All scheduled notifications cancelled");
}

/**
 * Get the last generated suggestion
 */
export async function getLastSuggestion(): Promise<DailySuggestion | null> {
  try {
    const suggestionStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SUGGESTION);
    if (!suggestionStr) return null;
    
    const suggestion = JSON.parse(suggestionStr) as DailySuggestion;
    suggestion.date = new Date(suggestion.date);
    return suggestion;
  } catch (error) {
    console.error("[Notifications] Error loading last suggestion:", error);
    return null;
  }
}

/**
 * Generate a fresh suggestion (without scheduling notification)
 */
export async function generateFreshSuggestion(settings: NotificationSettings): Promise<DailySuggestion> {
  const weather = await getCurrentWeather(settings.location);
  
  const events: CalendarEvent[] = settings.todayEventType !== "none"
    ? [createManualEvent(settings.todayEventType, settings.todayEventType)]
    : [];
  
  const schedule = getTodaySchedule(events);
  const suggestion = generateDailySuggestion(weather, schedule);
  
  // Save for later
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SUGGESTION, JSON.stringify(suggestion));
  
  return suggestion;
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Get scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Check if notifications are enabled in system settings
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}
/**
 * Schedule a subscription expiry reminder notification 3 days before expiry.
 * Cancels any previous subscription reminder before scheduling a new one.
 */
const SUBSCRIPTION_REMINDER_ID_KEY = "subscription_reminder_notif_id";

export async function scheduleSubscriptionExpiryReminder(
  expiresDate: string,
  tierLabel: string
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    // Cancel previous subscription reminder if any
    const prevId = await AsyncStorage.getItem(SUBSCRIPTION_REMINDER_ID_KEY);
    if (prevId) {
      await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
      await AsyncStorage.removeItem(SUBSCRIPTION_REMINDER_ID_KEY);
    }

    const expiryMs = new Date(expiresDate).getTime();
    const reminderMs = expiryMs - 3 * 24 * 60 * 60 * 1000; // 3 jours avant
    const now = Date.now();

    if (reminderMs <= now) {
      // Moins de 3 jours restants — envoyer une notification immédiate
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "⏰ Votre abonnement expire bientôt",
          body: `Votre plan ${tierLabel} expire dans moins de 3 jours. Renouvelez pour continuer à profiter de l'essayage virtuel.`,
          data: { type: "subscription_expiry" },
        },
        trigger: null,
      });
      return;
    }

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Votre abonnement expire bientôt",
        body: `Votre plan ${tierLabel} expire dans 3 jours. Renouvelez pour continuer à profiter de l'essayage virtuel.`,
        data: { type: "subscription_expiry" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminderMs),
      },
    });

    await AsyncStorage.setItem(SUBSCRIPTION_REMINDER_ID_KEY, notifId);
    console.log(`[Notifications] Subscription expiry reminder scheduled for ${new Date(reminderMs).toISOString()}`);
  } catch (err) {
    console.warn("[Notifications] Failed to schedule subscription expiry reminder:", err);
  }
}

/**
 * Cancel the subscription expiry reminder notification.
 */
export async function cancelSubscriptionExpiryReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const prevId = await AsyncStorage.getItem(SUBSCRIPTION_REMINDER_ID_KEY);
    if (prevId) {
      await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
      await AsyncStorage.removeItem(SUBSCRIPTION_REMINDER_ID_KEY);
    }
  } catch {}
}
