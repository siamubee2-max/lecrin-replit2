-- Migration initiale -- generee depuis drizzle/schema.ts le 2026-04-14
-- Dialecte: MySQL
-- 15 tables
-- Pour regenerer avec meta Drizzle: npx drizzle-kit generate --name=initial

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NOT NULL UNIQUE,
  `name` TEXT,
  `email` VARCHAR(320),
  `loginMethod` VARCHAR(64),
  `role` ENUM['user', 'admin'] NOT NULL DEFAULT 'user',
  `subscriptionTier` ENUM['free', 'basic', 'premium', 'yearly'] NOT NULL DEFAULT 'free',
  `language` VARCHAR(5) DEFAULT 'fr',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `jewelryType` VARCHAR(64) NOT NULL,
  `jewelryIcon` VARCHAR(16),
  `modelName` VARCHAR(128),
  `imageUri` TEXT,
  `jewelryItemId` INT,
  `creatorId` INT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `userStats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL UNIQUE,
  `totalTryOns` INT NOT NULL DEFAULT 0,
  `favoritesCount` INT NOT NULL DEFAULT 0,
  `lastTryOnDate` TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jewelryCollection` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `metal` VARCHAR(64),
  `gem` VARCHAR(64),
  `brand` VARCHAR(128),
  `collection` VARCHAR(128),
  `price` INT,
  `imageUri` TEXT,
  `tags` TEXT,
  `isFavorite` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `creators` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `externalId` VARCHAR(64) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `websiteUrl` VARCHAR(512),
  `logoUri` TEXT,
  `contactEmail` VARCHAR(320),
  `commissionRate` INT DEFAULT 0,
  `tier` ENUM['standard', 'premium', 'exclusive'] DEFAULT 'standard',
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `status` ENUM['active', 'inactive', 'pending'] DEFAULT 'active',
  `contractStart` TIMESTAMP,
  `contractEnd` TIMESTAMP,
  `isPremium` BOOLEAN DEFAULT FALSE,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `creatorJewelry` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creatorId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `description` TEXT,
  `price` INT,
  `imageUri` TEXT,
  `productUrl` VARCHAR(512),
  `isAvailable` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bodyParts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `externalId` VARCHAR(64) UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `type` TEXT,
  `imageUrl` TEXT NOT NULL,
  `userId` INT,
  `isDemo` BOOLEAN DEFAULT TRUE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `wardrobeItems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` TEXT,
  `brand` VARCHAR(128),
  `color` VARCHAR(64),
  `secondaryColor` VARCHAR(64),
  `material` VARCHAR(128),
  `size` VARCHAR(32),
  `price` INT,
  `imageUrl` TEXT,
  `season` ENUM['spring', 'summer', 'fall', 'winter', 'all'] DEFAULT 'all',
  `occasion` ENUM['casual', 'work', 'formal', 'sport', 'party', 'all'] DEFAULT 'all',
  `isFavorite` BOOLEAN DEFAULT FALSE,
  `tags` TEXT,
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `savedLooks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `occasion` ENUM['casual', 'work', 'formal', 'sport', 'party', 'all'] DEFAULT 'all',
  `season` ENUM['spring', 'summer', 'fall', 'winter', 'all'] DEFAULT 'all',
  `wardrobeItemIds` TEXT,
  `jewelryItemIds` TEXT,
  `previewImageUrl` TEXT,
  `stylingTips` TEXT,
  `isAiGenerated` BOOLEAN DEFAULT FALSE,
  `isFavorite` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partnerBrands` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(128) NOT NULL UNIQUE,
  `description` TEXT,
  `logoUrl` TEXT,
  `websiteUrl` VARCHAR(512),
  `isPremium` BOOLEAN DEFAULT FALSE,
  `isFeatured` BOOLEAN DEFAULT FALSE,
  `specialty` VARCHAR(255),
  `country` VARCHAR(64),
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partnerJewelry` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `brandId` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM['necklace', 'earrings', 'ring', 'bracelet', 'anklet', 'brooch', 'set'] NOT NULL,
  `description` TEXT,
  `priceInCents` INT,
  `currency` VARCHAR(3) DEFAULT 'EUR',
  `imageUrl` TEXT,
  `additionalImages` TEXT,
  `productUrl` VARCHAR(512),
  `metalType` ENUM['gold', 'silver', 'rose_gold', 'platinum', 'brass', 'copper', 'resin', 'polymer', 'other'],
  `gemType` ENUM['diamond', 'ruby', 'sapphire', 'emerald', 'pearl', 'crystal', 'none', 'other'],
  `collection` VARCHAR(128),
  `tags` TEXT,
  `isAvailable` BOOLEAN DEFAULT TRUE,
  `isTryOnEnabled` BOOLEAN DEFAULT TRUE,
  `tryOnImageUrl` TEXT,
  `viewCount` INT DEFAULT 0,
  `tryOnCount` INT DEFAULT 0,
  `clickCount` INT DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partnerJewelryFavorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `jewelryId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partnerApplications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `brandName` VARCHAR(255) NOT NULL,
  `contactName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `websiteUrl` VARCHAR(512),
  `jewelryTypes` TEXT,
  `priceRange` VARCHAR(128),
  `message` TEXT,
  `status` VARCHAR(32) DEFAULT 'pending',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `communityPosts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT,
  `authorName` VARCHAR(255) NOT NULL,
  `authorAvatar` TEXT,
  `content` TEXT NOT NULL,
  `imageUrl` TEXT,
  `jewelryType` VARCHAR(64),
  `likesCount` INT NOT NULL DEFAULT 0,
  `commentsCount` INT NOT NULL DEFAULT 0,
  `isPinned` BOOLEAN DEFAULT FALSE,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `communityPostLikes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `postId` INT NOT NULL,
  `userId` INT NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
