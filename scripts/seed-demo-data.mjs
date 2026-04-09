/**
 * Seed Supabase with demo data for Apple review.
 *
 * Run: node scripts/seed-demo-data.mjs
 */

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
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seed() {
  console.log('Seeding demo data...\n');

  // ─── 1. Partner Brand ──────────────────────────────────────────────────
  const { data: brands, error: brandError } = await supabase
    .from('ecrin_partner_brands')
    .upsert({
      name: "Moni'attitude",
      slug: 'moniattitude',
      description: 'Bijoux artisanaux en résine et polymère. Pièces uniques inspirées de la nature et de la culture africaine.',
      logo_url: 'https://images.unsplash.com/photo-1611652022419-a9419f7a6629?w=150&h=150&fit=crop',
      website_url: 'https://moniattitude.com',
      is_premium: true,
      is_featured: true,
      specialty: 'Bijoux artisanaux - Pièces uniques',
      country: 'France',
    }, { onConflict: 'slug' })
    .select();

  if (brandError) {
    console.error('Error seeding brand:', brandError);
  } else {
    console.log('✅ Partner brand seeded:', brands?.[0]?.name);
  }

  // Get brand ID
  const { data: brandRow } = await supabase
    .from('ecrin_partner_brands')
    .select('id')
    .eq('slug', 'moniattitude')
    .single();

  const brandId = brandRow?.id;
  if (!brandId) {
    console.error('Could not find brand ID. Seeding failed.');
    return;
  }

  // ─── 2. Partner Jewelry ────────────────────────────────────────────────
  const jewelryItems = [
    {
      brand_id: brandId,
      name: 'Camélia Résine',
      type: 'necklace',
      description: 'Collier en résine translucide avec inserts floraux. Pièce unique.',
      price_in_cents: 8900,
      currency: 'EUR',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
      metal_type: 'resin',
      gem_type: 'none',
      collection: 'Nature',
      is_available: true,
      is_try_on_enabled: true,
    },
    {
      brand_id: brandId,
      name: 'Gouttes Dorées',
      type: 'earrings',
      description: 'Boucles d\'oreilles pendantes en polymère doré. Légères et élégantes.',
      price_in_cents: 4500,
      currency: 'EUR',
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
      metal_type: 'gold',
      gem_type: 'none',
      collection: 'Lumière',
      is_available: true,
      is_try_on_enabled: true,
    },
    {
      brand_id: brandId,
      name: 'Bague Saphir',
      type: 'ring',
      description: 'Bague en argent massif avec saphir bleu naturel.',
      price_in_cents: 12500,
      currency: 'EUR',
      image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
      metal_type: 'silver',
      gem_type: 'sapphire',
      collection: 'Précieux',
      is_available: true,
      is_try_on_enabled: true,
    },
    {
      brand_id: brandId,
      name: 'Bracelet Océan',
      type: 'bracelet',
      description: 'Bracelet en résine bleue avec reflets nacrés. Inspiré des vagues.',
      price_in_cents: 6500,
      currency: 'EUR',
      image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=400&fit=crop',
      metal_type: 'resin',
      gem_type: 'crystal',
      collection: 'Océan',
      is_available: true,
      is_try_on_enabled: true,
    },
    {
      brand_id: brandId,
      name: 'Perle Céleste',
      type: 'necklace',
      description: 'Collier ras-du-cou en perles d\'eau douce et argent.',
      price_in_cents: 15900,
      currency: 'EUR',
      image_url: 'https://images.unsplash.com/photo-1515562141589-67f0d569b6cc?w=400&h=400&fit=crop',
      metal_type: 'silver',
      gem_type: 'pearl',
      collection: 'Précieux',
      is_available: true,
      is_try_on_enabled: true,
    },
    {
      brand_id: brandId,
      name: 'Créoles Bohème',
      type: 'earrings',
      description: 'Grandes créoles en laiton doré avec motifs ethniques gravés.',
      price_in_cents: 3900,
      currency: 'EUR',
      image_url: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=400&h=400&fit=crop',
      metal_type: 'brass',
      gem_type: 'none',
      collection: 'Bohème',
      is_available: true,
      is_try_on_enabled: true,
    },
  ];

  const { error: jewelryError } = await supabase
    .from('ecrin_partner_jewelry')
    .upsert(jewelryItems, { onConflict: 'name' })
    .select();

  if (jewelryError) {
    console.error('Error seeding jewelry:', jewelryError);
  } else {
    console.log(`✅ ${jewelryItems.length} jewelry items seeded`);
  }

  // ─── 3. Community Posts ────────────────────────────────────────────────
  const posts = [
    {
      author_name: 'Marie L.',
      author_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
      content: 'Mon premier essayage virtuel ! Le collier Camélia me va à rav 😍 #bijoux #essayage',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop',
      jewelry_type: 'necklace',
      likes_count: 24,
      comments_count: 3,
      is_pinned: true,
    },
    {
      author_name: 'Sophie K.',
      author_avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop',
      content: 'Adore ces boucles d\'oreilles Gouttes Dorées en or ! Parfaites pour l\'été ✨',
      image_url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop',
      jewelry_type: 'earrings',
      likes_count: 18,
      comments_count: 5,
    },
    {
      brand: 'Marie L.',
      author_name: 'Amina D.',
      author_avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop',
      content: 'Le bracelet Océan est magnifique en vrai ! La couleur est encore plus belle que sur la photo 💙',
      image_url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=600&fit=crop',
      jewelry_type: 'bracelet',
      likes_count: 31,
      comments_count: 7,
    },
    {
      author_name: 'Léa M.',
      author_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop',
      content: 'Essai de la bague Saphir pour mon anniversaire. Qu\'en pensez-vous ? 💍',
      image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop',
      jewelry_type: 'ring',
      likes_count: 42,
      comments_count: 12,
    },
  ];

  const { error: postsError } = await supabase.from('ecrin_community_posts').insert(posts);
  if (postsError) {
    console.error('Error seeding posts:', postsError);
  } else {
    console.log(`✅ ${posts.length} community posts seeded`);
  }

  // ─── 4. Creators ───────────────────────────────────────────────────────
  const { error: creatorsError } = await supabase.from('ecrin_creators').upsert({
    external_id: 'moniattitude-001',
    name: "Moni'attitude",
    description: 'Créatrice de bijoux artisanaux en résine et polymère.',
    website_url: 'https://moniattitude.com',
    logo_uri: 'https://images.unsplash.com/photo-1611652022419-a9419f7a6629?w=150&h=150&fit=crop',
    contact_email: 'contact@moniattitude.com',
    commission_rate: 15,
    tier: 'premium',
    featured: true,
    status: 'active',
    is_premium: true,
    is_active: true,
  }, { onConflict: 'external_id' });

  if (creatorsError) {
    console.error('Error seeding creator:', creatorsError);
  } else {
    console.log('✅ Creator seeded');
  }

  // ─── 5. Demo Account ───────────────────────────────────────────────────
  // Check if demo user exists in auth
  const email = 'appreview@ecrinvirtuel.app';
  const password = 'EcrinReview2026!';

  const { data: existingUser } = await supabase
    .from('ecrin_users')
    .select('open_id')
    .eq('open_id', 'demo-review-apple')
    .single();

  if (!existingUser) {
    // Create the user in ecrin_users
    const { data: demoUser, error: userError } = await supabase
      .from('ecrin_users')
      .insert({
        open_id: 'demo-review-apple',
        name: 'Test Reviewer',
        email: email,
        login_method: 'email',
        role: 'user',
        subscription_tier: 'premium',
        language: 'fr',
      })
      .select()
      .single();

    if (userError) {
      console.log('Note: Demo user already exists or could not be created:', userError.message);
    } else {
      console.log('✅ Demo user created in ecrin_users');

      // Create user stats
      await supabase.from('ecrin_user_stats').insert({
        user_open_id: 'demo-review-apple',
        total_try_ons: 5,
        favorites_count: 3,
      });

      // Add some wardrobe items for the demo user
      await supabase.from('dressing_items').insert({
        user_open_id: 'demo-review-apple',
        name: 'Robe florale été',
        category: 'dresses',
        color: 'rose',
        season: 'summer',
        occasion: 'casual',
        is_favorite: true,
      });

      // Add some collection items
      await supabase.from('ecrin_jewelry_collection').insert({
        user_open_id: 'demo-review-apple',
        name: 'Boucles Perle',
        type: 'earrings',
        metal: 'argent',
        gem: 'perle',
        brand: 'Moni\'attitude',
        collection: 'Précieux',
        image_uri: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=200&h=200&fit=crop',
        is_favorite: true,
      });

      console.log('✅ Demo user stats and items seeded');
    }
  } else {
    console.log('ℹ️  Demo user already exists in ecrin_users');
  }

  console.log('\n✅ Seeding complete!');
}

seed().catch(console.error);
