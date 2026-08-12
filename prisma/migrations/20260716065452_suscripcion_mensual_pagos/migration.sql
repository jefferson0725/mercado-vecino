-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WOMPI', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR');

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "paidUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "conjunto" ADD COLUMN     "monthlyPrice" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "wompiTransactionId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_reference_key" ON "payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_wompiTransactionId_key" ON "payment"("wompiTransactionId");

-- CreateIndex
CREATE INDEX "payment_businessId_idx" ON "payment"("businessId");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Transición: los negocios ya aprobados reciben 30 días de vigencia para que
-- nada desaparezca del catálogo al desplegar el cobro de suscripciones.
UPDATE "business" SET "paidUntil" = now() + interval '30 days' WHERE "approved" = true;
