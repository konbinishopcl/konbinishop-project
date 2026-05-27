-- ── sch09_drop_legacy_taxonomy ──
-- Elimina las tablas legacy Category, Tag, _ArticleToTag
-- y las columnas legacy Event.categoryId, Hero.categoryId.
-- Los datos ya fueron migrados en sch08_split_taxonomies.

-- 1. Eliminar FK de Event → Category
ALTER TABLE `Event` DROP FOREIGN KEY `Event_categoryId_fkey`;

-- 2. Eliminar FK de Hero → Category
ALTER TABLE `Hero` DROP FOREIGN KEY `Hero_categoryId_fkey`;

-- 3. Eliminar FK de Article ↔ Tag (implícita, en _ArticleToTag)
ALTER TABLE `_ArticleToTag` DROP FOREIGN KEY `_ArticleToTag_A_fkey`;
ALTER TABLE `_ArticleToTag` DROP FOREIGN KEY `_ArticleToTag_B_fkey`;

-- 4. Eliminar columna categoryId de Event
--    (el índice Event_categoryId_fkey se elimina automáticamente al eliminar la FK)
ALTER TABLE `Event` DROP COLUMN `categoryId`;

-- 5. Eliminar columna categoryId de Hero (y su índice)
DROP INDEX `Hero_categoryId_idx` ON `Hero`;
ALTER TABLE `Hero` DROP COLUMN `categoryId`;

-- 6. Eliminar tabla join _ArticleToTag
DROP TABLE `_ArticleToTag`;

-- 7. Eliminar tabla Tag (después de eliminar la join table)
DROP TABLE `Tag`;

-- 8. Eliminar tabla Category (después de eliminar las FKs que la referenciaban)
DROP TABLE `Category`;
