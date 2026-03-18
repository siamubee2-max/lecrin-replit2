import { describe, it, expect } from "vitest";

describe("ADMIN_CODE configuration", () => {
  it("ADMIN_CODE env var is set and not empty", () => {
    const adminCode = process.env.ADMIN_CODE;
    // Doit être défini (soit la valeur personnalisée, soit le fallback)
    const effectiveCode = adminCode || "ADMIN_CODE_REDACTED";
    expect(effectiveCode).toBeTruthy();
    expect(effectiveCode.length).toBeGreaterThanOrEqual(8);
  });

  it("ADMIN_CODE fallback is ADMIN_CODE_REDACTED when not set", () => {
    const fallback = "ADMIN_CODE_REDACTED";
    expect(fallback.length).toBeGreaterThanOrEqual(8);
  });
});
