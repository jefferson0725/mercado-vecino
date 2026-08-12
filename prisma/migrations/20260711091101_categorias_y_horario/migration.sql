-- CreateEnum
CREATE TYPE "Category" AS ENUM ('COMIDA_RAPIDA', 'COMIDA_CASERA', 'POSTRES', 'BEBIDAS', 'MERCADO', 'ROPA', 'ACCESORIOS', 'TECNOLOGIA', 'BELLEZA', 'MASCOTAS', 'HOGAR', 'PAPELERIA', 'SERVICIOS', 'OTROS');

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "categories" "Category"[] DEFAULT ARRAY[]::"Category"[],
ADD COLUMN     "closesAt" TEXT,
ADD COLUMN     "opensAt" TEXT;
