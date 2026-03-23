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
  /** Subscription tier: free, basic, premium, yearly, lifetime */
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "basic", "premium", "yearly", "lifetime"]).default("free").notNull(),
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
 * Body parts for virtual try-on (demo models and user uploads)
 */
export const bodyParts = mysqlTable("bodyParts", {
  id: int("id").autoincrement().primaryKey(),
  /** UUID from Supabase import */
  externalId: varchar("externalId", { length: 64 }).unique(),
  /** Display name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Body part type */
  type: mysqlEnum("type", [
    "face", "neck", "bust_with_hands",
    "left_ear_profile", "right_ear_profile",
    "left_wrist", "right_wrist",
    "left_hand", "right_hand",
    "left_ankle", "right_ankle",
    "full_body",
    "earrings", "ring", "wrist", "foot", "full"
  ]).notNull(),
  /** Image URL */
  imageUrl: text("imageUrl").notNull(),
  /** Optional user ID if user-uploaded (null for demo models) */
  userId: int("userId"),
  /** Is this a demo model (available to all users) */
  isDemo: boolean("isDemo").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BodyPart = typeof bodyParts.$inferSelect;
export type InsertBodyPart = typeof bodyParts.$inferInsert;

/**
 * Wardrobe items (Mon Dressing) - User's clothing collection
 */
export const wardrobeItems = mysqlTable("wardrobeItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", [
    "tops", "bottoms", "dresses", "outerwear",
    "shoes", "bags", "accessories", "other"
  ]).notNull(),
  brand: varchar("brand", { length: 128 }),
  color: varchar("color", { length: 64 }),
  secondaryColor: varchar("secondaryColor", { length: 64 }),
  material: varchar("material", { length: 128 }),
  size: varchar("size", { length: 32 }),
  price: int("price"),
  imageUrl: text("imageUrl"),
  season: mysqlEnum("season", ["spring", "summer", "fall", "winter", "all"]).default("all"),
  occasion: mysqlEnum("occasion", ["casual", "work", "formal", "sport", "party", "all"]).default("all"),
  isFavorite: boolean("isFavorite").default(false),
  tags: text("tags"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WardrobeItem = typeof wardrobeItems.$inferSelect;
export type InsertWardrobeItem = typeof wardrobeItems.$inferInsert;

/**
 * Saved looks (AI Stylist suggestions)
 */
export const savedLooks = mysqlTable("savedLooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  occasion: mysqlEnum("occasion", ["casual", "work", "formal", "sport", "party", "all"]).default("all"),
  season: mysqlEnum("season", ["spring", "summer", "fall", "winter", "all"]).default("all"),
  wardrobeItemIds: text("wardrobeItemIds"),
  jewelryItemIds: text("jewelryItemIds"),
  previewImageUrl: text("previewImageUrl"),
  stylingTips: text("stylingTips"),
  isAiGenerated: boolean("isAiGenerated").default(false),
  isFavorite: boolean("isFavorite").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedLook = typeof savedLooks.$inferSelect;
export type InsertSavedLook = typeof savedLooks.$inferInsert;

/**
 * Partner brands - stores brand information for the boutique
 */
export const partnerBrands = mysqlTable("partnerBrands", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  logoUrl: text("logoUrl"),
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  isPremium: boolean("isPremium").default(false),
  isFeatured: boolean("isFeatured").default(false),
  specialty: varchar("specialty", { length: 255 }),
  country: varchar("country", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerBrand = typeof partnerBrands.$inferSelect;
export type InsertPartnerBrand = typeof partnerBrands.$inferInsert;

/**
 * Partner jewelry items - bijoux from partner brands
 */
export const partnerJewelry = mysqlTable("partnerJewelry", {
  id: int("id").autoincrement().primaryKey(),
  brandId: int("brandId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["necklace", "earrings", "ring", "bracelet", "anklet", "brooch", "set"]).notNull(),
  description: text("description"),
  priceInCents: int("priceInCents"),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  imageUrl: text("imageUrl"),
  additionalImages: text("additionalImages"),
  productUrl: varchar("productUrl", { length: 512 }),
  metalType: mysqlEnum("metalType", ["gold", "silver", "rose_gold", "platinum", "brass", "copper", "resin", "polymer", "other"]),
  gemType: mysqlEnum("gemType", ["diamond", "ruby", "sapphire", "emerald", "pearl", "crystal", "none", "other"]),
  collection: varchar("collection", { length: 128 }),
  tags: text("tags"),
  isAvailable: boolean("isAvailable").default(true),
  isTryOnEnabled: boolean("isTryOnEnabled").default(true),
  tryOnImageUrl: text("tryOnImageUrl"),
  viewCount: int("viewCount").default(0),
  tryOnCount: int("tryOnCount").default(0),
  clickCount: int("clickCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PartnerJewelry = typeof partnerJewelry.$inferSelect;
export type InsertPartnerJewelry = typeof partnerJewelry.$inferInsert;

/**
 * Partner jewelry favorites - tracks user favorites for partner jewelry
 */
export const partnerJewelryFavorites = mysqlTable("partnerJewelryFavorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  jewelryId: int("jewelryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerJewelryFavorite = typeof partnerJewelryFavorites.$inferSelect;
export type InsertPartnerJewelryFavorite = typeof partnerJewelryFavorites.$inferInsert;

/**
 * Partner applications - candidatures pour devenir partenaire
 */
export const partnerApplications = mysqlTable("partnerApplications", {
  id: int("id").autoincrement().primaryKey(),
  /** Brand / creator name */
  brandName: varchar("brandName", { length: 255 }).notNull(),
  /** Contact person name */
  contactName: varchar("contactName", { length: 255 }).notNull(),
  /** Contact email */
  email: varchar("email", { length: 320 }).notNull(),
  /** Website or Instagram URL */
  websiteUrl: varchar("websiteUrl", { length: 512 }),
  /** Jewelry types offered (comma-separated) */
  jewelryTypes: text("jewelryTypes"),
  /** Price range */
  priceRange: varchar("priceRange", { length: 128 }),
  /** Message / description */
  message: text("message"),
  /** Application status */
  status: varchar("status", { length: 32 }).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PartnerApplication = typeof partnerApplications.$inferSelect;
export type InsertPartnerApplication = typeof partnerApplications.$inferInsert;

/**
 * Community posts - publications de la communauté
 */
export const communityPosts = mysqlTable("communityPosts", {
  id: int("id").autoincrement().primaryKey(),
  /** Author user ID (null for anonymous/demo posts) */
  userId: int("userId"),
  /** Author display name */
  authorName: varchar("authorName", { length: 255 }).notNull(),
  /** Author avatar URL */
  authorAvatar: text("authorAvatar"),
  /** Post content text */
  content: text("content").notNull(),
  /** Main image URL */
  imageUrl: text("imageUrl"),
  /** Jewelry type tag */
  jewelryType: varchar("jewelryType", { length: 64 }),
  /** Number of likes */
  likesCount: int("likesCount").default(0).notNull(),
  /** Number of comments */
  commentsCount: int("commentsCount").default(0).notNull(),
  /** Is pinned (featured) */
  isPinned: boolean("isPinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;

/**
 * Community post likes
 */
export const communityPostLikes = mysqlTable("communityPostLikes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommunityPostLike = typeof communityPostLikes.$inferSelect;
export type InsertCommunityPostLike = typeof communityPostLikes.$inferInsert;
