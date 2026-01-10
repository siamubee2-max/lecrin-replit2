CREATE TABLE `bodyParts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64),
	`name` varchar(255) NOT NULL,
	`type` enum('neck','earrings','ring','wrist','foot','full') NOT NULL,
	`imageUrl` text NOT NULL,
	`userId` int,
	`isDemo` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bodyParts_id` PRIMARY KEY(`id`),
	CONSTRAINT `bodyParts_externalId_unique` UNIQUE(`externalId`)
);
