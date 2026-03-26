CREATE TABLE IF NOT EXISTS `launchOfferClaims` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` varchar(128) NOT NULL,
  `campaignKey` enum('yearly_50_first_100','yearly_25_next_100','yearly_10_next_100','monthly_10_next_200') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `launchOfferClaims_id` PRIMARY KEY(`id`)
);

CREATE UNIQUE INDEX `launchOfferClaims_clientId_unique` ON `launchOfferClaims` (`clientId`);
