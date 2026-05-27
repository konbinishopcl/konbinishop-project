-- ── A) DDL — crear tablas nuevas ──

-- CreateTable
CREATE TABLE `event_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `pricePerDay` INTEGER NOT NULL DEFAULT 1000,
    `icon` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `minDays` INTEGER NOT NULL DEFAULT 1,
    `maxDays` INTEGER NOT NULL DEFAULT 30,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `event_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `event_tags_name_key`(`name`),
    UNIQUE INDEX `event_tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `article_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `article_tags_name_key`(`name`),
    UNIQUE INDEX `article_tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArticleToArticleTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArticleToArticleTag_AB_unique`(`A`, `B`),
    INDEX `_ArticleToArticleTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EventToEventTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_EventToEventTag_AB_unique`(`A`, `B`),
    INDEX `_EventToEventTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── B) DDL — añadir columnas nullable a Event/Hero/Article ──

-- AlterTable
ALTER TABLE `Article` ADD COLUMN `articleCategoryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Event` ADD COLUMN `eventCategoryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Hero` ADD COLUMN `eventCategoryId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Article_articleCategoryId_idx` ON `Article`(`articleCategoryId`);

-- CreateIndex
CREATE INDEX `Event_eventCategoryId_idx` ON `Event`(`eventCategoryId`);

-- CreateIndex
CREATE INDEX `Hero_eventCategoryId_idx` ON `Hero`(`eventCategoryId`);

-- ── C) DML — copiar datos de tablas viejas a nuevas PRESERVANDO IDs ──
--    Antes de los AddForeignKey, así si fallan los datos podemos diagnosticar
--    sin tener constraints rotos.

INSERT INTO `event_categories` (`id`, `name`, `slug`, `description`, `pricePerDay`, `icon`, `color`, `minDays`, `maxDays`, `order`, `createdAt`, `updatedAt`)
SELECT `id`, `name`, `slug`, `description`, `pricePerDay`, `icon`, `color`, `minDays`, `maxDays`, `order`, `createdAt`, `updatedAt`
FROM `Category`;

INSERT INTO `article_tags` (`id`, `name`, `slug`, `createdAt`, `updatedAt`)
SELECT `id`, `name`, `slug`, `createdAt`, `updatedAt`
FROM `Tag`;

-- Copia la join table implícita Article↔Tag → Article↔ArticleTag.
-- Las columnas A y B preservan los mismos IDs porque Tag.id se copió 1:1 a ArticleTag.id.
INSERT INTO `_ArticleToArticleTag` (`A`, `B`)
SELECT `A`, `B`
FROM `_ArticleToTag`;

-- Backfill Event.eventCategoryId desde Event.categoryId (mismo valor — IDs preservados arriba).
UPDATE `Event`
SET `eventCategoryId` = `categoryId`
WHERE `categoryId` IS NOT NULL;

-- Backfill Hero.eventCategoryId desde Hero.categoryId (decisión locked: Hero reutiliza EventCategory).
UPDATE `Hero`
SET `eventCategoryId` = `categoryId`
WHERE `categoryId` IS NOT NULL;

-- ── D) Constraints / FKs nuevas ──

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_articleCategoryId_fkey` FOREIGN KEY (`articleCategoryId`) REFERENCES `article_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Hero` ADD CONSTRAINT `Hero_eventCategoryId_fkey` FOREIGN KEY (`eventCategoryId`) REFERENCES `event_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_eventCategoryId_fkey` FOREIGN KEY (`eventCategoryId`) REFERENCES `event_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArticleToArticleTag` ADD CONSTRAINT `_ArticleToArticleTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArticleToArticleTag` ADD CONSTRAINT `_ArticleToArticleTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `article_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventToEventTag` ADD CONSTRAINT `_EventToEventTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EventToEventTag` ADD CONSTRAINT `_EventToEventTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `event_tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
