/**
 * Migration script: Download all assets from CDN source and upload to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-cdn-assets.mjs
 *
 * Prerequisites:
 *   - Create an "app-assets" bucket in Supabase Storage (public)
 *   - Set SUPABASE_SERVICE_ROLE_KEY env var
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://amafgweelzayrjzemdtq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "app-assets";
const CDN_BASE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663144691943";

// Recursively find all .tsx/.ts files
function findSourceFiles(dir, extensions = [".tsx", ".ts", ".tsconfig"]) {
  const results = [];
  const skip = ["node_modules", ".git", "dist", "build"];
  for (const entry of readdirSync(dir)) {
    if (skip.includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findSourceFiles(full, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

// Extract all unique image filenames referenced in source files
function extractImageFilenames(rootDir) {
  const files = findSourceFiles(rootDir);
  const imagePattern = /[A-Za-z0-9_-]{8,}\.(jpg|jpeg|png)/g;
  const filenames = new Set();

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const matches = content.matchAll(imagePattern);
    for (const match of matches) {
      filenames.add(match[0]);
    }
  }

  return [...filenames].sort();
}

function guessContentType(filename) {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

function storageKey(filename) {
  // Logo
  if (filename === "VejyhYwxBjsBsYcG.png") return "logo.png";
  // Categorized images
  if (filename.startsWith("clothing_")) return `clothing/${filename}`;
  if (filename.startsWith("shoes_")) return `shoes/${filename}`;
  if (filename.startsWith("accessory_")) return `accessory/${filename}`;
  if (filename.startsWith("mannequin_")) return `mannequin/${filename}`;
  // Everything else goes to assets/
  return `assets/${filename}`;
}

async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY is not set");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Scan source files for image references
  const rootDir = join(import.meta.dirname, "..");
  console.log("Scanning source files for image references...");
  const filenames = extractImageFilenames(rootDir);
  console.log(`Found ${filenames.length} unique image references.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const filename of filenames) {
    const cdnUrl = `${CDN_BASE}/${filename}`;
    const key = storageKey(filename);
    const contentType = guessContentType(filename);

    try {
      // Download from CDN
      process.stdout.write(`  ${filename} ... `);
      const response = await fetch(cdnUrl);
      if (!response.ok) {
        console.log(`SKIP (${response.status})`);
        skipped++;
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(key, buffer, { contentType, upsert: true });

      if (error) {
        console.log(`FAIL: ${error.message}`);
        failed++;
        continue;
      }

      console.log(`OK → ${key}`);
      success++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nDone: ${success} uploaded, ${skipped} skipped, ${failed} failed.`
  );

  if (success > 0) {
    const baseUrl = supabase.storage
      .from(BUCKET)
      .getPublicUrl("").publicUrl.replace(/\/$/, "");
    console.log(`\nSet EXPO_PUBLIC_CDN_URL=${baseUrl} in your .env`);
  }
}

main().catch(console.error);
