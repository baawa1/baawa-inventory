/*
  Warnings:

  - You are about to drop the column `barcode` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `dimensions` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `max_stock` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `credit_limit` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `payment_terms` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `postal_code` on the `suppliers` table. All the data in the column will be lost.
  - You are about to drop the column `tax_number` on the `suppliers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "idx_suppliers_active";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "barcode",
DROP COLUMN "color",
DROP COLUMN "dimensions",
DROP COLUMN "material",
DROP COLUMN "max_stock",
DROP COLUMN "size",
DROP COLUMN "unit",
DROP COLUMN "weight";

-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "country",
DROP COLUMN "credit_limit",
DROP COLUMN "is_active",
DROP COLUMN "payment_terms",
DROP COLUMN "postal_code",
DROP COLUMN "tax_number";
