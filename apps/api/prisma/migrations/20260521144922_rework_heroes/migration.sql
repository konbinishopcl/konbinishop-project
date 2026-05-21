/*
  Warnings:

  - You are about to drop the column `address` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `addressNumber` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `communeId` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `desktopImage` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `mobileImage` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `regionId` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `tabletImage` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `Hero` table. All the data in the column will be lost.
  - You are about to drop the `_CategoryToHero` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `Hero` table without a default value. This is not possible if the table is not empty.
  - Added the required column `days` to the `Hero` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Hero` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkType` to the `Hero` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkValue` to the `Hero` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Hero` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Hero" DROP CONSTRAINT "Hero_communeId_fkey";

-- DropForeignKey
ALTER TABLE "Hero" DROP CONSTRAINT "Hero_regionId_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToHero" DROP CONSTRAINT "_CategoryToHero_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToHero" DROP CONSTRAINT "_CategoryToHero_B_fkey";

-- DropIndex
DROP INDEX "Hero_communeId_idx";

-- DropIndex
DROP INDEX "Hero_regionId_idx";

-- DropIndex
DROP INDEX "Hero_slug_key";

-- AlterTable
ALTER TABLE "Hero" DROP COLUMN "address",
DROP COLUMN "addressNumber",
DROP COLUMN "communeId",
DROP COLUMN "desktopImage",
DROP COLUMN "link",
DROP COLUMN "mobileImage",
DROP COLUMN "regionId",
DROP COLUMN "slug",
DROP COLUMN "tabletImage",
DROP COLUMN "thumbnail",
DROP COLUMN "venue",
ADD COLUMN     "amount" INTEGER NOT NULL,
ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "days" INTEGER NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "lead" TEXT,
ADD COLUMN     "linkType" "SpotLinkType" NOT NULL,
ADD COLUMN     "linkValue" TEXT NOT NULL,
ADD COLUMN     "place" TEXT,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "date" DROP NOT NULL;

-- DropTable
DROP TABLE "_CategoryToHero";

-- CreateIndex
CREATE INDEX "Hero_userId_idx" ON "Hero"("userId");

-- CreateIndex
CREATE INDEX "Hero_categoryId_idx" ON "Hero"("categoryId");

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hero" ADD CONSTRAINT "Hero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
