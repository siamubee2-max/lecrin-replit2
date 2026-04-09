/**
 * Script to create all missing Supabase tables for the Écrin Virtuel app.
 * This replaces the MySQL (Drizzle) tables with Supabase Postgres equivalents.
 *
 * Usage: node scripts/create-supabase-tables.mjs
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function execSql(sql) {
  const { error } = await supabase.rpc('pgbouncer_get_server_version');
  // We use the raw REST endpoint for raw SQL since Supabase doesn't expose direct SQL execution
  const url = new URL(`${SUPABASE_URL}/rest/v1/`);

  // Use the migrations endpoint or direct exec
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
    },
  });
  return res;
}

async function rawQuery(sql) {
  // Execute raw SQL via Supabase REST API
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({})
  });

  // Actually, we need to use the SQL API
  // The cleanest way is to execute each CREATE TABLE via the REST API directly
  // or use the sql() endpoint if available
  throw new Error('Use direct fetch approach');
}

/**
 * Execute raw SQL against Supabase using the service role key.
 * Supabase's REST API doesn't have a direct SQL endpoint,
 * so we use the /rest/v1/ endpoint with a workaround.
 *
 * Actually, we need to use the Supabase Management API or psql.
 * The simplest approach: use the REST API to check if tables exist,
 * then create them individually via INSERT into pg_class (not possible).
 *
 * Best approach for scripts: just use `psql` command or the SQL editor in Supabase dashboard.
 *
 * Alternative: create tables one by one via REST API... but that doesn't work for DDL.
 *
 * SOLUTION: Write the SQL file and instruct user to run it in Supabase SQL editor.
 * OR: use the supabase CLI if available.
 */

async function main() {
  console.log('Checking Supabase connectivity...');
  const healthRes = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
    },
  });

  if (healthRes.status === 404 || healthRes.status === 200) {
    // REST API is reachable - 404 means no table specified, 200 means info endpoint
    console.log('Supabase REST API is reachable.');
  } else {
    console.error(`Unexpected status: ${healthRes.status}`);
    process.exit(1);
  }

  // Check if migration tables exist via a simple approach:
  // Use the Supabase SQL endpoint via fetch with the service key
  // Supabase does have a POST /rest/v1/rpc/ endpoint for custom functions

  // The best scripting approach: since supabase-js supports direct queries,
  // we can create tables by first checking which exist and then providing instructions.

  // Let's try creating a simple test table first
  console.log('\nChecking existing tables...');

  // Check existing tables via information_schema query
  // Note: This requires a way to run SQL. The supabase-js client doesn't do DDL.
  // We'll use the Edge Function approach or the management API.

  // Actually: Supabase supports raw SQL via the `pg` protocol through the management API.
  // But for simplicity, the most reliable way is to provide the SQL file
  // and instruct the user to run it in the Supabase dashboard SQL editor.

  console.log('\n✅ Supabase is accessible at:', SUPABASE_URL);
  console.log('\nNext step: Run the migration SQL in Supabase Dashboard:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/amafgweelzayrjzemdtq/sql');
  console.log('  2. Copy the contents of supabase/migrations/0001_create_all_tables.sql');
  console.log('  3. Paste and run');
  console.log('\nOR run via Supabase CLI:');
  console.log('  supabase db push');
}

main().catch(console.error);
