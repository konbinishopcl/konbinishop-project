-- CreateTable
CREATE TABLE `Settings` (
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('EVENT_APPROVED', 'EVENT_REJECTED', 'EVENT_BANNED', 'SPOT_APPROVED', 'SPOT_REJECTED', 'SPOT_BANNED', 'HERO_APPROVED', 'HERO_REJECTED', 'HERO_BANNED', 'ARTICLE_APPROVED', 'ARTICLE_REJECTED', 'ARTICLE_BANNED', 'ORG_INVITATION', 'TRANSFER_REQUEST', 'TRANSFER_ACCEPTED', 'TRANSFER_REJECTED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_CANCELLED', 'SYSTEM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NULL,
    `payload` JSON NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NULL,
    `orgId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_read_idx`(`userId`, `read`),
    INDEX `Notification_orgId_read_idx`(`orgId`, `read`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedEvent` (
    `userId` INTEGER NOT NULL,
    `eventId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SavedEvent_userId_idx`(`userId`),
    INDEX `SavedEvent_eventId_idx`(`eventId`),
    UNIQUE INDEX `SavedEvent_userId_eventId_key`(`userId`, `eventId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('ACTIVE', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `userId` INTEGER NULL,
    `orgId` INTEGER NULL,
    `cycleStart` DATETIME(3) NOT NULL,
    `cycleEnd` DATETIME(3) NOT NULL,
    `creditsUsed` INTEGER NOT NULL DEFAULT 0,
    `creditsTotal` INTEGER NOT NULL DEFAULT 10,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subscription_userId_key`(`userId`),
    UNIQUE INDEX `Subscription_orgId_key`(`orgId`),
    INDEX `Subscription_status_idx`(`status`),
    INDEX `Subscription_cycleEnd_idx`(`cycleEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transfer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemType` ENUM('EVENT', 'SPOT', 'HERO', 'ARTICLE') NOT NULL,
    `itemId` INTEGER NOT NULL,
    `fromUserId` INTEGER NOT NULL,
    `toOrgId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'AUTO_ACCEPTED', 'ADMIN_FORCED') NOT NULL DEFAULT 'PENDING',
    `reason` VARCHAR(191) NULL,
    `resolvedBy` INTEGER NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Transfer_toOrgId_status_idx`(`toOrgId`, `status`),
    INDEX `Transfer_fromUserId_idx`(`fromUserId`),
    INDEX `Transfer_itemType_itemId_idx`(`itemType`, `itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedEvent` ADD CONSTRAINT `SavedEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedEvent` ADD CONSTRAINT `SavedEvent_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transfer` ADD CONSTRAINT `Transfer_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transfer` ADD CONSTRAINT `Transfer_toOrgId_fkey` FOREIGN KEY (`toOrgId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
