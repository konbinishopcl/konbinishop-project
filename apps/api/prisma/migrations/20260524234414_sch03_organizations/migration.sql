-- CreateTable
CREATE TABLE `OrgMember` (
    `userId` INTEGER NOT NULL,
    `orgId` INTEGER NOT NULL,
    `role` ENUM('OWNER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrgMember_orgId_idx`(`orgId`),
    INDEX `OrgMember_userId_idx`(`userId`),
    UNIQUE INDEX `OrgMember_userId_orgId_key`(`userId`, `orgId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrgInvitation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `orgId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrgInvitation_token_key`(`token`),
    INDEX `OrgInvitation_orgId_idx`(`orgId`),
    INDEX `OrgInvitation_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrgMember` ADD CONSTRAINT `OrgMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgMember` ADD CONSTRAINT `OrgMember_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrgInvitation` ADD CONSTRAINT `OrgInvitation_orgId_fkey` FOREIGN KEY (`orgId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
