-- ── A) Create pivot table ──
CREATE TABLE `_ArticleToArticleCategory` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,
    UNIQUE INDEX `_ArticleToArticleCategory_AB_unique`(`A`, `B`),
    INDEX `_ArticleToArticleCategory_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── B) Add FKs for pivot (Prisma requires these) ──
ALTER TABLE `_ArticleToArticleCategory`
  ADD CONSTRAINT `_ArticleToArticleCategory_A_fkey`
  FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `_ArticleToArticleCategory`
  ADD CONSTRAINT `_ArticleToArticleCategory_B_fkey`
  FOREIGN KEY (`B`) REFERENCES `article_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── B.5) Backfill pivot from existing FK data (437 articles have articleCategoryId set) ──
INSERT INTO `_ArticleToArticleCategory` (`A`, `B`)
SELECT `id`, `articleCategoryId`
FROM `Article`
WHERE `articleCategoryId` IS NOT NULL;

-- ── C) Drop the old FK column on Article ──
ALTER TABLE `Article` DROP FOREIGN KEY `Article_articleCategoryId_fkey`;
DROP INDEX `Article_articleCategoryId_idx` ON `Article`;
ALTER TABLE `Article` DROP COLUMN `articleCategoryId`;
