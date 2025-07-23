/*
  Warnings:

  - You are about to drop the column `category_id` on the `financial_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `allow_reviews` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `budgets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financial_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `purchase_orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_category_id_fkey";

-- DropForeignKey
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_created_by_fkey";

-- DropForeignKey
ALTER TABLE "financial_categories" DROP CONSTRAINT "financial_categories_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "financial_transactions" DROP CONSTRAINT "financial_transactions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchase_order_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_user_id_fkey";

-- DropIndex
DROP INDEX "idx_financial_transactions_category";

-- AlterTable
ALTER TABLE "financial_transactions" DROP COLUMN "category_id";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "allow_reviews";

-- DropTable
DROP TABLE "budgets";

-- DropTable
DROP TABLE "financial_categories";

-- DropTable
DROP TABLE "purchase_order_items";

-- DropTable
DROP TABLE "purchase_orders";

-- DropEnum
DROP TYPE "BudgetPeriodType";

-- DropEnum
DROP TYPE "PurchaseOrderStatus";
