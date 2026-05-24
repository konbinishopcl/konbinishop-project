-- AlterTable
ALTER TABLE `Article` ADD COLUMN `status` ENUM('DRAFT', 'PENDING_PAYMENT', 'PENDING_MODERATION', 'APPROVED', 'REJECTED', 'BANNED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `statusReason` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `color` VARCHAR(191) NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL,
    ADD COLUMN `maxDays` INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN `minDays` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `order` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `orgId` INTEGER NULL;

-- AlterTable
ALTER TABLE `OrderItem` ADD COLUMN `articleId` INTEGER NULL,
    MODIFY `type` ENUM('EVENT', 'SPOT', 'HERO', 'ARTICLE') NOT NULL;

-- CreateIndex
CREATE INDEX `Article_userId_idx` ON `Article`(`userId`);

-- CreateIndex
CREATE INDEX `Article_status_idx` ON `Article`(`status`);

-- CreateIndex
CREATE INDEX `Order_orgId_idx` ON `Order`(`orgId`);

-- CreateIndex
CREATE INDEX `OrderItem_articleId_idx` ON `OrderItem`(`articleId`);

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
