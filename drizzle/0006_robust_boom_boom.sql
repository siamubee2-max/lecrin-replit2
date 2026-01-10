CREATE TABLE `partnerBrands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`logoUrl` text,
	`websiteUrl` varchar(512),
	`isPremium` boolean DEFAULT false,
	`isFeatured` boolean DEFAULT false,
	`specialty` varchar(255),
	`country` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerBrands_id` PRIMARY KEY(`id`),
	CONSTRAINT `partnerBrands_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `partnerJewelry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('necklace','earrings','ring','bracelet','anklet','brooch','set') NOT NULL,
	`description` text,
	`priceInCents` int,
	`currency` varchar(3) DEFAULT 'EUR',
	`imageUrl` text,
	`additionalImages` text,
	`productUrl` varchar(512),
	`metalType` enum('gold','silver','rose_gold','platinum','brass','copper','resin','polymer','other'),
	`gemType` enum('diamond','ruby','sapphire','emerald','pearl','crystal','none','other'),
	`collection` varchar(128),
	`tags` text,
	`isAvailable` boolean DEFAULT true,
	`isTryOnEnabled` boolean DEFAULT true,
	`tryOnImageUrl` text,
	`viewCount` int DEFAULT 0,
	`tryOnCount` int DEFAULT 0,
	`clickCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerJewelry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerJewelryFavorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jewelryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerJewelryFavorites_id` PRIMARY KEY(`id`)
);
