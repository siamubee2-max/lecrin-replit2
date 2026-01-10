import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Subscription tier: free, basic, premium, yearly */
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "basic", "premium", "yearly"]).default("free").notNull(),
  /** Preferred language */
  language: varchar("language", { length: 5 }).default("fr"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User favorites - stores virtual try-on favorites
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Type of jewelry (necklace, earrings, ring, bracelet, brooch) */
  jewelryType: varchar("jewelryType", { length: 64 }).notNull(),
  /** Emoji icon for the jewelry */
  jewelryIcon: varchar("jewelryIcon", { length: 16 }),
  /** Name of the demo model used */
  modelName: varchar("modelName", { length: 128 }),
  /** Optional image URI of the try-on result */
  imageUri: text("imageUri"),
  /** Optional jewelry item ID if from a creator */
  jewelryItemId: int("jewelryItemId"),
  /** Optional creator ID */
  creatorId: int("creatorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * User statistics - tracks usage metrics
 */
export const userStats = mysqlTable("userStats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** Total number of virtual try-ons */
  totalTryOns: int("totalTryOns").default(0).notNull(),
  /** Total number of favorites */
  favoritesCount: int("favoritesCount").default(0).notNull(),
  /** Last try-on date */
  lastTryOnDate: timestamp("lastTryOnDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = typeof userStats.$inferInsert;

/**
 * User jewelry collection (Mon Écrin)
 */
export const jewelryCollection = mysqlTable("jewelryCollection", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Jewelry name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Type of jewelry */
  type: varchar("type", { length: 64 }).notNull(),
  /** Metal type (gold, silver, platinum, etc.) */
  metal: varchar("metal", { length: 64 }),
  /** Gem type if any */
  gem: varchar("gem", { length: 64 }),
  /** Brand name */
  brand: varchar("brand", { length: 128 }),
  /** Collection name */
  collection: varchar("collection", { length: 128 }),
  /** Price in euros */
  price: int("price"),
  /** Image URI */
  imageUri: text("imageUri"),
  /** Tags for search */
  tags: text("tags"),
  /** Is favorite */
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type JewelryItem = typeof jewelryCollection.$inferSelect;
export type InsertJewelryItem = typeof jewelryCollection.$inferInsert;

/**
 * Creators / Brands partners
 */
export const creators = mysqlTable("creators", {
  id: int("id").autoincrement().primaryKey(),
  /** External ID from Supabase/Base44 */
  externalId: varchar("externalId", { length: 64 }).unique(),
  /** Creator/Brand name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Description */
  description: text("description"),
  /** Website URL */
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  /** Logo image URI */
  logoUri: text("logoUri"),
  /** Contact email */
  contactEmail: varchar("contactEmail", { length: 320 }),
  /** Commission rate (percentage) */
  commissionRate: int("commissionRate").default(0),
  /** Partnership tier: standard, premium, exclusive */
  tier: mysqlEnum("tier", ["standard", "premium", "exclusive"]).default("standard"),
  /** Is featured on homepage */
  isFeatured: boolean("isFeatured").default(false),
  /** Status: active, inactive, pending */
  status: mysqlEnum("status", ["active", "inactive", "pending"]).default("active"),
  /** Contract start date */
  contractStart: timestamp("contractStart"),
  /** Contract end date */
  contractEnd: timestamp("contractEnd"),
  /** Is premium partner (legacy, kept for compatibility) */
  isPremium: boolean("isPremium").default(false),
  /** Is active (legacy, kept for compatibility) */
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = typeof creators.$inferInsert;

/**
 * Creator jewelry items (for virtual try-on)
 */
export const creatorJewelry = mysqlTable("creatorJewelry", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creatorId").notNull(),
  /** Jewelry name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Type of jewelry */
  type: varchar("type", { length: 64 }).notNull(),
  /** Description */
  description: text("description"),
  /** Price in euros */
  price: int("price"),
  /** Image URI */
  imageUri: text("imageUri"),
  /** Product URL on creator's website */
  productUrl: varchar("productUrl", { length: 512 }),
  /** Is available for try-on */
  isAvailable: boolean("isAvailable").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CreatorJewelry = typeof creatorJewelry.$inferSelect;
export type InsertCreatorJewelry = typeof creatorJewelry.$inferInsert;

/**
 * Body parts for virtual try-on (demo models)
 * Types: neck (colliers), earrings (boucles d'oreilles), ring (bagues), wrist (bracelets), foot (chevillières), full (parure entière)
 */
export const bodyParts = mysqlTable("bodyParts", {
  id: int("id").autoincrement().primaryKey(),
  /** UUID from Supabase import */
  externalId: varchar("externalId", { length: 64 }).unique(),
  /** Display name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Body part type: neck, earrings, ring, wrist, foot, full */
  type: mysqlEnum("type", ["neck", "earrings", "ring", "wrist", "foot", "full"]).notNull(),
  /** Image URL (Google Drive or other) */
  imageUrl: text("imageUrl").notNull(),
  /** Optional user ID if user-uploaded */
  userId: int("userId"),
  /** Is this a demo model (available to all users) */
  isDemo: boolean("isDemo").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BodyPart = typeof bodyParts.$inferSelect;
export type InsertBodyPart = typeof bodyParts.$inferInsert;
