-- AlterTable
ALTER TABLE `Profile` ADD COLUMN `countryId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
