-- DropForeignKey
ALTER TABLE "sales_items" DROP CONSTRAINT "sales_items_coupon_id_fkey";

-- AlterTable
ALTER TABLE "coupons" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "idx_sales_items_coupon_id" ON "sales_items"("coupon_id");

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
