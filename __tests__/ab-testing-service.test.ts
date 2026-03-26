import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getOrCreateAbAssignments,
  recordAbConversion,
  getAbConversionSnapshot,
} from "../services/ab-testing-service";
import * as analyticsModule from "../lib/analytics";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

vi.mock("../lib/analytics", () => ({
  getPostHog: vi.fn(),
  trackAbAssignment: vi.fn(),
  trackAbConversion: vi.fn(),
}));

describe("AB testing service", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("cree des variantes puis les reutilise", async () => {
    vi.mocked(analyticsModule.getPostHog).mockReturnValue(null);
    const first = await getOrCreateAbAssignments();
    const second = await getOrCreateAbAssignments();

    expect(["A", "B"]).toContain(first.homeCards);
    expect(second).toEqual(first);
  });

  it("compte les conversions par bucket", async () => {
    vi.mocked(analyticsModule.getPostHog).mockReturnValue(null);
    await recordAbConversion("homeCta", "A");
    await recordAbConversion("homeCta", "A");
    await recordAbConversion("dailyLookDetail", "B");

    const snapshot = await getAbConversionSnapshot();
    expect(snapshot["homeCta:A"]).toBe(2);
    expect(snapshot["dailyLookDetail:B"]).toBe(1);
  });

  it("applique les variantes remote PostHog quand disponibles", async () => {
    vi.mocked(analyticsModule.getPostHog).mockReturnValue({
      reloadFeatureFlags: vi.fn(),
      getFeatureFlag: (key: string) => {
        if (key === "ab_home_cards_variant") return "A";
        if (key === "ab_home_cta_variant") return "B";
        if (key === "ab_daily_look_detail_variant") return true;
        return undefined;
      },
    } as any);

    const assignments = await getOrCreateAbAssignments();
    expect(assignments.homeCards).toBe("A");
    expect(assignments.homeCta).toBe("B");
    expect(assignments.dailyLookDetail).toBe("B");
  });
});
