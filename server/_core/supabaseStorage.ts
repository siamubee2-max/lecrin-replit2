/**
 * Supabase Storage helper (server-side)
 *
 * Uses the Supabase service role key to upload files to a public bucket.
 * Replaces the old Replit Forge storagePut() function.
 *
 * Required env vars:
 *   SUPABASE_URL            — same as EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY    — Service Role key (secret, never expose to client)
 *
 * Bucket to create in Supabase Dashboard → Storage:
 *   Name: "ecrin-uploads"   (public)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const BUCKET = "ecrin-uploads";

/**
 * Upload a Buffer to Supabase Storage and return the public URL.
 *
 * @param key        Path inside the bucket, e.g. "wardrobe/user123/1234.jpg"
 * @param data       File content as a Buffer
 * @param mimeType   MIME type, e.g. "image/jpeg"
 */
export async function supabaseStoragePut(
  key: string,
  data: Buffer,
  mimeType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error(
      "Supabase storage not configured: set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env",
    );
  }

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${key}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": mimeType,
      "x-upsert": "true", // overwrite if key already exists
    },
    body: new Uint8Array(data),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Supabase storage upload failed (${res.status})${detail ? `: ${detail}` : ""}`,
    );
  }

  // Public URL pattern for Supabase Storage public buckets
  const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${key}`;
  return { key, url };
}
