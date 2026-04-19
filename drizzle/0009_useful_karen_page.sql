CREATE TABLE `communityBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerUserId` int NOT NULL,
	`blockedAuthorName` varchar(255) NOT NULL,
	`blockedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communityReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`reporterUserId` int,
	`reporterName` varchar(255),
	`reason` enum('spam','harassment','hate_speech','nudity_sexual','violence','illegal_content','intellectual_property','misinformation','other') NOT NULL,
	`details` text,
	`status` enum('pending','reviewed','removed','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `communityReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `communityPosts` ADD `isHidden` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `communityPosts` ADD `reportCount` int DEFAULT 0 NOT NULL;