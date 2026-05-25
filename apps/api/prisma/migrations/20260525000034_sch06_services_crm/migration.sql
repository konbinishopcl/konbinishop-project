-- CreateTable
CREATE TABLE `ServiceOption` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('PHOTOGRAPHY', 'CONTENT') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceOption_type_active_idx`(`type`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('PHOTOGRAPHY', 'CONTENT') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `eventName` VARCHAR(191) NULL,
    `eventDate` DATE NULL,
    `eventPlace` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceRequest_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('CONTACT', 'PHOTOGRAPHY', 'CONTENT') NOT NULL,
    `stage` ENUM('NEW', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST') NOT NULL DEFAULT 'NEW',
    `stageReason` VARCHAR(191) NULL,
    `sourceType` ENUM('CONTACT', 'PHOTOGRAPHY', 'CONTENT') NOT NULL,
    `sourceId` INTEGER NOT NULL,
    `contactName` VARCHAR(191) NOT NULL,
    `contactEmail` VARCHAR(191) NOT NULL,
    `assignedTo` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmEntry_stage_type_idx`(`stage`, `type`),
    INDEX `CrmEntry_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `CrmEntry_assignedTo_idx`(`assignedTo`),
    INDEX `CrmEntry_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` TEXT NOT NULL,
    `authorId` INTEGER NULL,
    `crmEntryId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CrmNote_crmEntryId_createdAt_idx`(`crmEntryId`, `createdAt`),
    INDEX `CrmNote_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ServiceOptionToServiceRequest` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ServiceOptionToServiceRequest_AB_unique`(`A`, `B`),
    INDEX `_ServiceOptionToServiceRequest_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CrmNote` ADD CONSTRAINT `CrmNote_crmEntryId_fkey` FOREIGN KEY (`crmEntryId`) REFERENCES `CrmEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ServiceOptionToServiceRequest` ADD CONSTRAINT `_ServiceOptionToServiceRequest_A_fkey` FOREIGN KEY (`A`) REFERENCES `ServiceOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ServiceOptionToServiceRequest` ADD CONSTRAINT `_ServiceOptionToServiceRequest_B_fkey` FOREIGN KEY (`B`) REFERENCES `ServiceRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
