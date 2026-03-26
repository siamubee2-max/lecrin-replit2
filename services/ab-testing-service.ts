import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getPostHog,
  trackAbAssignment,
  trackAbConversion as trackAbConversionPostHog,
} from "../lib/analytics";

export type AbVariant = "A" | "B";
export type AbAssignments = {
  homeCards: AbVariant;
  homeCta: AbVariant;
  dailyLookDetail: AbVariant;
};

type AbConversionKey = keyof AbAssignments;

const ASSIGNMENT_KEY = "@ecrin_ab_assignments_v1";
const CONVERSION_KEY = "@ecrin_ab_conversions_v1";
const FEATURE_FLAG_KEYS: Record<AbConversionKey, string> = {
  homeCards: "ab_home_cards_variant",
  homeCta: "ab_home_cta_variant",
  dailyLookDetail: "ab_daily_look_detail_variant",
};

const DEFAULT_ASSIGNMENTS: AbAssignments = {
  homeCards: "A",
  homeCta: "A",
  dailyLookDetail: "A",
};

function randomVariant(): AbVariant {
  return Math.random() < 0.5 ? "A" : "B";
}

function normalizeVariant(raw: unknown): AbVariant | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "boolean") return raw ? "B" : "A";
  if (typeof raw === "number") return raw >= 1 ? "B" : "A";
  if (typeof raw !== "string") return undefined;
  const value = raw.trim().toLowerCase();
  if (value === "a" || value === "control") return "A";
  if (value === "b" || value === "variant" || value === "test" || value === "treatment") return "B";
  return undefined;
}

async function applyPostHogOverrides(base: AbAssignments): Promise<AbAssignments> {
  const client = getPostHog() as unknown as
    | {
        reloadFeatureFlags?: () => void;
        getFeatureFlag?: (key: string) => unknown;
      }
    | null;
  if (!client?.getFeatureFlag) return base;
  try {
    client.reloadFeatureFlags?.();
  } catch {}

  const next: AbAssignments = { ...base };
  (Object.keys(FEATURE_FLAG_KEYS) as AbConversionKey[]).forEach((experiment) => {
    const raw = client.getFeatureFlag?.(FEATURE_FLAG_KEYS[experiment]);
    const normalized = normalizeVariant(raw);
    if (normalized) next[experiment] = normalized;
  });
  return next;
}

export async function getOrCreateAbAssignments(): Promise<AbAssignments> {
  let baseAssignments: AbAssignments | null = null;
  try {
    const raw = await AsyncStorage.getItem(ASSIGNMENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AbAssignments>;
      if (parsed.homeCards && parsed.homeCta && parsed.dailyLookDetail) {
        baseAssignments = parsed as AbAssignments;
      }
    }
  } catch {}

  const assigned: AbAssignments =
    baseAssignments ??
    ({
      homeCards: randomVariant(),
      homeCta: randomVariant(),
      dailyLookDetail: randomVariant(),
    } as AbAssignments);
  const resolved = await applyPostHogOverrides(assigned);
  try {
    await AsyncStorage.setItem(ASSIGNMENT_KEY, JSON.stringify(resolved));
  } catch {}
  trackAbAssignment({ experiment: "homeCards", variant: resolved.homeCards });
  trackAbAssignment({ experiment: "homeCta", variant: resolved.homeCta });
  trackAbAssignment({ experiment: "dailyLookDetail", variant: resolved.dailyLookDetail });
  return resolved;
}

export async function recordAbConversion(key: AbConversionKey, variant: AbVariant): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSION_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const bucket = `${key}:${variant}`;
    parsed[bucket] = (parsed[bucket] ?? 0) + 1;
    await AsyncStorage.setItem(CONVERSION_KEY, JSON.stringify(parsed));
  } catch {}
  trackAbConversionPostHog({
    experiment: key,
    variant,
  });
}

export async function getAbConversionSnapshot(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(CONVERSION_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function getDefaultAbAssignments(): AbAssignments {
  return DEFAULT_ASSIGNMENTS;
}
