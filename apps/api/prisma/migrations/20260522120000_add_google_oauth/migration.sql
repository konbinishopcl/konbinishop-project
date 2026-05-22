-- AlterTable: make passwordHash nullable and add googleId
ALTER TABLE `User` MODIFY `passwordHash` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `googleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_googleId_key` ON `User`(`googleId`);
