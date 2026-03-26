import { describe, it, expect } from "vitest";

const hasKey = Boolean(process.env.REVENUECAT_API_KEY);

describe.skipIf(!hasKey)("RevenueCat API Key", () => {
  it("REVENUECAT_API_KEY should be defined and have correct format", () => {
    const key = process.env.REVENUECAT_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key).toMatch(/^sk_/);
  });

  it("REVENUECAT_API_KEY should be long enough to be valid", () => {
    const key = process.env.REVENUECAT_API_KEY ?? "";
    expect(key.length).toBeGreaterThan(10);
  });
});
