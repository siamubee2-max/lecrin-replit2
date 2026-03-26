export type CriticalFlowState = {
  onboardingCompleted: boolean;
  dailyLookLoaded: boolean;
  guidedTryOnCompleted: boolean;
  lookSaved: boolean;
};

export function createInitialCriticalFlowState(): CriticalFlowState {
  return {
    onboardingCompleted: false,
    dailyLookLoaded: false,
    guidedTryOnCompleted: false,
    lookSaved: false,
  };
}

export function completeOnboarding(state: CriticalFlowState): CriticalFlowState {
  return {
    ...state,
    onboardingCompleted: true,
  };
}

export function loadDailyLook(state: CriticalFlowState): CriticalFlowState {
  if (!state.onboardingCompleted) return state;
  return {
    ...state,
    dailyLookLoaded: true,
  };
}

export function completeGuidedTryOn(state: CriticalFlowState): CriticalFlowState {
  if (!state.dailyLookLoaded) return state;
  return {
    ...state,
    guidedTryOnCompleted: true,
  };
}

export function saveLook(state: CriticalFlowState): CriticalFlowState {
  if (!state.guidedTryOnCompleted) return state;
  return {
    ...state,
    lookSaved: true,
  };
}

export function isCriticalFlowCompleted(state: CriticalFlowState): boolean {
  return (
    state.onboardingCompleted &&
    state.dailyLookLoaded &&
    state.guidedTryOnCompleted &&
    state.lookSaved
  );
}
