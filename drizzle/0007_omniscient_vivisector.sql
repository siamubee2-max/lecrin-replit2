CREATE TABLE `partnerApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`websiteUrl` varchar(512),
	`jewelryTypes` text,
	`priceRange` varchar(128),
	`message` text,
	`status` varchar(32) DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `partnerApplications_id` PRIMARY KEY(`id`)
);
