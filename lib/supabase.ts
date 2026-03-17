import { createClient } from "@supabase/supabase-js";

// Supabase "Ecrin" project - primary database
const SUPABASE_URL = "SUPABASE_URL_REDACTED";
const SUPABASE_ANON_KEY =
  "SUPABASE_ANON_KEY_REDACTED";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
