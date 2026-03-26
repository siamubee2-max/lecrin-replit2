import AsyncStorage from "@react-native-async-storage/async-storage";
import { trackTryOnGenerationObserved } from "../lib/analytics";

export type TryOnType = "jewelry" | "shoes" | "clothing" | "accessories" | "outfit";

export type TryOnTelemetryEvent = {
  at: string;
  type: TryOnType;
  success: boolean;
  durationMs: number;
  errorMessage?: string;
};

export type TryOnTypeDashboard = {
  type: TryOnType;
  total: number;
  failures: number;
  failureRate: number;
  avgDurationMs: number;
};

export type TryOnObservabilityDashboard = {
  totalGenerations: number;
  totalFailures: number;
  overallFailureRate: number;
  averageDurationMs: number;
  byType: TryOnTypeDashboard[];
  lastUpdatedAt: string | null;
};

const KEY = "@ecrin_tryon_telemetry_v1";
const MAX_EVENTS = 400;

async function getEvents(): Promise<TryOnTelemetryEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TryOnTelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

async function setEvents(events: TryOnTelemetryEvent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
  } catch {}
}

export async function recordTryOnTelemetry(event: TryOnTelemetryEvent): Promise<void> {
  const existing = await getEvents();
  existing.push(event);
  await setEvents(existing);
  trackTryOnGenerationObserved({
    type: event.type,
    success: event.success,
    durationMs: event.durationMs,
    ...(event.errorMessage ? { errorMessage: event.errorMessage } : {}),
  });
}

export async function getTryOnObservabilityDashboard(): Promise<TryOnObservabilityDashboard> {
  const events = await getEvents();
  if (events.length === 0) {
    return {
      totalGenerations: 0,
      totalFailures: 0,
      overallFailureRate: 0,
      averageDurationMs: 0,
      byType: [],
      lastUpdatedAt: null,
    };
  }
  const totalGenerations = events.length;
  const totalFailures = events.filter((e) => !e.success).length;
  const averageDurationMs = Math.round(
    events.reduce((sum, e) => sum + Math.max(0, e.durationMs || 0), 0) / totalGenerations,
  );
  const byType = (["jewelry", "shoes", "clothing", "accessories", "outfit"] as TryOnType[]).map(
    (type) => {
      const subset = events.filter((e) => e.type === type);
      const total = subset.length;
      const failures = subset.filter((e) => !e.success).length;
      const avgDurationMs =
        total === 0 ? 0 : Math.round(subset.reduce((sum, e) => sum + Math.max(0, e.durationMs || 0), 0) / total);
      return {
        type,
        total,
        failures,
        failureRate: total === 0 ? 0 : failures / total,
        avgDurationMs,
      };
    },
  );
  return {
    totalGenerations,
    totalFailures,
    overallFailureRate: totalFailures / totalGenerations,
    averageDurationMs,
    byType,
    lastUpdatedAt: events[events.length - 1]?.at ?? null,
  };
}
