-- Step 1: Create the category table
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- Step 2: Unique index on slug
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- Step 3: Create the implicit M2M join table
CREATE TABLE "_BusinessToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Step 4: Unique index and index on join table
CREATE UNIQUE INDEX "_BusinessToCategory_AB_unique" ON "_BusinessToCategory"("A", "B");
CREATE INDEX "_BusinessToCategory_B_index" ON "_BusinessToCategory"("B");

-- Step 5: Insert the 17 categories (id = slug for readability and stability)
INSERT INTO "category" ("id", "name", "slug") VALUES
  ('comida-rapida',  'Comida rápida',               'comida-rapida'),
  ('comida-casera',  'Comida casera',                'comida-casera'),
  ('postres',        'Postres y repostería',         'postres'),
  ('bebidas',        'Bebidas',                      'bebidas'),
  ('mercado',        'Mercado y abarrotes',          'mercado'),
  ('ropa',           'Ropa y calzado',               'ropa'),
  ('accesorios',     'Accesorios',                   'accesorios'),
  ('tecnologia',     'Tecnología',                   'tecnologia'),
  ('belleza',        'Belleza y cuidado personal',   'belleza'),
  ('mascotas',       'Mascotas',                     'mascotas'),
  ('hogar',          'Hogar y decoración',           'hogar'),
  ('papeleria',      'Papelería y detalles',         'papeleria'),
  ('servicios',      'Servicios',                    'servicios'),
  ('otros',          'Otros',                        'otros'),
  ('reparaciones',   'Reparaciones y mantenimiento', 'reparaciones'),
  ('clases',         'Clases y asesorías',           'clases'),
  ('limpieza',       'Limpieza y cuidado',           'limpieza');

-- Step 6: Migrate existing enum data from business.categories array to join table
-- Maps enum value -> slug (which is also the category id)
INSERT INTO "_BusinessToCategory" ("A", "B")
SELECT
    b.id AS "A",
    c.id AS "B"
FROM "business" b
CROSS JOIN LATERAL unnest(b."categories"::text[]) AS enum_val
JOIN "category" c ON c.slug = CASE enum_val
    WHEN 'COMIDA_RAPIDA' THEN 'comida-rapida'
    WHEN 'COMIDA_CASERA' THEN 'comida-casera'
    WHEN 'POSTRES'       THEN 'postres'
    WHEN 'BEBIDAS'       THEN 'bebidas'
    WHEN 'MERCADO'       THEN 'mercado'
    WHEN 'ROPA'          THEN 'ropa'
    WHEN 'ACCESORIOS'    THEN 'accesorios'
    WHEN 'TECNOLOGIA'    THEN 'tecnologia'
    WHEN 'BELLEZA'       THEN 'belleza'
    WHEN 'MASCOTAS'      THEN 'mascotas'
    WHEN 'HOGAR'         THEN 'hogar'
    WHEN 'PAPELERIA'     THEN 'papeleria'
    WHEN 'SERVICIOS'     THEN 'servicios'
    WHEN 'OTROS'         THEN 'otros'
    ELSE NULL
END
WHERE c.id IS NOT NULL;

-- Step 7: Add foreign key constraints to join table
ALTER TABLE "_BusinessToCategory" ADD CONSTRAINT "_BusinessToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BusinessToCategory" ADD CONSTRAINT "_BusinessToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Drop the old enum column and enum type (AFTER data migration)
ALTER TABLE "business" DROP COLUMN "categories";
DROP TYPE "Category";

-- Step 9: Primary key on join table (replaces the unique index), as Prisma expects
ALTER TABLE "_BusinessToCategory" ADD CONSTRAINT "_BusinessToCategory_AB_pkey" PRIMARY KEY ("A", "B");
DROP INDEX "_BusinessToCategory_AB_unique";
