import { describe, expect, it } from "vitest";
import {
  __resetAiModelReliabilityStateForTests,
  estimateImageApiCallCostUsd,
  markModelFailure,
  markModelSuccess,
  selectAvailableModels,
} from "../server/_core/aiReliability";

describe("AI reliability circuit breaker", () => {
  it("ouvre le circuit apres plusieurs echecs", () => {
    __resetAiModelReliabilityStateForTests();
    const model = "gemini-3.1-flash-image-preview";
    markModelFailure(model);
    markModelFailure(model);
    markModelFailure(model);
    const { activeModels } = selectAvailableModels([model, "gemini-2.0-flash-preview-image-generation"]);
    expect(activeModels).not.toContain(model);
  });

  it("reinitialise le circuit apres succes", () => {
    __resetAiModelReliabilityStateForTests();
    const model = "gemini-3.1-flash-image-preview";
    markModelFailure(model);
    markModelFailure(model);
    markModelFailure(model);
    markModelSuccess(model);
    const { activeModels } = selectAvailableModels([model]);
    expect(activeModels).toContain(model);
  });

  it("estime un cout coherent", () => {
    expect(estimateImageApiCallCostUsd("gemini-3.1-flash-image-preview")).toBeGreaterThan(0);
    expect(estimateImageApiCallCostUsd("unknown-model")).toBeGreaterThan(0);
  });
});
