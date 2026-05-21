-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PENDING_MODERATION', 'APPROVED', 'REJECTED');

-- AlterTable Event: añadir columna status ANTES de borrar los booleanos
ALTER TABLE "Event" ADD COLUMN "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT';

-- Data migration: convertir isApproved/isRejected → status
UPDATE "Event" SET "status" = 'APPROVED'            WHERE "isApproved" = true;
UPDATE "Event" SET "status" = 'REJECTED'            WHERE "isRejected" = true;
UPDATE "Event" SET "status" = 'PENDING_MODERATION'  WHERE "isApproved" = false AND "isRejected" = false;

-- Ahora sí eliminar los booleanos
ALTER TABLE "Event" DROP COLUMN "isApproved",
                    DROP COLUMN "isRejected";

-- AlterTable Hero: status DRAFT para nuevos; los existentes ya activos → APPROVED
ALTER TABLE "Hero" ADD COLUMN "status" "PublicationStatus" NOT NULL DEFAULT 'APPROVED',
                   ALTER COLUMN "expirationDate" DROP NOT NULL,
                   ALTER COLUMN "amount" DROP NOT NULL,
                   ALTER COLUMN "days" DROP NOT NULL;

-- Cambiar default a DRAFT para los nuevos heros
ALTER TABLE "Hero" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable Spot: status APPROVED para los existentes
ALTER TABLE "Spot" ADD COLUMN "status" "PublicationStatus" NOT NULL DEFAULT 'APPROVED',
                   ADD COLUMN "amount" INTEGER,
                   ADD COLUMN "days" INTEGER;

-- Cambiar default a DRAFT para los nuevos spots
ALTER TABLE "Spot" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "heroId" INTEGER,
                        ADD COLUMN "spotId" INTEGER;

-- CreateIndex
CREATE INDEX "OrderItem_spotId_idx" ON "OrderItem"("spotId");
CREATE INDEX "OrderItem_heroId_idx" ON "OrderItem"("heroId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "Hero"("id") ON DELETE SET NULL ON UPDATE CASCADE;
