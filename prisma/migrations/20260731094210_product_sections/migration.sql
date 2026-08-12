-- AlterTable
ALTER TABLE "product" ADD COLUMN     "sectionId" TEXT;

-- CreateTable
CREATE TABLE "product_section" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_section_businessId_sortOrder_idx" ON "product_section"("businessId", "sortOrder");

-- CreateIndex
CREATE INDEX "product_sectionId_idx" ON "product"("sectionId");

-- AddForeignKey
ALTER TABLE "product_section" ADD CONSTRAINT "product_section_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "product_section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
