import AsyncStorage from "@react-native-async-storage/async-storage";

const TRYON_HISTORY_KEY = "tryon_history";
const LOCAL_COLLECTION_KEY = "@ecrin_local_collection";
const DEFAULT_RETENTION_DAYS = 45;

type DatedItem = {
  date?: string;
  createdAt?: string;
};

function isWithinRetention(item: DatedItem, retentionDays: number): boolean {
  const rawDate = item.createdAt ?? item.date;
  if (!rawDate) return true;
  const ts = new Date(rawDate).getTime();
  if (!Number.isFinite(ts)) return true;
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  return Date.now() - ts <= maxAgeMs;
}

async function cleanupKey(key: string, retentionDays: number, maxItems: number): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    const filtered = parsed.filter((item) => isWithinRetention(item ?? {}, retentionDays)).slice(0, maxItems);
    const removed = parsed.length - filtered.length;
    if (removed > 0) {
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
    }
    return removed;
  } catch {
    return 0;
  }
}

export async function runLocalDataHygiene(options?: {
  retentionDays?: number;
  maxHistoryItems?: number;
  maxCollectionItems?: number;
}): Promise<{ removedHistory: number; removedCollection: number }> {
  const retentionDays = options?.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const maxHistoryItems = options?.maxHistoryItems ?? 50;
  const maxCollectionItems = options?.maxCollectionItems ?? 200;
  const [removedHistory, removedCollection] = await Promise.all([
    cleanupKey(TRYON_HISTORY_KEY, retentionDays, maxHistoryItems),
    cleanupKey(LOCAL_COLLECTION_KEY, retentionDays, maxCollectionItems),
  ]);
  return { removedHistory, removedCollection };
}
