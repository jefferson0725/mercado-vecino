-- Agregar columna de array de imágenes
ALTER TABLE "product" ADD COLUMN "imageUrls" TEXT[] NOT NULL DEFAULT '{}';

-- Migrar datos existentes: imageUrl → imageUrls[1]
UPDATE "product" SET "imageUrls" = ARRAY["imageUrl"] WHERE "imageUrl" IS NOT NULL AND "imageUrl" != '';

-- Eliminar columna anterior
ALTER TABLE "product" DROP COLUMN "imageUrl";
