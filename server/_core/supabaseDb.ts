/**
 * Supabase Database client (server-side)
 *
 * Uses the Supabase service role key to query the Postgres DB
 * via the REST API (PostgREST). No mysql/drizzle needed.
 *
 * Required env vars:
 *   SUPABASE_URL          — e.g. https://amafgweelzayrjzemdtq.supabase.co
 *   SUPABASE_SERVICE_KEY  — Service Role key (secret)
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

function getSupabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY,
  };
}

function headers() {
  const { key } = getSupabaseConfig();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
    apikey: key,
    Prefer: "return=representation",
  };
}

async function supabaseQuery<T>(
  table: string,
  params: Record<string, string> = {},
  method = "GET",
  body?: object,
): Promise<T[]> {
  const { url: supabaseUrl, key } = getSupabaseConfig();
  if (!supabaseUrl || !key) {
    console.warn("[SupabaseDB] Not configured, returning empty array");
    return [];
  }
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`[SupabaseDB] ${method} ${table} failed (${res.status}): ${detail}`);
  }
  if (method === "DELETE" || res.status === 204) return [] as T[];
  return res.json() as Promise<T[]>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SupabaseWardrobeItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  brand?: string;
  color?: string;
  secondary_color?: string;
  material?: string;
  size?: string;
  price?: number;
  image_url?: string;
  season?: string;
  occasion?: string;
  is_favorite?: boolean;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseWardrobeModel {
  id: number;
  name: string;
  category: string;
  gender: string;
  section?: string;
  season?: string;
  occasion?: string;
  image_url?: string;
  tags?: string[];
}

// ─── Wardrobe Items (user's own clothing) ────────────────────────────────────

export async function getSupabaseWardrobeItems(userId: string): Promise<SupabaseWardrobeItem[]> {
  return supabaseQuery<SupabaseWardrobeItem>("dressing_items", {
    user_open_id: `eq.${userId}`,
    order: "created_at.desc",
  });
}

export async function getSupabaseWardrobeItem(id: string): Promise<SupabaseWardrobeItem | null> {
  const rows = await supabaseQuery<SupabaseWardrobeItem>("dressing_items", {
    id: `eq.${id}`,
    limit: "1",
  });
  return rows[0] || null;
}

export async function createSupabaseWardrobeItem(
  item: Omit<SupabaseWardrobeItem, "id" | "created_at" | "updated_at">,
): Promise<SupabaseWardrobeItem> {
  const rows = await supabaseQuery<SupabaseWardrobeItem>("dressing_items", {}, "POST", {
    ...item,
    user_open_id: item.user_id,
  });
  return rows[0];
}

export async function updateSupabaseWardrobeItem(
  id: string,
  userId: string,
  data: Partial<SupabaseWardrobeItem>,
): Promise<void> {
  await supabaseQuery<SupabaseWardrobeItem>(
    "dressing_items",
    { id: `eq.${id}`, user_open_id: `eq.${userId}` },
    "PATCH",
    data,
  );
}

export async function deleteSupabaseWardrobeItem(id: string, userId: string): Promise<void> {
  await supabaseQuery<SupabaseWardrobeItem>(
    "dressing_items",
    { id: `eq.${id}`, user_open_id: `eq.${userId}` },
    "DELETE",
  );
}

// ─── Wardrobe Models (catalogue: 50 femmes + 45 hommes) ──────────────────────

export async function getSupabaseWardrobeModels(filters?: {
  gender?: string;
  category?: string;
  season?: string;
  occasion?: string;
}): Promise<SupabaseWardrobeModel[]> {
  const params: Record<string, string> = { order: "category.asc,name.asc" };
  if (filters?.gender) params["gender"] = `eq.${filters.gender}`;
  if (filters?.category) params["category"] = `eq.${filters.category}`;
  if (filters?.season) params["season"] = `in.(${filters.season},all)`;
  if (filters?.occasion) params["occasion"] = `in.(${filters.occasion},all)`;
  return supabaseQuery<SupabaseWardrobeModel>("wardrobe_models", params);
}

// ─── Users (auth — remplace MySQL) ───────────────────────────────────────────

export interface SupabaseUser {
  id: number;
  open_id: string;
  name?: string;
  email?: string;
  login_method?: string;
  role: "user" | "admin";
  subscription_tier: "free" | "basic" | "premium" | "yearly" | "lifetime";
  language?: string;
  created_at: string;
  updated_at: string;
  last_signed_in: string;
}

/** Convert Supabase user row to the shape expected by the app (camelCase) */
function toAppUser(u: SupabaseUser) {
  return {
    id: u.id,
    openId: u.open_id,
    name: u.name ?? null,
    email: u.email ?? null,
    loginMethod: u.login_method ?? null,
    role: u.role,
    subscriptionTier: u.subscription_tier,
    language: u.language ?? "fr",
    createdAt: new Date(u.created_at),
    updatedAt: new Date(u.updated_at),
    lastSignedIn: new Date(u.last_signed_in),
  };
}

export async function getSupabaseUserByOpenId(openId: string) {
  const rows = await supabaseQuery<SupabaseUser>("ecrin_users", {
    open_id: `eq.${openId}`,
    limit: "1",
  });
  return rows[0] ? toAppUser(rows[0]) : null;
}

export async function upsertSupabaseUser(data: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}) {
  const now = new Date().toISOString();
  const payload = {
    open_id: data.openId,
    name: data.name ?? null,
    email: data.email ?? null,
    login_method: data.loginMethod ?? null,
    last_signed_in: (data.lastSignedIn ?? new Date()).toISOString(),
    updated_at: now,
  };
  // Upsert on open_id conflict
  const { url: supabaseUrl } = getSupabaseConfig();
  const customHeaders = {
    ...headers(),
    Prefer: "return=representation,resolution=merge-duplicates",
    "on-conflict": "open_id",
  };
  const url = new URL(`${supabaseUrl}/rest/v1/ecrin_users`);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: customHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`[SupabaseDB] upsert utilisateurs failed (${res.status}): ${detail}`);
  }
  const rows = await res.json() as SupabaseUser[];
  return rows[0] ? toAppUser(rows[0]) : null;
}
