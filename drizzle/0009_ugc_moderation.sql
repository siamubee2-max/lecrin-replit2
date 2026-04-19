-- Apple Guideline 1.2 + 5.1.1(x) — UGC moderation
-- Build 21 : signalement, blocage utilisateur, masquage automatique
-- Généré manuellement le 2026-04-20. Régénérable via `pnpm drizzle-kit generate`.

-- 1. Colonnes modération sur communityPosts
ALTER TABLE `communityPosts`
	ADD COLUMN `isHidden` boolean NOT NULL DEFAULT false,
	ADD COLUMN `reportCount` int NOT NULL DEFAULT 0;
--> statement-breakpoint

-- 2. Table des signalements
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
	CONSTRAINT `communityReports_id` PRIMARY KEY(`id`),
	INDEX `communityReports_postId_idx` (`postId`),
	INDEX `communityReports_status_idx` (`status`)
);
--> statement-breakpoint

-- 3. Table des blocages utilisateur
CREATE TABLE `communityBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerUserId` int NOT NULL,
	`blockedAuthorName` varchar(255) NOT NULL,
	`blockedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communityBlocks_id` PRIMARY KEY(`id`),
	INDEX `communityBlocks_blocker_idx` (`blockerUserId`),
	INDEX `communityBlocks_blocked_name_idx` (`blockedAuthorName`)
);
