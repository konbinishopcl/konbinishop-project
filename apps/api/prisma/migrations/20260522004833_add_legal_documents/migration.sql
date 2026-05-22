-- CreateTable
CREATE TABLE `LegalDocument` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LegalDocument_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
