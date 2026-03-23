/**
 * Supabase Storage helpers for image uploads.
 * Uses the existing Supabase "Ecrin" project with a public "images" bucket.
 *
 * Setup required (one-time, in Supabase dashboard):
 *   1. Create a bucket named "images" with public access
 *   2. Add a storage policy allowing inserts for authenticated/anon users
 *
 * The SUPABASE_SERVICE_ROLE_KEY env var is optional — if set, server-side
 * uploads bypass RLS. Otherwise, the anon key is used.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://amafgweelzayrjzemdtq.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtYWZnd2VlbHpheXJqemVtZHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjI4MzgsImV4cCI6MjA4MTg5ODgzOH0.yg1jYRgrqDWMRCGHGEGR8C5jn7WmRTRC8U_1qtciDSk";

export const BUCKET = "images";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Get the public URL for a file in the images bucket.
 */
export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a buffer to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToSupabase(
  path: string,
  data: Buffer | Uint8Array,
  contentType = "image/jpeg",
): Promise<{ path: string; url: string }> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return { path, url: getPublicUrl(path) };
}

/**
 * Upload an image from a remote URL to Supabase Storage.
 * Downloads the image first, then uploads it.
 */
export async function migrateImageToSupabase(
  remoteUrl: string,
  storagePath: string,
): Promise<{ path: string; url: string }> {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image from ${remoteUrl}: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return uploadToSupabase(storagePath, buffer, contentType);
}

/**
 * Delete a file from Supabase Storage.
 */
export async function deleteFromSupabase(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}

/**
 * Ensure the "images" bucket exists. Call once at server startup or via seed.
 */
export async function ensureBucket(): Promise<void> {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
    });
    if (error && !error.message.includes("already exists")) {
      throw new Error(`Failed to create bucket "${BUCKET}": ${error.message}`);
    }
  }
}
