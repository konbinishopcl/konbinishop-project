-- AlterTable
ALTER TABLE "Hero" DROP COLUMN "linkType",
DROP COLUMN "linkValue",
ADD COLUMN "link" TEXT;
