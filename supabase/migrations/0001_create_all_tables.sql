-- =====================================================
-- Migration: Create all missing Supabase tables
-- Date: 2026-04-08
-- Purpose: Replace MySQL (Drizzle) with Supabase Postgres
-- =====================================================

-- ─── Enum types ─────────────────────────────────────────

-- Role
DO $$ BEGIN
  CREATE TYPE ecrin_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Subscription tier
DO $$ BEGIN
  CREATE TYPE ecrin_subscription_tier AS ENUM ('free', 'basic', 'premium', 'yearly', 'lifetime');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Creator tier
DO $$ BEGIN
  CREATE TYPE ecrin_creator_tier AS ENUM ('standard', 'premium', 'exclusive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Creator status
DO $$ BEGIN
  CREATE TYPE ecrin_creator_status AS ENUM ('active', 'inactive', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Wardrobe category
DO $$ BEGIN
  CREATE TYPE ecrin_wardrobe_category AS ENUM ('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'bags', 'accessories', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Season
DO $$ BEGIN
  CREATE TYPE ecrin_season AS ENUM ('spring', 'summer', 'fall', 'winter', 'all');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Occasion
DO $$ BEGIN
  CREATE TYPE ecrin_occasion AS ENUM ('casual', 'work', 'formal', 'sport', 'party', 'all');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Jewelry type (for partner jewelry)
DO $$ BEGIN
  CREATE TYPE ecrin_jewelry_type AS ENUM ('necklace', 'earrings', 'ring', 'bracelet', 'anklet', 'brooch', 'set');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Metal type
DO $$ BEGIN
  CREATE TYPE ecrin_metal_type AS ENUM ('gold', 'silver', 'rose_gold', 'platinum', 'brass', 'copper', 'resin', 'polymer', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Gem type
DO $$ BEGIN
  CREATE TYPE ecrin_gem_type AS ENUM ('diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'crystal', 'none', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Body part type
DO $$ BEGIN
  CREATE TYPE ecrin_body_part_type AS ENUM ('face', 'neck', 'bust_with_hands', 'left_ear_profile', 'right_ear_profile', 'left_wrist', 'right_wrist', 'left_hand', 'right_hand', 'left_ankle', 'right_ankle', 'full_body', 'earrings', 'ring', 'wrist', 'foot', 'full');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Partner application status
DO $$ BEGIN
  CREATE TYPE ecrin_application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Campaign key
DO $$ BEGIN
  CREATE TYPE ecrin_campaign_key AS ENUM ('yearly_50_first_100', 'yearly_25_next_100', 'yearly_10_next_100', 'monthly_10_next_200');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Ecrin Users ────────────────────────────────────────
-- Uses user_open_id TEXT to match Manus OAuth openId

CREATE TABLE IF NOT EXISTS ecrin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  open_id TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  login_method TEXT,
  role ecrin_role DEFAULT 'user' NOT NULL,
  subscription_tier ecrin_subscription_tier DEFAULT 'free' NOT NULL,
  language VARCHAR(5) DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_signed_in TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ecrin_users_open_id ON ecrin_users(open_id);

-- ─── User Stats ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_user_stats (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_open_id TEXT NOT NULL UNIQUE REFERENCES ecrin_users(open_id) ON DELETE CASCADE,
  total_try_ons INTEGER DEFAULT 0 NOT NULL,
  favorites_count INTEGER DEFAULT 0 NOT NULL,
  last_try_on_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Favorites ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_favorites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_open_id TEXT NOT NULL REFERENCES ecrin_users(open_id) ON DELETE CASCADE,
  jewelry_type VARCHAR(64) NOT NULL,
  jewelry_icon VARCHAR(16),
  model_name VARCHAR(128),
  image_uri TEXT,
  jewelry_item_id TEXT,
  creator_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ecrin_favorites_user ON ecrin_favorites(user_open_id);

-- ─── Jewelry Collection (Mon Écrin) ─────────────────────

CREATE TABLE IF NOT EXISTS ecrin_jewelry_collection (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_open_id TEXT NOT NULL REFERENCES ecrin_users(open_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  metal VARCHAR(64),
  gem VARCHAR(64),
  brand VARCHAR(128),
  collection_name VARCHAR(128),
  price INTEGER,
  image_uri TEXT,
  tags TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ecrin_collection_user ON ecrin_jewelry_collection(user_open_id);

-- ─── Creators ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_creators (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  external_id TEXT UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website_url VARCHAR(512),
  logo_uri TEXT,
  contact_email VARCHAR(320),
  commission_rate INTEGER DEFAULT 0,
  tier ecrin_creator_tier DEFAULT 'standard',
  featured BOOLEAN DEFAULT FALSE,
  status ecrin_creator_status DEFAULT 'active',
  contract_start TIMESTAMPTZ,
  contract_end TIMESTAMPTZ,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Creator Jewelry ────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_creator_jewelry (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  creator_id BIGINT NOT NULL REFERENCES ecrin_creators(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  description TEXT,
  price INTEGER,
  image_uri TEXT,
  product_url VARCHAR(512),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_creator_jewelry_creator ON ecrin_creator_jewelry(creator_id);
CREATE INDEX idx_creator_jewelry_available ON ecrin_creator_jewelry(is_available);

-- ─── Saved Looks (AI Stylist) ───────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_saved_looks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_open_id TEXT NOT NULL REFERENCES ecrin_users(open_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  occasion ecrin_occasion DEFAULT 'all',
  season ecrin_season DEFAULT 'all',
  wardrobe_item_ids JSONB,
  jewelry_item_ids JSONB,
  preview_image_url TEXT,
  styling_tips TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_saved_looks_user ON ecrin_saved_looks(user_open_id);

-- ─── Partner Brands ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_partner_brands (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url VARCHAR(512),
  is_premium BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  specialty VARCHAR(255),
  country VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Partner Jewelry ────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_partner_jewelry (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_id BIGINT NOT NULL REFERENCES ecrin_partner_brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type ecrin_jewelry_type NOT NULL,
  description TEXT,
  price_in_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'EUR',
  image_url TEXT,
  additional_images JSONB,
  product_url VARCHAR(512),
  metal_type ecrin_metal_type,
  gem_type ecrin_gem_type,
  collection VARCHAR(128),
  tags TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_try_on_enabled BOOLEAN DEFAULT TRUE,
  try_on_image_url TEXT,
  view_count INTEGER DEFAULT 0,
  try_on_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_partner_jewelry_brand ON ecrin_partner_jewelry(brand_id);
CREATE INDEX idx_partner_jewelry_type ON ecrin_partner_jewelry(type);
CREATE INDEX idx_partner_jewelry_available ON ecrin_partner_jewelry(is_available);

-- ─── Partner Jewelry Favorites ──────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_partner_jewelry_favorites (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_open_id TEXT NOT NULL REFERENCES ecrin_users(open_id) ON DELETE CASCADE,
  jewelry_id BIGINT NOT NULL REFERENCES ecrin_partner_jewelry(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_open_id, jewelry_id)
);

CREATE INDEX idx_partner_fav_user ON ecrin_partner_jewelry_favorites(user_open_id);
CREATE INDEX idx_partner_fav_jewelry ON ecrin_partner_jewelry_favorites(jewelry_id);

-- ─── Community Posts ────────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_community_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_open_id TEXT REFERENCES ecrin_users(open_id) ON DELETE SET NULL,
  author_name VARCHAR(255) NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  jewelry_type VARCHAR(64),
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_community_posts_created ON ecrin_community_posts(created_at DESC);
CREATE INDEX idx_community_posts_pinned ON ecrin_community_posts(is_pinned);

-- ─── Community Post Likes ───────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_community_post_likes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES ecrin_community_posts(id) ON DELETE CASCADE,
  user_open_id TEXT NOT NULL REFERENCES ecrin_users(open_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_open_id)
);

CREATE INDEX idx_post_likes_post ON ecrin_community_post_likes(post_id);

-- ─── Partner Applications ───────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_partner_applications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  website_url VARCHAR(512),
  jewelry_types TEXT,
  price_range VARCHAR(128),
  message TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── Launch Offer Claims ────────────────────────────────

CREATE TABLE IF NOT EXISTS ecrin_launch_offer_claims (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  client_id VARCHAR(128) NOT NULL,
  campaign_key ecrin_campaign_key NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_launch_claims_client ON ecrin_launch_offer_claims(client_id, campaign_key);

-- ─── Body Parts (Supabase) ──────────────────────────────
-- This table already exists as `body_parts` in Supabase.
-- We create it if it doesn't exist, with proper columns.

CREATE TABLE IF NOT EXISTS ecrin_body_parts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  external_id TEXT UNIQUE,
  name VARCHAR(255) NOT NULL,
  body_type ecrin_body_part_type NOT NULL,
  image_url TEXT NOT NULL,
  user_open_id TEXT REFERENCES ecrin_users(open_id) ON DELETE SET NULL,
  is_demo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_body_parts_type ON ecrin_body_parts(body_type);
CREATE INDEX idx_body_parts_demo ON ecrin_body_parts(is_demo);
CREATE INDEX idx_body_parts_user ON ecrin_body_parts(user_open_id);

-- ─── RLS Policies ───────────────────────────────────────
-- Using user_open_id from auth.users raw_user_metadata

-- Helper function to extract open_id from JWT
CREATE OR REPLACE FUNCTION get_user_open_id()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('request.jwt.claims', true)::json->>'open_id', '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all user-scoped tables
ALTER TABLE ecrin_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecrin_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecrin_jewelry_collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecrin_saved_looks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecrin_partner_jewelry_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecrin_community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecrin_body_parts ENABLE ROW LEVEL SECURITY;

-- Ecrin users: allow read for own user
CREATE POLICY "ecrin_users_select_own" ON ecrin_users
  FOR SELECT USING (open_id = get_user_open_id());
CREATE POLICY "ecrin_users_insert_self" ON ecrin_users
  FOR INSERT WITH CHECK (open_id = get_user_open_id());
CREATE POLICY "ecrin_users_update_self" ON ecrin_users
  FOR UPDATE USING (open_id = get_user_open_id());

-- User stats
CREATE POLICY "user_stats_select_own" ON ecrin_user_stats
  FOR SELECT USING (user_open_id = get_user_open_id());
CREATE POLICY "user_stats_insert_own" ON ecrin_user_stats
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "user_stats_update_own" ON ecrin_user_stats
  FOR UPDATE USING (user_open_id = get_user_open_id());

-- Favorites
CREATE POLICY "favorites_select_own" ON ecrin_favorites
  FOR SELECT USING (user_open_id = get_user_open_id());
CREATE POLICY "favorites_insert_own" ON ecrin_favorites
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "favorites_delete_own" ON ecrin_favorites
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Jewelry collection
CREATE POLICY "collection_select_own" ON ecrin_jewelry_collection
  FOR SELECT USING (user_open_id = get_user_open_id());
CREATE POLICY "collection_insert_own" ON ecrin_jewelry_collection
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "collection_update_own" ON ecrin_jewelry_collection
  FOR UPDATE USING (user_open_id = get_user_open_id());
CREATE POLICY "collection_delete_own" ON ecrin_jewelry_collection
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Saved looks
CREATE POLICY "saved_looks_select_own" ON ecrin_saved_looks
  FOR SELECT USING (user_open_id = get_user_open_id());
CREATE POLICY "saved_looks_insert_own" ON ecrin_saved_looks
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "saved_looks_update_own" ON ecrin_saved_looks
  FOR UPDATE USING (user_open_id = get_user_open_id());
CREATE POLICY "saved_looks_delete_own" ON ecrin_saved_looks
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Partner jewelry favorites
CREATE POLICY "partner_favs_select_own" ON ecrin_partner_jewelry_favorites
  FOR SELECT USING (user_open_id = get_user_open_id());
CREATE POLICY "partner_favs_insert_own" ON ecrin_partner_jewelry_favorites
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "partner_favs_delete_own" ON ecrin_partner_jewelry_favorites
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Community posts: anyone can read, auth users can create/update own
CREATE POLICY "community_posts_select_public" ON ecrin_community_posts
  FOR SELECT USING (TRUE);
CREATE POLICY "community_posts_insert_auth" ON ecrin_community_posts
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "community_posts_update_own" ON ecrin_community_posts
  FOR UPDATE USING (user_open_id = get_user_open_id());
CREATE POLICY "community_posts_delete_own" ON ecrin_community_posts
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Community post likes
CREATE POLICY "post_likes_select_public" ON ecrin_community_post_likes
  FOR SELECT USING (TRUE);
CREATE POLICY "post_likes_insert_own" ON ecrin_community_post_likes
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "post_likes_delete_own" ON ecrin_community_post_likes
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Body parts: anyone can read demo parts, auth users can manage own
CREATE POLICY "body_parts_select_demo" ON ecrin_body_parts
  FOR SELECT USING (is_demo = TRUE OR user_open_id = get_user_open_id());
CREATE POLICY "body_parts_insert_auth" ON ecrin_body_parts
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "body_parts_update_own" ON ecrin_body_parts
  FOR UPDATE USING (user_open_id = get_user_open_id());
CREATE POLICY "body_parts_delete_own" ON ecrin_body_parts
  FOR DELETE USING (user_open_id = get_user_open_id());

-- Public/anon policies for reading public data (needed for unauth access)
CREATE POLICY "partner_brands_select_public" ON ecrin_partner_brands
  FOR SELECT USING (TRUE);
CREATE POLICY "partner_jewelry_select_public" ON ecrin_partner_jewelry
  FOR SELECT USING (is_available = TRUE);
CREATE POLICY "creators_select_public" ON ecrin_creators
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "creator_jewelry_select_public" ON ecrin_creator_jewelry
  FOR SELECT USING (is_available = TRUE);
CREATE POLICY "wardrobe_models_select_public" ON wardrobe_models
  FOR SELECT USING (TRUE);
CREATE POLICY "body_parts_select_demo_public" ON body_parts
  FOR SELECT USING (user_id IS NULL);
CREATE POLICY "jewelry_select_public" ON jewelry
  FOR SELECT USING (TRUE);
CREATE POLICY "dressing_items_select_own" ON dressing_items
  FOR SELECT USING (user_open_id = get_user_open_id());
CREATE POLICY "dressing_items_insert_own" ON dressing_items
  FOR INSERT WITH CHECK (user_open_id = get_user_open_id());
CREATE POLICY "dressing_items_update_own" ON dressing_items
  FOR UPDATE USING (user_open_id = get_user_open_id());
CREATE POLICY "dressing_items_delete_own" ON dressing_items
  FOR DELETE USING (user_open_id = get_user_open_id());
