-- Add unique constraint on communityPostLikes to prevent duplicate likes
CREATE UNIQUE INDEX `idx_post_user_unique` ON `communityPostLikes` (`postId`, `userId`);
--> statement-breakpoint
-- Add 'lifetime' to subscriptionTier enum
ALTER TABLE `users`
MODIFY COLUMN `subscriptionTier` enum('free', 'basic', 'premium', 'yearly', 'lifetime') NOT NULL DEFAULT 'free';