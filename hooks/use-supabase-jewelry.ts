import { useState, useEffect } from "react";
import { supabase, type SupabaseJewelry, type SupabaseBodyPart } from "@/lib/supabase";

// Hook to fetch jewelry catalog from Supabase
export function useSupabaseJewelry(type?: string) {
  const [jewelry, setJewelry] = useState<SupabaseJewelry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJewelry() {
      if (!supabase) {
        setIsLoading(false);
        setError("Supabase non configuré");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("jewelry")
          .select("*")
          .order("type")
          .order("name");

        if (type) {
          query = query.eq("type", type);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        setJewelry(data || []);
      } catch (err) {
        console.error("Error fetching jewelry:", err);
        setError("Impossible de charger les bijoux");
      } finally {
        setIsLoading(false);
      }
    }

    fetchJewelry();
  }, [type]);

  return { jewelry, isLoading, error };
}

// Hook to fetch body parts from Supabase
export function useSupabaseBodyParts(jewelryType?: string) {
  const [bodyParts, setBodyParts] = useState<SupabaseBodyPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map jewelry type to body part type
  const bodyPartType = jewelryType ? mapJewelryToBodyPart(jewelryType) : undefined;

  useEffect(() => {
    async function fetchBodyParts() {
      if (!supabase) {
        setIsLoading(false);
        setError("Supabase non configuré");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        let query = supabase
          .from("body_parts")
          .select("*")
          .is("user_id", null)
          .order("name");

        if (bodyPartType) {
          query = query.eq("type", bodyPartType);
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        setBodyParts(data || []);
      } catch (err) {
        console.error("Error fetching body parts:", err);
        setError("Impossible de charger les modèles");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBodyParts();
  }, [bodyPartType]);

  return { bodyParts, isLoading, error };
}

function mapJewelryToBodyPart(jewelryType: string): string {
  const mapping: Record<string, string> = {
    earrings: "earrings",
    necklace: "neck",
    bracelet: "wrist",
    ring: "ring",
    anklet: "foot",
    brooch: "neck",
  };
  return mapping[jewelryType] || "neck";
}
