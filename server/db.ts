import { eq, desc } from "drizzle-orm";
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
  InsertJewelryItem
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

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

export async function removeFromCollection(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(jewelryCollection).where(eq(jewelryCollection.id, itemId));
}

export async function updateCollectionItem(itemId: number, data: Partial<InsertJewelryItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(jewelryCollection).set(data).where(eq(jewelryCollection.id, itemId));
}

// ============================================
// SEED DATA FUNCTION
// ============================================

export async function seedMoniattitude() {
  const db = await getDb();
  if (!db) return;

  // Check if Moniattitude already exists
  const existing = await db.select().from(creators).where(eq(creators.name, "Moniattitude")).limit(1);
  
  if (existing.length === 0) {
    await db.insert(creators).values({
      name: "Moniattitude",
      description: "Bijoux artisanaux! Pièce unique",
      websiteUrl: "https://moniattitude.com",
      isPremium: true,
      isActive: true,
    });
    console.log("[Database] Seeded Moniattitude creator");
  }
}
