/**
 * Shared Supabase query helpers — all screens use these instead of tRPC.
 *
 * IMPORTANT: Table and column names match the ACTUAL Supabase schema.
 *
 * Existing Supabase tables (already populated):
 *   - dressing_items   (user_open_id TEXT)
 *   - wardrobe_models  (no auth)
 *   - jewelry          (public catalog)
 *   - body_parts       (user_id nullable)
 *   - ecrin_users      (open_id)
 *
 * New tables to create via SQL migration (see supabase/migrations/0001_*.sql):
 *   - ecrin_favorites
 *   - ecrin_jewelry_collection
 *   - ecrin_user_stats
 *   - ecrin_saved_looks
 *   - ecrin_creators
 *   - ecrin_creator_jewelry
 *   - ecrin_partner_brands
 *   - ecrin_partner_jewelry
 *   - ecrin_partner_jewelry_favorites
 *   - ecrin_community_posts
 *   - ecrin_community_post_likes
 *   - ecrin_partner_applications
 *   - ecrin_launch_offer_claims
 */

import { supabase } from "./supabase";

// ─── Auth token helper ─────────────────────────────────────────────────────
// Returns the user's open_id from Supabase Auth user_metadata
async function getOpenId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  // If we stored open_id during OAuth linking
  return data.user.user_metadata?.open_id ?? data.user.id ?? null;
}

// ─── Public: Wardrobe Models (catalogue) ─────────────────────────────────────

export async function fetchWardrobeModels(filters?: {
  gender?: string;
  category?: string;
  season?: string;
  occasion?: string;
}) {
  if (!supabase) return [];
  let q = supabase.from("wardrobe_models").select("*");

  if (filters?.gender) q = q.eq("gender", filters.gender);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.season) q = q.or(`season.eq.${filters.season},season.eq.all`);
  if (filters?.occasion) q = q.or(`occasion.eq.${filters.occasion},occasion.eq.all`);

  const { data, error } = await q.order("category", { ascending: true }).order("name", { ascending: true });
  if (error) { console.error("[wardrobe-models] error:", error); return []; }
  return data || [];
}

// ─── Wardrobe Items (dressing_items) ─────────────────────────────────────────

export async function fetchWardrobeItems(openId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("dressing_items")
    .select("*")
    .eq("user_open_id", openId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[wardrobe] fetch error:", error); return []; }
  return data || [];
}

export async function addWardrobeItem(openId: string, item: Record<string, unknown>) {
  if (!supabase) return null;
  const payload = { ...item, user_open_id: openId };
  const { data, error } = await supabase.from("dressing_items").insert(payload).select().single();
  if (error) { console.error("[wardrobe] add error:", error); return null; }
  return data;
}

export async function updateWardrobeItem(id: string, openId: string, updates: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("dressing_items")
    .update(updates)
    .eq("id", id).eq("user_open_id", openId).select().single();
  if (error) { console.error("[wardrobe] update error:", error); return null; }
  return data;
}

export async function deleteWardrobeItem(id: string, openId: string) {
  if (!supabase) return false;
  const { error } = await supabase.from("dressing_items").delete().eq("id", id).eq("user_open_id", openId);
  if (error) { console.error("[wardrobe] delete error:", error); return false; }
  return true;
}

// ─── Partner Brands (public) ─────────────────────────────────────────────────

export async function fetchPartnerBrands() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_partner_brands")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("name");
  if (error) { console.error("[partner-brands] error:", error); return []; }
  return data || [];
}

// ─── Partner Jewelry ─────────────────────────────────────────────────────────

export async function fetchPartnerJewelry(filters?: {
  brandId?: number;
  type?: string;
  metalType?: string;
  gemType?: string;
  search?: string;
}) {
  if (!supabase) return [];
  let q = supabase.from("ecrin_partner_jewelry").select("*").eq("is_available", true);

  if (filters?.brandId) q = q.eq("brand_id", filters.brandId);
  if (filters?.type && filters.type !== "all") q = q.eq("type", filters.type);
  if (filters?.metalType && filters.metalType !== "all") q = q.eq("metal_type", filters.metalType);
  if (filters?.gemType && filters.gemType !== "all") q = q.eq("gem_type", filters.gemType);

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) { console.error("[partner-jewelry] error:", error); return []; }

  let results = data || [];

  // Client-side search filter (ILIKE not available in Supabase select, do it here)
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    results = results.filter((j: any) =>
      j.name?.toLowerCase().includes(term) ||
      j.description?.toLowerCase().includes(term) ||
      j.tags?.toLowerCase().includes(term)
    );
  }

  return results;
}

// ─── Jewelry Collection (Mon Écrin) ──────────────────────────────────────────

export async function fetchCollectionItems(openId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_jewelry_collection")
    .select("*")
    .eq("user_open_id", openId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[collection] error:", error); return []; }
  return data || [];
}

export async function addCollectionItem(openId: string, item: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_jewelry_collection")
    .insert({ ...item, user_open_id: openId })
    .select().single();
  if (error) { console.error("[collection] add error:", error); return null; }
  return data;
}

export async function updateCollectionItem(id: string, openId: string, updates: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_jewelry_collection")
    .update(updates).eq("id", id).eq("user_open_id", openId).select().single();
  if (error) { console.error("[collection] update error:", error); return null; }
  return data;
}

export async function removeCollectionItem(id: string, openId: string) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("ecrin_jewelry_collection").delete().eq("id", id).eq("user_open_id", openId);
  if (error) { console.error("[collection] delete error:", error); return false; }
  return true;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function fetchFavorites(openId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_favorites")
    .select("*")
    .eq("user_open_id", openId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[favorites] error:", error); return []; }
  return data || [];
}

export async function addFavorite(openId: string, fav: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_favorites")
    .insert({ ...fav, user_open_id: openId })
    .select().single();
  if (error) { console.error("[favorites] add error:", error); return null; }
  return data;
}

export async function removeFavorite(id: string, openId: string) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("ecrin_favorites").delete().eq("id", id).eq("user_open_id", openId);
  if (error) { console.error("[favorites] delete error:", error); return false; }
  return true;
}

// ─── Saved Looks ──────────────────────────────────────────────────────────────

export async function fetchSavedLooks(openId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_saved_looks")
    .select("*")
    .eq("user_open_id", openId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[saved-looks] error:", error); return []; }
  return data || [];
}

export async function createSavedLook(openId: string, look: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_saved_looks")
    .insert({ ...look, user_open_id: openId })
    .select().single();
  if (error) { console.error("[saved-looks] create error:", error); return null; }
  return data;
}

export async function updateSavedLook(id: string, openId: string, updates: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_saved_looks")
    .update(updates).eq("id", id).eq("user_open_id", openId).select().single();
  if (error) { console.error("[saved-looks] update error:", error); return null; }
  return data;
}

export async function deleteSavedLook(id: string, openId: string) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("ecrin_saved_looks").delete().eq("id", id).eq("user_open_id", openId);
  if (error) { console.error("[saved-looks] delete error:", error); return false; }
  return true;
}

// ─── Community Posts ─────────────────────────────────────────────────────────

export async function fetchCommunityPosts(opts?: { limit?: number; offset?: number }) {
  if (!supabase) return [];
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const { data, error } = await supabase
    .from("ecrin_community_posts")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) { console.error("[community] error:", error); return []; }
  return data || [];
}

export async function createCommunityPost(openId: string, post: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_community_posts")
    .insert({ ...post, user_open_id: openId, likes_count: 0, comments_count: 0 })
    .select().single();
  if (error) { console.error("[community] create error:", error); return null; }
  return data;
}

export async function togglePostLike(openId: string, postId: string): Promise<{ liked: boolean }> {
  if (!supabase) return { liked: false };

  // Check if already liked
  const { data: existing } = await supabase
    .from("ecrin_community_post_likes")
    .select("*").eq("post_id", postId).eq("user_open_id", openId).maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("ecrin_community_post_likes").delete().eq("post_id", postId).eq("user_open_id", openId);
    await supabase.from("ecrin_community_posts").update({ likes_count: supabase.rpc("decrement_int") }).eq("id", postId);
    return { liked: false };
  }

  // Like
  await supabase.from("ecrin_community_post_likes").insert({ post_id: postId, user_open_id: openId });
  await supabase.from("ecrin_community_posts").update({ likes_count: supabase.rpc("increment_int") }).eq("id", postId);
  return { liked: true };
}

// ─── Creators (public) ───────────────────────────────────────────────────────

export async function fetchCreators() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_creators")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) { console.error("[creators] error:", error); return []; }
  return data || [];
}

export async function fetchCreatorJewelry() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_creator_jewelry")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  if (error) { console.error("[creator-jewelry] error:", error); return []; }
  return data || [];
}

// ─── Body Parts (demo + user) ────────────────────────────────────────────────

export async function fetchBodyParts(type?: string) {
  if (!supabase) return [];
  let q = supabase.from("body_parts").select("*").is("user_id", null);
  if (type) q = q.eq("type", type);
  const { data, error } = await q.order("name");
  if (error) { console.error("[body-parts] error:", error); return []; }
  return data || [];
}

export async function fetchUserBodyParts(openId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_body_parts")
    .select("*")
    .eq("user_open_id", openId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[body-parts-user] error:", error); return []; }
  return data || [];
}

export async function addBodyPart(openId: string, bodyPart: Record<string, unknown>) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_body_parts")
    .insert({ ...bodyPart, user_open_id: openId })
    .select().single();
  if (error) { console.error("[body-parts] add error:", error); return null; }
  return data;
}

export async function deleteBodyPart(id: string, openId: string) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("ecrin_body_parts").delete().eq("id", id).eq("user_open_id", openId);
  if (error) { console.error("[body-parts] delete error:", error); return false; }
  return true;
}

// ─── User Stats ──────────────────────────────────────────────────────────────

export async function fetchUserStats(openId: string) {
  if (!supabase) return { total_try_ons: 0, favorites_count: 0, last_try_on_date: null };
  const { data, error } = await supabase
    .from("ecrin_user_stats")
    .select("*")
    .eq("user_open_id", openId)
    .maybeSingle();
  if (error) { console.error("[stats] error:", error); }
  return data ?? { total_try_ons: 0, favorites_count: 0, last_try_on_date: null };
}

export async function incrementTryOnCount(openId: string) {
  if (!supabase) return;
  await supabase.from("ecrin_user_stats").upsert(
    { user_open_id: openId },
    { onConflict: "user_open_id" }
  );
  // Then increment
  const { error: tryOnError } = await supabase.rpc("increment_try_on", { user_oid: openId });
  if (tryOnError) console.warn("[stats] increment_try_on error:", tryOnError);
}

// ─── Partner Jewelry Favorites ───────────────────────────────────────────────

export async function fetchPartnerFavorites(openId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ecrin_partner_jewelry_favorites")
    .select("*, jewelry:ecrin_partner_jewelry(*)")
    .eq("user_open_id", openId)
    .order("created_at", { ascending: false });
  if (error) { console.error("[partner-favorites] error:", error); return []; }
  return data || [];
}

export async function addPartnerFavorite(openId: string, jewelryId: number) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ecrin_partner_jewelry_favorites")
    .upsert({ user_open_id: openId, jewelry_id: jewelryId }, { onConflict: "user_open_id,jewelry_id" })
    .select().single();
  if (error) { console.error("[partner-favorites] add error:", error); return null; }
  return data;
}

export async function removePartnerFavorite(openId: string, jewelryId: number) {
  if (!supabase) return false;
  const { error } = await supabase
    .from("ecrin_partner_jewelry_favorites")
    .delete().eq("user_open_id", openId).eq("jewelry_id", jewelryId);
  if (error) { console.error("[partner-favorites] remove error:", error); return false; }
  return true;
}

export async function isPartnerFavorited(openId: string, jewelryId: number) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("ecrin_partner_jewelry_favorites")
    .select("id").eq("user_open_id", openId).eq("jewelry_id", jewelryId).maybeSingle();
  return !!data;
}

// ─── Partner Jewelry Tracking ────────────────────────────────────────────────

export async function trackJewelryView(id: number) {
  if (!supabase) return;
  const { error: viewError } = await supabase.rpc("increment_view_count", { jewelry_id: id });
  if (viewError) console.warn("[partner-jewelry] track view error:", viewError);
}

export async function trackJewelryTryOn(id: number) {
  if (!supabase) return;
  const { error: tryonError } = await supabase.rpc("increment_tryon_count", { jewelry_id: id });
  if (tryonError) console.warn("[partner-jewelry] track tryon error:", tryonError);
}

export async function trackJewelryClick(id: number) {
  if (!supabase) return;
  const { error: clickError } = await supabase.rpc("increment_click_count", { jewelry_id: id });
  if (clickError) console.warn("[partner-jewelry] track click error:", clickError);
}
