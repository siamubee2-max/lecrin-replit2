type ModelCircuitState = {
  failureCount: number;
  openUntilMs: number;
  lastFailureAt?: string;
  lastSuccessAt?: string;
};

const modelStates = new Map<string, ModelCircuitState>();
const FAILURE_THRESHOLD = Number(process.env.AI_MODEL_FAILURE_THRESHOLD ?? 3);
const COOLDOWN_MS = Number(process.env.AI_MODEL_COOLDOWN_MS ?? 5 * 60 * 1000);

function getState(model: string): ModelCircuitState {
  if (!modelStates.has(model)) {
    modelStates.set(model, { failureCount: 0, openUntilMs: 0 });
  }
  return modelStates.get(model)!;
}

export function isModelCircuitOpen(model: string, nowMs: number = Date.now()): boolean {
  const state = getState(model);
  return state.openUntilMs > nowMs;
}

export function markModelSuccess(model: string): void {
  const state = getState(model);
  state.failureCount = 0;
  state.openUntilMs = 0;
  state.lastSuccessAt = new Date().toISOString();
}

export function markModelFailure(model: string): void {
  const state = getState(model);
  state.failureCount += 1;
  state.lastFailureAt = new Date().toISOString();
  if (state.failureCount >= FAILURE_THRESHOLD) {
    state.openUntilMs = Date.now() + COOLDOWN_MS;
  }
}

export function selectAvailableModels(models: string[]): {
  activeModels: string[];
  skippedModels: string[];
} {
  const now = Date.now();
  const activeModels: string[] = [];
  const skippedModels: string[] = [];
  for (const model of models) {
    if (isModelCircuitOpen(model, now)) {
      skippedModels.push(model);
    } else {
      activeModels.push(model);
    }
  }
  // Fallback safety: if all models are open, keep original order.
  if (activeModels.length === 0) {
    return { activeModels: [...models], skippedModels: [] };
  }
  return { activeModels, skippedModels };
}

export function estimateImageApiCallCostUsd(model: string): number {
  const byModel: Record<string, number> = {
    "gemini-3.1-flash-image-preview": 0.0045,
    "gemini-2.0-flash-preview-image-generation": 0.0035,
  };
  return byModel[model] ?? 0.004;
}

export function __resetAiModelReliabilityStateForTests(): void {
  modelStates.clear();
}
