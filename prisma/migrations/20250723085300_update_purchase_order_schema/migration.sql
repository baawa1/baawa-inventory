/*
  Warnings:

  - The `status` column on the `purchase_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED');

-- AlterTable
ALTER TABLE "purchase_orders" DROP COLUMN "status",
ADD COLUMN     "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "idx_purchase_orders_status" ON "purchase_orders"("status");
