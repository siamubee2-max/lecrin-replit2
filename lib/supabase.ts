import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl
  || process.env.EXPO_PUBLIC_SUPABASE_URL
  || "";
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey
  || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[Supabase] Missing credentials - configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
}

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: Platform.OS === "web" ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === "web",
        },
      })
    : null;

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
  if (!supabase) return [];

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
  if (!supabase) return [];

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
  if (!supabase) return;

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
