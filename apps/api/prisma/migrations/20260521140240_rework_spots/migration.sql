/*
  Warnings:

  - You are about to drop the column `link` on the `Spot` table. All the data in the column will be lost.
  - Added the required column `linkType` to the `Spot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkValue` to the `Spot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Spot` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `Spot` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SpotLinkType" AS ENUM ('URL', 'PHONE', 'EMAIL');

-- AlterTable
ALTER TABLE "Spot" DROP COLUMN "link",
ADD COLUMN     "linkType" "SpotLinkType" NOT NULL,
ADD COLUMN     "linkValue" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL,
ALTER COLUMN "title" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Spot_userId_idx" ON "Spot"("userId");

-- AddForeignKey
ALTER TABLE "Spot" ADD CONSTRAINT "Spot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
