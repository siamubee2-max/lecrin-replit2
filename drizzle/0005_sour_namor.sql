CREATE TABLE `savedLooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`occasion` enum('casual','work','formal','sport','party','all') DEFAULT 'all',
	`season` enum('spring','summer','fall','winter','all') DEFAULT 'all',
	`wardrobeItemIds` text,
	`jewelryItemIds` text,
	`previewImageUrl` text,
	`stylingTips` text,
	`isAiGenerated` boolean DEFAULT false,
	`isFavorite` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedLooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wardrobeItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('tops','bottoms','dresses','outerwear','shoes','bags','accessories','other') NOT NULL,
	`brand` varchar(128),
	`color` varchar(64),
	`secondaryColor` varchar(64),
	`material` varchar(128),
	`size` varchar(32),
	`price` int,
	`imageUrl` text,
	`season` enum('spring','summer','fall','winter','all') DEFAULT 'all',
	`occasion` enum('casual','work','formal','sport','party','all') DEFAULT 'all',
	`isFavorite` boolean DEFAULT false,
	`tags` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wardrobeItems_id` PRIMARY KEY(`id`)
);
