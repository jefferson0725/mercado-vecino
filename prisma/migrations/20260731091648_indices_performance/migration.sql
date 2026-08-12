-- CreateIndex
CREATE INDEX "business_active_approved_paidUntil_idx" ON "business"("active", "approved", "paidUntil");

-- CreateIndex
CREATE INDEX "conjunto_active_idx" ON "conjunto"("active");
