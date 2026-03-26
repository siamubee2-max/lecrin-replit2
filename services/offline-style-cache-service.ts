import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyGenderLook } from "./daily-gender-look-service";

const DAILY_LOOK_CACHE_KEY = "@ecrin_daily_look_cache_v1";
const WEEKLY_PLAN_CACHE_KEY = "@ecrin_weekly_plan_cache_v1";
const FAVORITES_CACHE_KEY = "@ecrin_favorites_cache_v1";

export type WeeklyPlanCacheItem = {
  id: string;
  dayLabel: string;
  weatherLabel: string;
  femme: string;
  homme: string;
  severity: number;
  order: number;
  event?: "bureau" | "soiree" | "weekend";
};

export async function setCachedDailyLook(data: DailyGenderLook): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_LOOK_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export async function getCachedDailyLook(): Promise<DailyGenderLook | null> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_LOOK_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DailyGenderLook;
  } catch {
    return null;
  }
}

export async function setCachedWeeklyPlan(data: WeeklyPlanCacheItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WEEKLY_PLAN_CACHE_KEY, JSON.stringify(data));
  } catch {}
}

export async function getCachedWeeklyPlan(): Promise<WeeklyPlanCacheItem[]> {
  try {
    const raw = await AsyncStorage.getItem(WEEKLY_PLAN_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeeklyPlanCacheItem[]) : [];
  } catch {
    return [];
  }
}

export async function setCachedFavoritesCount(count: number): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVORITES_CACHE_KEY, String(Math.max(0, count)));
  } catch {}
}

export async function getCachedFavoritesCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_CACHE_KEY);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  } catch {
    return 0;
  }
}
