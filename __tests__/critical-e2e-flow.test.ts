import { describe, expect, it } from "vitest";
import {
  completeGuidedTryOn,
  completeOnboarding,
  createInitialCriticalFlowState,
  isCriticalFlowCompleted,
  loadDailyLook,
  saveLook,
} from "../services/critical-flow-service";

describe("Critical e2e flow", () => {
  it("parcours complet onboarding -> daily look -> try-on guide -> sauvegarde", () => {
    let state = createInitialCriticalFlowState();
    state = completeOnboarding(state);
    state = loadDailyLook(state);
    state = completeGuidedTryOn(state);
    state = saveLook(state);

    expect(isCriticalFlowCompleted(state)).toBe(true);
  });

  it("bloque les etapes si l'ordre n'est pas respecte", () => {
    let state = createInitialCriticalFlowState();
    state = loadDailyLook(state);
    state = completeGuidedTryOn(state);
    state = saveLook(state);

    expect(state.dailyLookLoaded).toBe(false);
    expect(state.guidedTryOnCompleted).toBe(false);
    expect(state.lookSaved).toBe(false);
    expect(isCriticalFlowCompleted(state)).toBe(false);
  });
});
