ALTER TABLE `creators` ADD `externalId` varchar(64);--> statement-breakpoint
ALTER TABLE `creators` ADD `contactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `creators` ADD `commissionRate` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `creators` ADD `tier` enum('standard','premium','exclusive') DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `creators` ADD `isFeatured` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `creators` ADD `status` enum('active','inactive','pending') DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `creators` ADD `contractStart` timestamp;--> statement-breakpoint
ALTER TABLE `creators` ADD `contractEnd` timestamp;--> statement-breakpoint
ALTER TABLE `creators` ADD CONSTRAINT `creators_externalId_unique` UNIQUE(`externalId`);