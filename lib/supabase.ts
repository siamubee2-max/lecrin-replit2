import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Supabase "Ecrin" project - primary database
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";


// ─── Storage adapter iPad-safe ───────────────────────────────────────────────
// Build 19 utilisait le storage par défaut (localStorage) qui n'existe pas en
// natif iOS → la session Supabase n'était PAS persistée → rejet 2.1(a) iPad.
// Ici : SecureStore en priorité (Keychain), fallback AsyncStorage si la valeur
// dépasse 2 KiB (limite iOS) ou si SecureStore n'est pas disponible.
const SECURE_STORE_MAX = 2048;

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const sec = await SecureStore.getItemAsync(key);
      if (sec !== null) return sec;
    } catch {}
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value.length <= SECURE_STORE_MAX) {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        return;
      }
    } catch {}
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    try { await SecureStore.deleteItemAsync(key); } catch {}
    await AsyncStorage.removeItem(key);
  },
};

// ─── Fetch avec retry exponentiel ────────────────────────────────────────────
// iPadOS 26.4.1 en sandbox Apple : 1er appel auth peut timeout.
// 3 tentatives / backoff 500 ms → 1 s → 2 s / timeout 15 s.
const fetchWithRetry: typeof fetch = async (input, init) => {
  const maxAttempts = 3;
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if ((res.status >= 500 || res.status === 429) && i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** i));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** i));
        continue;
      }
    }
  }
  throw lastErr ?? new Error("Network unreachable");
};

const supabaseOptions: SupabaseClientOptions<"public"> = {
  auth: {
    // SecureStore (Keychain) sur natif, storage par défaut (localStorage) sur web
    storage: Platform.OS === "web" ? undefined : nativeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
  global: {
    fetch: Platform.OS === "web" ? undefined : fetchWithRetry,
    headers: { "x-client-info": `ecrin-virtuel-ios/${Platform.Version}` },
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);

// Types matching Supabase schema
export interface SupabaseJewelry {
  id: string;
  user_id: string | null;
  name: string;
  brand: string | null;
  type: "earrings" | "necklace" | "bracelet" | "ring" | "anklet" | "brooch";
  image_url: string | null;
  angle_images: string[] | null;
  tags: string[] | null;
  metal: string | null;
  gems: string | null;
  collection: string | null;
  is_favorite: boolean | null;
  created_at: string;
}

export interface SupabaseBodyPart {
  id: string;
  created_at: string;
  name: string;
  type: "earrings" | "neck" | "ring" | "wrist" | "foot" | "full";
  image_url: string;
  user_id: string | null;
}

// Fetch all demo jewelry (no user_id filter for public catalog)
export async function fetchJewelryCatalog(): Promise<SupabaseJewelry[]> {
  const { data, error } = await supabase
    .from("jewelry")
    .select("*")
    .order("type")
    .order("name");

  if (error) {
    console.error("Error fetching jewelry catalog:", error);
    return [];
  }
  return data || [];
}

// Fetch body parts for a given jewelry type
export async function fetchBodyParts(
  type?: string
): Promise<SupabaseBodyPart[]> {
  let query = supabase.from("body_parts").select("*").is("user_id", null);

  if (type) {
    // Map jewelry type to body part type
    const bodyPartType = mapJewelryTypeToBodyPart(type);
    query = query.eq("type", bodyPartType);
  }

  const { data, error } = await query.order("name");

  if (error) {
    console.error("Error fetching body parts:", error);
    return [];
  }
  return data || [];
}

// Map jewelry type to body part type
export function mapJewelryTypeToBodyPart(
  jewelryType: string
): SupabaseBodyPart["type"] {
  const mapping: Record<string, SupabaseBodyPart["type"]> = {
    earrings: "earrings",
    necklace: "neck",
    bracelet: "wrist",
    ring: "ring",
    anklet: "foot",
    brooch: "neck",
  };
  return mapping[jewelryType] || "neck";
}

// Save a try-on session
export async function saveTryOnSession(params: {
  jewelryId: string;
  bodyPartId: string;
  imageUrl?: string;
}): Promise<void> {
  const { error } = await supabase.from("try_on_sessions").insert({
    jewelry_id: params.jewelryId,
    body_part_id: params.bodyPartId,
    result_image_url: params.imageUrl,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving try-on session:", error);
  }
}
