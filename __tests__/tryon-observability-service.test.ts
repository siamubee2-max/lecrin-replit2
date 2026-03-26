import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getTryOnObservabilityDashboard,
  recordTryOnTelemetry,
} from "../services/tryon-observability-service";

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
  trackTryOnGenerationObserved: vi.fn(),
}));

describe("TryOn observability service", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("calcule le dashboard global", async () => {
    await recordTryOnTelemetry({
      at: new Date().toISOString(),
      type: "jewelry",
      success: true,
      durationMs: 1000,
    });
    await recordTryOnTelemetry({
      at: new Date().toISOString(),
      type: "jewelry",
      success: false,
      durationMs: 2000,
      errorMessage: "Timeout",
    });

    const dashboard = await getTryOnObservabilityDashboard();

    expect(dashboard.totalGenerations).toBe(2);
    expect(dashboard.totalFailures).toBe(1);
    expect(dashboard.overallFailureRate).toBe(0.5);
    expect(dashboard.averageDurationMs).toBe(1500);
  });

  it("calcule le taux d'echec par type", async () => {
    await recordTryOnTelemetry({
      at: new Date().toISOString(),
      type: "outfit",
      success: false,
      durationMs: 3000,
    });
    await recordTryOnTelemetry({
      at: new Date().toISOString(),
      type: "outfit",
      success: true,
      durationMs: 1000,
    });
    await recordTryOnTelemetry({
      at: new Date().toISOString(),
      type: "shoes",
      success: true,
      durationMs: 900,
    });

    const dashboard = await getTryOnObservabilityDashboard();
    const outfit = dashboard.byType.find((x) => x.type === "outfit");
    const shoes = dashboard.byType.find((x) => x.type === "shoes");

    expect(outfit?.total).toBe(2);
    expect(outfit?.failures).toBe(1);
    expect(outfit?.failureRate).toBe(0.5);
    expect(shoes?.failureRate).toBe(0);
  });
});
