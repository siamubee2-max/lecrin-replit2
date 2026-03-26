import { beforeEach, describe, expect, it, vi } from "vitest";
import { runLocalDataHygiene } from "../services/local-data-hygiene-service";

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

describe("Local data hygiene service", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("supprime les éléments trop anciens", async () => {
    storage.set(
      "tryon_history",
      JSON.stringify([
        { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
        { date: new Date().toISOString() },
      ]),
    );
    storage.set(
      "@ecrin_local_collection",
      JSON.stringify([
        { createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() },
        { createdAt: new Date().toISOString() },
      ]),
    );

    const result = await runLocalDataHygiene({ retentionDays: 45 });

    expect(result.removedHistory).toBe(1);
    expect(result.removedCollection).toBe(1);
  });
});
