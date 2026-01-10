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
  InsertBodyPart
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
