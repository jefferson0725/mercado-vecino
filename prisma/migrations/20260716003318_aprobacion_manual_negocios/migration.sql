-- AlterTable
ALTER TABLE "business" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false;

-- Los negocios que ya existían se registraron antes del flujo de aprobación:
-- quedan aprobados para no desaparecer del catálogo.
UPDATE "business" SET "approved" = true;
