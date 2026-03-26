import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DailyGenderLook } from "./daily-gender-look-service";

type LookAction = "save" | "share" | "reject";

type LearningState = {
  saveCount: number;
  shareCount: number;
  rejectCount: number;
  updatedAt: string;
};

const LEARNING_KEY = "@ecrin_look_learning_v1";

const DEFAULT_STATE: LearningState = {
  saveCount: 0,
  shareCount: 0,
  rejectCount: 0,
  updatedAt: new Date(0).toISOString(),
};

export async function getLookLearningState(): Promise<LearningState> {
  try {
    const raw = await AsyncStorage.getItem(LEARNING_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    return {
      saveCount: Number(parsed.saveCount ?? 0),
      shareCount: Number(parsed.shareCount ?? 0),
      rejectCount: Number(parsed.rejectCount ?? 0),
      updatedAt: parsed.updatedAt ?? DEFAULT_STATE.updatedAt,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function recordLookAction(action: LookAction): Promise<void> {
  const current = await getLookLearningState();
  const next: LearningState = {
    ...current,
    saveCount: current.saveCount + (action === "save" ? 1 : 0),
    shareCount: current.shareCount + (action === "share" ? 1 : 0),
    rejectCount: current.rejectCount + (action === "reject" ? 1 : 0),
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(LEARNING_KEY, JSON.stringify(next));
}

export async function adaptDailyLookWithLearning(base: DailyGenderLook): Promise<DailyGenderLook> {
  const learning = await getLookLearningState();
  const positive = learning.saveCount + learning.shareCount;
  const confidence = positive - learning.rejectCount;
  if (confidence === 0) return base;

  const extraTip =
    confidence > 0
      ? "Apprentissage: vous validez souvent des looks affirmes, on monte legerement le caractere stylistique."
      : "Apprentissage: vous rejetez souvent les looks audacieux, on privilegie une version plus sobre.";
  const extraAccessory =
    confidence > 0 ? "Piece signature assumee" : "Accessoire minimal discret";

  return {
    ...base,
    femme: {
      ...base.femme,
      accessories: [...base.femme.accessories, extraAccessory],
      tip: `${base.femme.tip} ${extraTip}`,
    },
    homme: {
      ...base.homme,
      accessories: [...base.homme.accessories, extraAccessory],
      tip: `${base.homme.tip} ${extraTip}`,
    },
  };
}
