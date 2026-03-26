import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  favorites, 
  InsertFavorite, 
  userStats, 
  InsertUserStats,
  creators,
  InsertCreator,
  creatorJewelry,
  InsertCreatorJewelry,
  jewelryCollection,
  InsertJewelryItem,
  bodyParts,
  InsertBodyPart,
  wardrobeItems,
  InsertWardrobeItem,
  savedLooks,
  InsertSavedLook,
  partnerBrands,
  InsertPartnerBrand,
  partnerJewelry,
  InsertPartnerJewelry,
  partnerJewelryFavorites,
  InsertPartnerJewelryFavorite,
  launchOfferClaims,
  InsertLaunchOfferClaim,
  type LaunchOfferClaim,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
const _inMemoryLaunchClaims: LaunchOfferClaim[] = [];

export type LaunchOfferCampaignKey =
  | "yearly_50_first_100"
  | "yearly_25_next_100"
  | "yearly_10_next_100"
  | "monthly_10_next_200";

const LAUNCH_CAMPAIGN_ORDER: LaunchOfferCampaignKey[] = [
  "yearly_50_first_100",
  "yearly_25_next_100",
  "yearly_10_next_100",
  "monthly_10_next_200",
];

const LAUNCH_CAMPAIGN_LIMITS: Record<LaunchOfferCampaignKey, number> = {
  yearly_50_first_100: 100,
  yearly_25_next_100: 100,
  yearly_10_next_100: 100,
  monthly_10_next_200: 200,
};

export function __resetLaunchOfferClaimsForTests(): void {
  _inMemoryLaunchClaims.length = 0;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER FUNCTIONS
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// FAVORITES FUNCTIONS
// ============================================

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(favorites).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
}

export async function addFavorite(data: InsertFavorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(favorites).values(data);
  
  // Update user stats
  await incrementFavoritesCount(data.userId);
  
  return (result as any)[0]?.insertId ?? 0;
}

export async function removeFavorite(favoriteId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(favorites).where(eq(favorites.id, favoriteId));
  
  // Update user stats
  await decrementFavoritesCount(userId);
}

// ============================================
// USER STATS FUNCTIONS
// ============================================

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);
  
  if (result.length === 0) {
    // Create default stats
    await db.insert(userStats).values({
      userId,
      totalTryOns: 0,
      favoritesCount: 0,
    });
    return {
      userId,
      totalTryOns: 0,
      favoritesCount: 0,
      lastTryOnDate: null,
    };
  }
  
  return result[0];
}

export async function incrementTryOnCount(userId: number) {
  const db = await getDb();
  if (!db) return;

  const stats = await getUserStats(userId);
  if (stats) {
    await db.update(userStats).set({
      totalTryOns: (stats.totalTryOns || 0) + 1,
      lastTryOnDate: new Date(),
    }).where(eq(userStats.userId, userId));
  }
}

export async function incrementFavoritesCount(userId: number) {
  const db = await getDb();
  if (!db) return;

  const stats = await getUserStats(userId);
  if (stats) {
    await db.update(userStats).set({
      favoritesCount: (stats.favoritesCount || 0) + 1,
    }).where(eq(userStats.userId, userId));
  }
}

export async function decrementFavoritesCount(userId: number) {
  const db = await getDb();
  if (!db) return;

  const stats = await getUserStats(userId);
  if (stats && stats.favoritesCount > 0) {
    await db.update(userStats).set({
      favoritesCount: stats.favoritesCount - 1,
    }).where(eq(userStats.userId, userId));
  }
}

// ============================================
// CREATORS FUNCTIONS
// ============================================

export async function getActiveCreators() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(creators).where(eq(creators.isActive, true));
}

export async function getCreatorById(creatorId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(creators).where(eq(creators.id, creatorId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCreator(data: InsertCreator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(creators).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

// ============================================
// CREATOR JEWELRY FUNCTIONS
// ============================================

export async function getCreatorJewelry(creatorId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(creatorJewelry).where(eq(creatorJewelry.creatorId, creatorId));
}

export async function getAvailableJewelry() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(creatorJewelry).where(eq(creatorJewelry.isAvailable, true));
}

// ============================================
// USER JEWELRY COLLECTION FUNCTIONS
// ============================================

export async function getUserCollection(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(jewelryCollection).where(eq(jewelryCollection.userId, userId)).orderBy(desc(jewelryCollection.createdAt));
}

export async function addToCollection(data: InsertJewelryItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(jewelryCollection).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function removeFromCollection(itemId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(jewelryCollection).where(
    and(eq(jewelryCollection.id, itemId), eq(jewelryCollection.userId, userId))
  );
}

export async function updateCollectionItem(itemId: number, userId: number, data: Partial<InsertJewelryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(jewelryCollection).set(data).where(
    and(eq(jewelryCollection.id, itemId), eq(jewelryCollection.userId, userId))
  );
}

// ============================================
// SEED DATA FUNCTION
// ============================================

// ============================================
// BODY PARTS FUNCTIONS
// ============================================

export async function getDemoBodyParts() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bodyParts).where(eq(bodyParts.isDemo, true));
}

// All body part types
type BodyPartType = "face" | "neck" | "bust_with_hands" | "left_ear_profile" | "right_ear_profile" | "left_wrist" | "right_wrist" | "left_hand" | "right_hand" | "left_ankle" | "right_ankle" | "full_body" | "earrings" | "ring" | "wrist" | "foot" | "full";

export async function getBodyPartsByType(type: BodyPartType) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bodyParts).where(eq(bodyParts.type, type));
}

export async function addBodyPart(data: InsertBodyPart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bodyParts).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function getUserBodyParts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(bodyParts).where(eq(bodyParts.userId, userId));
}

export async function deleteUserBodyPart(bodyPartId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only delete if it belongs to the user (not a demo model)
  await db.delete(bodyParts)
    .where(
      and(
        eq(bodyParts.id, bodyPartId),
        eq(bodyParts.userId, userId)
      )
    );
}

// ============================================
// SEED DATA FUNCTIONS
// ============================================

export async function seedMoniattitude() {
  const db = await getDb();
  if (!db) return;

  // Check if Moniattitude already exists
  const existing = await db.select().from(creators).where(eq(creators.name, "Moniattitude")).limit(1);
  
  if (existing.length === 0) {
    await db.insert(creators).values({
      externalId: "6953e38162ea1d9dd0b75f6a",
      name: "Moniattitude",
      description: "bijoux artisanaux! Pièce unique",
      websiteUrl: "https://moniattitude.com",
      contactEmail: "info@moniattitude.com",
      commissionRate: 0,
      tier: "premium",
      isFeatured: true,
      status: "active",
      isPremium: true,
      isActive: true,
    });
    console.log("[Database] Seeded Moniattitude creator with full partnership data");
  } else {
    // Update existing record with new fields if needed
    await db.update(creators)
      .set({
        externalId: "6953e38162ea1d9dd0b75f6a",
        contactEmail: "info@moniattitude.com",
        tier: "premium",
        isFeatured: true,
        status: "active",
      })
      .where(eq(creators.name, "Moniattitude"));
    console.log("[Database] Updated Moniattitude with partnership data");
  }
}

export async function seedBodyParts() {
  const db = await getDb();
  if (!db) return;

  // Check if body parts already exist
  const existing = await db.select().from(bodyParts).limit(1);
  
  if (existing.length === 0) {
    const demoBodyParts: InsertBodyPart[] = [
      {
        externalId: "02286db2-5174-4979-9035-0c8653e3a75f",
        name: "Modèle Cou 1",
        type: "neck",
        imageUrl: "https://drive.google.com/uc?export=view&id=",
        isDemo: true,
      },
      {
        externalId: "0b9f801c-ef00-42bf-adcb-b396f9084a0f",
        name: "Bague Gauche",
        type: "ring",
        imageUrl: "https://drive.google.com/uc?export=view&id=13O0T-bzBDjYDmuTUbDapOgnFVAyIKe6H",
        isDemo: true,
      },
      {
        externalId: "1dacaea1-1bd2-4c04-b36c-97e127bf65a3",
        name: "Poignet Gauche",
        type: "wrist",
        imageUrl: "https://drive.google.com/uc?export=view&id=1IGdrDuEVNY5gBjoxqDtT0DRNu3nNZMRb",
        isDemo: true,
      },
      {
        externalId: "2d759e34-c04c-4d06-80f5-03911b0bb6c6",
        name: "Poignet Droit",
        type: "wrist",
        imageUrl: "https://drive.google.com/uc?export=view&id=1tdvr_EB22GdAHZfqpzOifclsNjsK5Yd4",
        isDemo: true,
      },
      {
        externalId: "3ccb7bb9-dd70-47b6-862b-be6d8e1c30d7",
        name: "Boucles d'oreilles 2",
        type: "earrings",
        imageUrl: "https://drive.google.com/uc?export=view&id=1B4DQFtmgRYucdG-YLPmrHFF6LmR075A6",
        isDemo: true,
      },
      {
        externalId: "5f87b140-69ee-4d09-835d-b60e73626ff5",
        name: "Parure Entière",
        type: "full",
        imageUrl: "https://drive.google.com/uc?export=view&id=12JHKy5atX8UEjsAFGgpzMCMx0iYFb4fa",
        isDemo: true,
      },
      {
        externalId: "6852d56d-5e39-42a4-b1b5-5a4e4f652e47",
        name: "Boucles d'oreilles 1",
        type: "earrings",
        imageUrl: "https://drive.google.com/uc?export=view&id=14s7VkHMk3GIkuwD1o1okdkSqNwiKFG_3",
        isDemo: true,
      },
      {
        externalId: "6890ba14-4507-4d33-a85d-aa9fffbd8e9b",
        name: "Bague Droite",
        type: "ring",
        imageUrl: "https://drive.google.com/uc?export=view&id=1joQw1bS_orF9EyQ5KieQwRPopPuHv_mG",
        isDemo: true,
      },
      {
        externalId: "f536ef8f-96aa-4b27-848a-e70767c7da46",
        name: "Chevillière",
        type: "foot",
        imageUrl: "https://drive.google.com/uc?export=view&id=1pTdVr2wgClGMZUH9PfLl-VBuhXSZ673m",
        isDemo: true,
      },
    ];

    for (const part of demoBodyParts) {
      await db.insert(bodyParts).values(part);
    }
    console.log("[Database] Seeded 9 demo body parts");
  }
}


// ============================================
// WARDROBE ITEMS FUNCTIONS (Mon Dressing)
// ============================================

export async function createWardrobeItem(item: InsertWardrobeItem) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create wardrobe item: database not available");
    return null;
  }

  try {
    const result = await db.insert(wardrobeItems).values(item);
    return { id: Number(result[0].insertId), ...item };
  } catch (error) {
    console.error("[Database] Failed to create wardrobe item:", error);
    throw error;
  }
}

export async function getUserWardrobeItems(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get wardrobe items: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(wardrobeItems)
      .where(eq(wardrobeItems.userId, userId))
      .orderBy(desc(wardrobeItems.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get wardrobe items:", error);
    return [];
  }
}

export async function getWardrobeItemById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get wardrobe item: database not available");
    return null;
  }

  try {
    const results = await db
      .select()
      .from(wardrobeItems)
      .where(and(eq(wardrobeItems.id, id), eq(wardrobeItems.userId, userId)));
    return results[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get wardrobe item:", error);
    return null;
  }
}

export async function updateWardrobeItem(
  id: number,
  userId: number,
  updates: Partial<InsertWardrobeItem>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update wardrobe item: database not available");
    return null;
  }

  try {
    await db
      .update(wardrobeItems)
      .set(updates)
      .where(and(eq(wardrobeItems.id, id), eq(wardrobeItems.userId, userId)));
    return await getWardrobeItemById(id, userId);
  } catch (error) {
    console.error("[Database] Failed to update wardrobe item:", error);
    throw error;
  }
}

export async function deleteWardrobeItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete wardrobe item: database not available");
    return false;
  }

  try {
    await db
      .delete(wardrobeItems)
      .where(and(eq(wardrobeItems.id, id), eq(wardrobeItems.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete wardrobe item:", error);
    return false;
  }
}

export async function searchWardrobeItems(
  userId: number,
  filters: {
    category?: string;
    brand?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot search wardrobe items: database not available");
    return [];
  }

  try {
    const normalize = (value: string) =>
      value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const synonyms: Record<string, string[]> = {
      elegante: ["formal", "elegant", "work", "blazer", "tailleur"],
      pluie: ["rain", "imper", "deperlant", "waterproof"],
      bureau: ["work", "formal", "chemise", "blazer"],
      soiree: ["formal", "party", "robe"],
      hiver: ["winter", "manteau", "laine", "parka"],
      ete: ["summer", "lin", "sandale", "leger"],
    };
    // Get all items for user first, then filter in memory
    // (More complex SQL filtering can be added later)
    const items = await db
      .select()
      .from(wardrobeItems)
      .where(eq(wardrobeItems.userId, userId))
      .orderBy(desc(wardrobeItems.createdAt));

    return items.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.brand && item.brand !== filters.brand) return false;
      if (filters.color && item.color !== filters.color) return false;
      if (filters.minPrice && (item.price || 0) < filters.minPrice) return false;
      if (filters.maxPrice && (item.price || 0) > filters.maxPrice) return false;
      if (filters.search) {
        const searchLower = normalize(filters.search);
        const searchable = normalize(
          `${item.name} ${item.brand ?? ""} ${item.tags ?? ""} ${item.color ?? ""} ${item.category ?? ""} ${item.season ?? ""} ${item.occasion ?? ""}`,
        );
        const tokens = searchLower.split(/\s+/).filter(Boolean);
        const allMatch = tokens.every((token) => {
          if (searchable.includes(token)) return true;
          const expanded = synonyms[token] ?? [];
          return expanded.some((term) => searchable.includes(term));
        });
        if (!allMatch) return false;
      }
      return true;
    });
  } catch (error) {
    console.error("[Database] Failed to search wardrobe items:", error);
    return [];
  }
}

// ============================================
// SAVED LOOKS FUNCTIONS (AI Stylist)
// ============================================

export async function createSavedLook(look: InsertSavedLook) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create saved look: database not available");
    return null;
  }

  try {
    const result = await db.insert(savedLooks).values(look);
    return { id: Number(result[0].insertId), ...look };
  } catch (error) {
    console.error("[Database] Failed to create saved look:", error);
    throw error;
  }
}

export async function getUserSavedLooks(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get saved looks: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(savedLooks)
      .where(eq(savedLooks.userId, userId))
      .orderBy(desc(savedLooks.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get saved looks:", error);
    return [];
  }
}

export async function getSavedLookById(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get saved look: database not available");
    return null;
  }

  try {
    const results = await db
      .select()
      .from(savedLooks)
      .where(and(eq(savedLooks.id, id), eq(savedLooks.userId, userId)));
    return results[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get saved look:", error);
    return null;
  }
}

export async function updateSavedLook(
  id: number,
  userId: number,
  updates: Partial<InsertSavedLook>
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update saved look: database not available");
    return null;
  }

  try {
    await db
      .update(savedLooks)
      .set(updates)
      .where(and(eq(savedLooks.id, id), eq(savedLooks.userId, userId)));
    return await getSavedLookById(id, userId);
  } catch (error) {
    console.error("[Database] Failed to update saved look:", error);
    throw error;
  }
}

export async function deleteSavedLook(id: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete saved look: database not available");
    return false;
  }

  try {
    await db
      .delete(savedLooks)
      .where(and(eq(savedLooks.id, id), eq(savedLooks.userId, userId)));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete saved look:", error);
    return false;
  }
}

// ============================================
// PARTNER BRANDS FUNCTIONS
// ============================================

export async function getPartnerBrands() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner brands: database not available");
    return [];
  }

  try {
    return await db.select().from(partnerBrands).orderBy(desc(partnerBrands.isFeatured));
  } catch (error) {
    console.error("[Database] Failed to get partner brands:", error);
    return [];
  }
}

export async function getFeaturedPartnerBrands() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get featured brands: database not available");
    return [];
  }

  try {
    return await db.select().from(partnerBrands).where(eq(partnerBrands.isFeatured, true));
  } catch (error) {
    console.error("[Database] Failed to get featured brands:", error);
    return [];
  }
}

export async function getPartnerBrandById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner brand: database not available");
    return null;
  }

  try {
    const result = await db.select().from(partnerBrands).where(eq(partnerBrands.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get partner brand:", error);
    return null;
  }
}

export async function getPartnerBrandBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner brand: database not available");
    return null;
  }

  try {
    const result = await db.select().from(partnerBrands).where(eq(partnerBrands.slug, slug)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get partner brand:", error);
    return null;
  }
}

export async function createPartnerBrand(brand: InsertPartnerBrand) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create partner brand: database not available");
    return null;
  }

  try {
    const result = await db.insert(partnerBrands).values(brand);
    const insertId = result[0].insertId;
    return await getPartnerBrandById(insertId);
  } catch (error) {
    console.error("[Database] Failed to create partner brand:", error);
    return null;
  }
}

// ============================================
// PARTNER JEWELRY FUNCTIONS
// ============================================

export async function getPartnerJewelry(filters?: {
  brandId?: number;
  type?: string;
  metalType?: string;
  gemType?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner jewelry: database not available");
    return [];
  }

  try {
    let query = db.select().from(partnerJewelry).where(eq(partnerJewelry.isAvailable, true));
    
    // Note: Complex filtering would need to be done in application layer
    // This is a simplified version
    const results = await query.orderBy(desc(partnerJewelry.createdAt));
    
    // Apply filters in memory for now
    let filtered = results;
    
    if (filters?.brandId) {
      filtered = filtered.filter(j => j.brandId === filters.brandId);
    }
    if (filters?.type) {
      filtered = filtered.filter(j => j.type === filters.type);
    }
    if (filters?.metalType) {
      filtered = filtered.filter(j => j.metalType === filters.metalType);
    }
    if (filters?.gemType) {
      filtered = filtered.filter(j => j.gemType === filters.gemType);
    }
    if (filters?.collection) {
      filtered = filtered.filter(j => j.collection === filters.collection);
    }
    if (filters?.minPrice !== undefined) {
      filtered = filtered.filter(j => (j.priceInCents || 0) >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      filtered = filtered.filter(j => (j.priceInCents || 0) <= filters.maxPrice!);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(j => 
        j.name.toLowerCase().includes(searchLower) ||
        j.description?.toLowerCase().includes(searchLower) ||
        j.tags?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  } catch (error) {
    console.error("[Database] Failed to get partner jewelry:", error);
    return [];
  }
}

export async function getPartnerJewelryById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner jewelry: database not available");
    return null;
  }

  try {
    const result = await db.select().from(partnerJewelry).where(eq(partnerJewelry.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get partner jewelry:", error);
    return null;
  }
}

export async function getPartnerJewelryByBrand(brandId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner jewelry: database not available");
    return [];
  }

  try {
    return await db.select().from(partnerJewelry)
      .where(and(eq(partnerJewelry.brandId, brandId), eq(partnerJewelry.isAvailable, true)))
      .orderBy(desc(partnerJewelry.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get partner jewelry by brand:", error);
    return [];
  }
}

export async function createPartnerJewelry(jewelry: InsertPartnerJewelry) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create partner jewelry: database not available");
    return null;
  }

  try {
    const result = await db.insert(partnerJewelry).values(jewelry);
    const insertId = result[0].insertId;
    return await getPartnerJewelryById(insertId);
  } catch (error) {
    console.error("[Database] Failed to create partner jewelry:", error);
    return null;
  }
}

export async function incrementPartnerJewelryStats(id: number, field: 'viewCount' | 'tryOnCount' | 'clickCount') {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update partner jewelry stats: database not available");
    return;
  }

  try {
    const jewelry = await getPartnerJewelryById(id);
    if (jewelry) {
      const currentValue = jewelry[field] || 0;
      await db.update(partnerJewelry)
        .set({ [field]: currentValue + 1 })
        .where(eq(partnerJewelry.id, id));
    }
  } catch (error) {
    console.error("[Database] Failed to update partner jewelry stats:", error);
  }
}

// ============================================
// PARTNER JEWELRY FAVORITES FUNCTIONS
// ============================================

export async function getPartnerJewelryFavorites(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get partner jewelry favorites: database not available");
    return [];
  }

  try {
    return await db.select().from(partnerJewelryFavorites)
      .where(eq(partnerJewelryFavorites.userId, userId))
      .orderBy(desc(partnerJewelryFavorites.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get partner jewelry favorites:", error);
    return [];
  }
}

export async function addPartnerJewelryFavorite(userId: number, jewelryId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add partner jewelry favorite: database not available");
    return null;
  }

  try {
    // Check if already favorited
    const existing = await db.select().from(partnerJewelryFavorites)
      .where(and(
        eq(partnerJewelryFavorites.userId, userId),
        eq(partnerJewelryFavorites.jewelryId, jewelryId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const result = await db.insert(partnerJewelryFavorites).values({ userId, jewelryId });
    return { id: result[0].insertId, userId, jewelryId, createdAt: new Date() };
  } catch (error) {
    console.error("[Database] Failed to add partner jewelry favorite:", error);
    return null;
  }
}

export async function removePartnerJewelryFavorite(userId: number, jewelryId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove partner jewelry favorite: database not available");
    return false;
  }

  try {
    await db.delete(partnerJewelryFavorites)
      .where(and(
        eq(partnerJewelryFavorites.userId, userId),
        eq(partnerJewelryFavorites.jewelryId, jewelryId)
      ));
    return true;
  } catch (error) {
    console.error("[Database] Failed to remove partner jewelry favorite:", error);
    return false;
  }
}

export async function isPartnerJewelryFavorited(userId: number, jewelryId: number) {
  const db = await getDb();
  if (!db) {
    return false;
  }

  try {
    const result = await db.select().from(partnerJewelryFavorites)
      .where(and(
        eq(partnerJewelryFavorites.userId, userId),
        eq(partnerJewelryFavorites.jewelryId, jewelryId)
      ))
      .limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check partner jewelry favorite:", error);
    return false;
  }
}

// ============================================
// LAUNCH OFFERS FUNCTIONS
// ============================================

export function getLaunchCampaignLimit(campaignKey: LaunchOfferCampaignKey): number {
  return LAUNCH_CAMPAIGN_LIMITS[campaignKey];
}

export function getLaunchCampaignOrder(): LaunchOfferCampaignKey[] {
  return [...LAUNCH_CAMPAIGN_ORDER];
}

export async function getLaunchOfferClaimByClientId(clientId: string): Promise<LaunchOfferClaim | null> {
  const db = await getDb();
  if (!db) {
    return _inMemoryLaunchClaims.find((claim) => claim.clientId === clientId) ?? null;
  }

  try {
    const rows = await db.select().from(launchOfferClaims).where(eq(launchOfferClaims.clientId, clientId)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.warn("[Database] Failed to get launch offer claim by clientId:", error);
    return _inMemoryLaunchClaims.find((claim) => claim.clientId === clientId) ?? null;
  }
}

export async function getLaunchOfferCampaignCounts(): Promise<Record<LaunchOfferCampaignKey, number>> {
  const counts: Record<LaunchOfferCampaignKey, number> = {
    yearly_50_first_100: 0,
    yearly_25_next_100: 0,
    yearly_10_next_100: 0,
    monthly_10_next_200: 0,
  };

  const db = await getDb();
  if (!db) {
    for (const claim of _inMemoryLaunchClaims) {
      counts[claim.campaignKey as LaunchOfferCampaignKey] += 1;
    }
    return counts;
  }

  try {
    const rows = await db.select().from(launchOfferClaims);
    for (const row of rows) {
      counts[row.campaignKey as LaunchOfferCampaignKey] += 1;
    }
    return counts;
  } catch (error) {
    console.warn("[Database] Failed to compute launch offer counts:", error);
    for (const claim of _inMemoryLaunchClaims) {
      counts[claim.campaignKey as LaunchOfferCampaignKey] += 1;
    }
    return counts;
  }
}

export async function getCurrentLaunchCampaign(counts?: Record<LaunchOfferCampaignKey, number>) {
  const campaignCounts = counts ?? await getLaunchOfferCampaignCounts();

  for (const campaignKey of LAUNCH_CAMPAIGN_ORDER) {
    const used = campaignCounts[campaignKey] ?? 0;
    const limit = LAUNCH_CAMPAIGN_LIMITS[campaignKey];
    if (used < limit) {
      return campaignKey;
    }
  }

  return null;
}

export async function claimLaunchOfferForClient(clientId: string): Promise<LaunchOfferClaim | null> {
  const existing = await getLaunchOfferClaimByClientId(clientId);
  if (existing) return existing;

  const counts = await getLaunchOfferCampaignCounts();
  const campaignKey = await getCurrentLaunchCampaign(counts);
  if (!campaignKey) return null;

  const db = await getDb();
  if (!db) {
    const claim: LaunchOfferClaim = {
      id: _inMemoryLaunchClaims.length + 1,
      clientId,
      campaignKey,
      createdAt: new Date(),
    };
    _inMemoryLaunchClaims.push(claim);
    return claim;
  }

  try {
    const payload: InsertLaunchOfferClaim = {
      clientId,
      campaignKey,
    };
    const result = await db.insert(launchOfferClaims).values(payload);
    const insertedId = Number(result[0]?.insertId ?? 0);

    const inserted = await db.select().from(launchOfferClaims).where(eq(launchOfferClaims.id, insertedId)).limit(1);
    return inserted[0] ?? null;
  } catch (error) {
    // Unique conflict means another request likely claimed already for this client.
    const fallback = await getLaunchOfferClaimByClientId(clientId);
    if (fallback) return fallback;
    console.warn("[Database] Failed to claim launch offer:", error);
    return null;
  }
}
