CREATE TABLE `creatorJewelry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`description` text,
	`price` int,
	`imageUri` text,
	`productUrl` varchar(512),
	`isAvailable` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatorJewelry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`websiteUrl` varchar(512),
	`logoUri` text,
	`isPremium` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`jewelryType` varchar(64) NOT NULL,
	`jewelryIcon` varchar(16),
	`modelName` varchar(128),
	`imageUri` text,
	`jewelryItemId` int,
	`creatorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jewelryCollection` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`metal` varchar(64),
	`gem` varchar(64),
	`brand` varchar(128),
	`collection` varchar(128),
	`price` int,
	`imageUri` text,
	`tags` text,
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jewelryCollection_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalTryOns` int NOT NULL DEFAULT 0,
	`favoritesCount` int NOT NULL DEFAULT 0,
	`lastTryOnDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStats_id` PRIMARY KEY(`id`),
	CONSTRAINT `userStats_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','basic','premium','yearly') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `language` varchar(5) DEFAULT 'fr';