-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailChangeToken` VARCHAR(191) NULL,
    ADD COLUMN `emailChangeTokenExpiry` DATETIME(3) NULL,
    ADD COLUMN `pendingEmail` VARCHAR(191) NULL;
