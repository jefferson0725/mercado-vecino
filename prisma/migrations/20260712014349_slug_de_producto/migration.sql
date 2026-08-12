-- Step 1: Add the column as nullable to allow backfill
ALTER TABLE "product" ADD COLUMN "slug" TEXT;

-- Step 2: Backfill from name (tildes -> ascii, non-alphanumerics -> '-'),
-- deduplicated per business with a numeric suffix
WITH base AS (
  SELECT
    id,
    "businessId",
    COALESCE(
      NULLIF(
        trim(BOTH '-' FROM regexp_replace(
          lower(translate(name, 'áéíóúüñ', 'aeiouun')),
          '[^a-z0-9]+', '-', 'g'
        )),
      ''),
      'producto'
    ) AS b
  FROM "product"
),
numbered AS (
  SELECT
    id,
    b,
    row_number() OVER (PARTITION BY "businessId", b ORDER BY id) AS rn
  FROM base
)
UPDATE "product" p
SET "slug" = CASE WHEN n.rn = 1 THEN n.b ELSE n.b || '-' || n.rn END
FROM numbered n
WHERE n.id = p.id;

-- Step 3: Now enforce NOT NULL
ALTER TABLE "product" ALTER COLUMN "slug" SET NOT NULL;

-- Step 4: Unique per business (name Prisma expects for @@unique([businessId, slug]))
CREATE UNIQUE INDEX "product_businessId_slug_key" ON "product"("businessId", "slug");
