-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIJO', 'DESDE', 'COTIZAR');

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "priceType" "PriceType" NOT NULL DEFAULT 'FIJO';
