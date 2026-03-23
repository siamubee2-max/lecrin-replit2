import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

export async function getSessionToken(): Promise<string | null> {
  try {
    // Web platform uses cookie-based auth, no manual token management needed
    if (Platform.OS === "web") {
      return null;
    }

    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    // Web platform uses cookie-based auth
    if (Platform.OS === "web") {
      return;
    }

    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch (error) {
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // Silently ignore removal failures
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    let info: string | null = null;
    if (Platform.OS === "web") {
      info = window.localStorage.getItem(USER_INFO_KEY);
    } else {
      info = await SecureStore.getItemAsync(USER_INFO_KEY);
    }

    if (!info) {
      return null;
    }

    try {
      const user = JSON.parse(info);
      // Basic shape validation
      if (typeof user?.id !== "number" || typeof user?.openId !== "string") {
        return null;
      }
      return user;
    } catch (e) {
      if (__DEV__) console.warn("[Auth] Failed to parse user info:", e);
      return null;
    }
  } catch {
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    const serialized = JSON.stringify(user);

    if (Platform.OS === "web") {
      window.localStorage.setItem(USER_INFO_KEY, serialized);
      return;
    }

    await SecureStore.setItemAsync(USER_INFO_KEY, serialized);
  } catch (error) {
    if (__DEV__) console.warn("[Auth] Failed to store user info:", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(USER_INFO_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch {
    // Silently ignore clearing failures
  }
}
