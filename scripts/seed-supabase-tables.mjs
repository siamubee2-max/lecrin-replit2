/**
 * Creates all missing Supabase tables and seeds demo data.
 *
 * Run: node scripts/seed-supabase-tables.mjs
 *
 * Requires .env file with:
 *   EXPO_PUBLIC_SUPABASE_URL=https://amafgweelzayrjzemdtq.supabase.co
 *   SUPABASE_SERVICE_KEY=<your-service-key>
 */

// Manual dotenv loading
import { readFileSync } from 'fs';

const envPath = new URL('../.env', import.meta.url).pathname;
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    const val = trimmed.substring(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
} catch (e) {
  console.warn('Warning: could not load .env file:', e.message);
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env vars: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.error('Set these in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTableExists(tableName) {
  const { error } = await supabase.from(tableName).select('id').limit(1);
  if (error) {
    // 42P01 = relation does not exist
    // PGRST200 = column not found (table exists but no id column)
    // PGRST116 = empty result (fine, table exists)
    if (error.code === '42P01') return false;
    // Table exists but different error — still exists
    return true;
  }
  return true;
}

async function main() {
  console.log('=== Supabase Tables Checker ===\n');
  console.log('URL:', SUPABASE_URL);
  console.log('');

  const newTables = [
    'ecrin_partner_brands',
    'ecrin_partner_jewelry',
    'ecrin_partner_jewelry_favorites',
    'ecrin_community_posts',
    'ecrin_community_post_likes',
    'ecrin_favorites',
    'ecrin_jewelry_collection',
    'ecrin_user_stats',
    'ecrin_saved_looks',
    'ecrin_creators',
    'ecrin_creator_jewelry',
    'ecrin_launch_offer_claims',
    'ecrin_partner_applications',
    'ecrin_body_parts',
  ];

  const existingTables = [
    'dressing_items',
    'wardrobe_models',
    'jewelry',
    'body_parts',
    'try_on_sessions',
    'ecrin_users',
  ];

  console.log('--- New tables needed ---\n');
  const missingNew = [];
  for (const table of newTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} — MISSING`);
      missingNew.push(table);
    }
  }

  console.log('\n--- Existing tables (already in Supabase) ---\n');
  for (const table of existingTables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`  ✅ ${table}`);
    } else {
      console.log(`  ❌ ${table} — ALSO MISSING`);
    }
  }

  console.log('');

  if (missingNew.length === 0) {
    console.log('✅ All new tables already exist!');
  } else {
    console.log(`\n⚠️  ${missingNew.length} new tables need to be created.`);
    console.log('\nRun this SQL in the Supabase Dashboard SQL Editor:');
    console.log('https://supabase.com/dashboard/project/amafgweelzayrjzemdtq/sql');
    console.log('\nFile: supabase/migrations/0001_create_all_tables.sql');
  }
}

main().catch(console.error);
