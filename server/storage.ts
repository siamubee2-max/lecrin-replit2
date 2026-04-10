/**
 * Storage helpers using Supabase Storage.
 * Uses the service role key for server-side operations.
 */
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

const BUCKET_NAME = "generated";

function getSupabaseClient() {
  if (!ENV.supabaseUrl || !ENV.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase credentials missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseClient();
  const key = normalizeKey(relKey);

  const uint8Data = typeof data === "string" ? Buffer.from(data) : data;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, uint8Data, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);

  return { key, url: urlData.publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const supabase = getSupabaseClient();
  const key = normalizeKey(relKey);

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);

  return { key, url: urlData.publicUrl };
}
