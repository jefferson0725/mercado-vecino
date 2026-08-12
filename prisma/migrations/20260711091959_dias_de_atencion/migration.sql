-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO');

-- AlterTable
ALTER TABLE "business" ADD COLUMN     "openDays" "Weekday"[] DEFAULT ARRAY[]::"Weekday"[];
