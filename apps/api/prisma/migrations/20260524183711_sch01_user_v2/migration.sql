-- SCH-01: User v2 — type, handle, isVerified, twoFactorCode, twoFactorExpiry
-- Adds enum UserType and 5 new nullable/default columns to the User table.
-- All changes are additive (new columns with defaults or nullable) — no data loss.

-- CreateEnum: UserType
ALTER TABLE `User` ADD COLUMN `type` ENUM('PERSON', 'ORGANIZATION') NOT NULL DEFAULT 'PERSON';
ALTER TABLE `User` ADD COLUMN `handle` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `User` ADD COLUMN `twoFactorCode` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `twoFactorExpiry` DATETIME(3) NULL;

-- CreateIndex: unique handle
CREATE UNIQUE INDEX `User_handle_key` ON `User`(`handle`);
