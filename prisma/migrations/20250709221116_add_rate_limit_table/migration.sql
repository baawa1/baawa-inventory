/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `generatedText` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `ai_content` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `newValues` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `oldValues` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to alter the column `action` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `brands` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `website` on the `brands` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `attributes` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `minStock` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `product_variants` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `product_variants` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `sku` on the `product_variants` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `sku` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `barcode` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `unit` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `dimensions` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `color` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `size` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `material` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - The `status` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `meta_title` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `createdAt` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseOrderId` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `receivedQty` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalCost` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitCost` on the `purchase_order_items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `expectedDate` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderDate` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumber` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `receivedDate` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `purchase_orders` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `purchase_orders` table. All the data in the column will be lost.
  - The `status` column on the `purchase_orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `sales_items` table. All the data in the column will be lost.
  - You are about to drop the column `cashierId` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `customerEmail` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isRefund` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `receiptNumber` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `refundReason` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `syncedAt` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `syncedToWebflow` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `transactionCode` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `sales_transactions` table. All the data in the column will be lost.
  - You are about to alter the column `reference_no` on the `stock_additions` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `createdAt` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `newStock` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `previousStock` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `stock_adjustments` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `stock_reconciliations` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The `status` column on the `stock_reconciliations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `name` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `contact_person` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `email` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `phone` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `city` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `state` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `postal_code` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `country` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `website` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `tax_number` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `payment_terms` on the `suppliers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `notes` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `first_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `last_name` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `email` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `password_hash` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `phone` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `reset_token` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `email_verification_token` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - The `user_status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `webflow_syncs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_number]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transaction_number]` on the table `sales_transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content_type` to the `ai_content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `generated_content` to the `ai_content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `ai_content` table without a default value. This is not possible if the table is not empty.
  - Added the required column `table_name` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `product_variants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_order_id` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity_ordered` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_cost` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_cost` to the `purchase_order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_date` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_number` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplier_id` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `purchase_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_price` to the `sales_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_id` to the `sales_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `sales_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_method` to the `sales_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_amount` to the `sales_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transaction_number` to the `sales_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `sales_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adjustment_type` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `new_quantity` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `old_quantity` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `stock_adjustments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "stock_reconciliation_status" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "ai_content" DROP CONSTRAINT "ai_content_productId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_productId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_order_items" DROP CONSTRAINT "purchase_order_items_purchaseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "sales_items" DROP CONSTRAINT "sales_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "sales_items" DROP CONSTRAINT "sales_items_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "sales_items" DROP CONSTRAINT "sales_items_variantId_fkey";

-- DropForeignKey
ALTER TABLE "sales_transactions" DROP CONSTRAINT "sales_transactions_cashierId_fkey";

-- DropForeignKey
ALTER TABLE "stock_additions" DROP CONSTRAINT "stock_additions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "stock_additions" DROP CONSTRAINT "stock_additions_product_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_additions" DROP CONSTRAINT "stock_additions_supplier_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_productId_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_userId_fkey";

-- DropForeignKey
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_variantId_fkey";

-- DropForeignKey
ALTER TABLE "stock_reconciliation_items" DROP CONSTRAINT "stock_reconciliation_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_reconciliation_items" DROP CONSTRAINT "stock_reconciliation_items_reconciliation_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_reconciliations" DROP CONSTRAINT "stock_reconciliations_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "stock_reconciliations" DROP CONSTRAINT "stock_reconciliations_created_by_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "webflow_syncs" DROP CONSTRAINT "webflow_syncs_productId_fkey";

-- DropIndex
DROP INDEX "product_variants_barcode_key";

-- DropIndex
DROP INDEX "products_barcode_key";

-- DropIndex
DROP INDEX "purchase_orders_orderNumber_key";

-- DropIndex
DROP INDEX "sales_transactions_receiptNumber_key";

-- DropIndex
DROP INDEX "sales_transactions_transactionCode_key";

-- AlterTable
ALTER TABLE "ai_content" DROP COLUMN "approvedAt",
DROP COLUMN "createdAt",
DROP COLUMN "generatedText",
DROP COLUMN "isApproved",
DROP COLUMN "keywords",
DROP COLUMN "productId",
DROP COLUMN "prompt",
DROP COLUMN "status",
DROP COLUMN "tone",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "version",
ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "confidence_score" DECIMAL(3,2),
ADD COLUMN     "content_type" VARCHAR(50) NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "generated_content" TEXT NOT NULL,
ADD COLUMN     "is_approved" BOOLEAN DEFAULT false,
ADD COLUMN     "model_used" VARCHAR(100),
ADD COLUMN     "original_content" TEXT,
ADD COLUMN     "product_id" INTEGER NOT NULL,
ADD COLUMN     "prompt_used" TEXT,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "createdAt",
DROP COLUMN "entityId",
DROP COLUMN "entityType",
DROP COLUMN "ipAddress",
DROP COLUMN "newValues",
DROP COLUMN "oldValues",
DROP COLUMN "transactionId",
DROP COLUMN "userAgent",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ip_address" INET,
ADD COLUMN     "new_values" JSONB,
ADD COLUMN     "old_values" JSONB,
ADD COLUMN     "record_id" INTEGER,
ADD COLUMN     "table_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" INTEGER,
ALTER COLUMN "action" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "brands" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "website" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "is_active" DROP NOT NULL,
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "attributes",
DROP COLUMN "barcode",
DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "minStock",
DROP COLUMN "productId",
DROP COLUMN "stock",
DROP COLUMN "updatedAt",
ADD COLUMN     "color" VARCHAR(100),
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "current_stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dimensions" JSONB,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "material" VARCHAR(100),
ADD COLUMN     "max_stock_level" INTEGER,
ADD COLUMN     "min_stock_level" INTEGER DEFAULT 0,
ADD COLUMN     "product_id" INTEGER NOT NULL,
ADD COLUMN     "size" VARCHAR(50),
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "weight" DECIMAL(8,3),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "sku" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "cost" DROP NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "sku" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "barcode" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "unit" SET DEFAULT 'piece',
ALTER COLUMN "unit" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "dimensions" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "color" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "size" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "material" SET DATA TYPE VARCHAR(100),
DROP COLUMN "status",
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'active',
ALTER COLUMN "tags" DROP DEFAULT,
ALTER COLUMN "meta_title" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "seo_keywords" DROP DEFAULT,
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "purchase_order_items" DROP COLUMN "createdAt",
DROP COLUMN "productId",
DROP COLUMN "purchaseOrderId",
DROP COLUMN "quantity",
DROP COLUMN "receivedQty",
DROP COLUMN "totalCost",
DROP COLUMN "unitCost",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "product_id" INTEGER,
ADD COLUMN     "purchase_order_id" INTEGER NOT NULL,
ADD COLUMN     "quantity_ordered" INTEGER NOT NULL,
ADD COLUMN     "quantity_received" INTEGER DEFAULT 0,
ADD COLUMN     "total_cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "unit_cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "variant_id" INTEGER;

-- AlterTable
ALTER TABLE "purchase_orders" DROP COLUMN "createdAt",
DROP COLUMN "expectedDate",
DROP COLUMN "orderDate",
DROP COLUMN "orderNumber",
DROP COLUMN "receivedDate",
DROP COLUMN "supplierId",
DROP COLUMN "total",
DROP COLUMN "updatedAt",
ADD COLUMN     "actual_delivery_date" DATE,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expected_delivery_date" DATE,
ADD COLUMN     "order_date" DATE NOT NULL,
ADD COLUMN     "order_number" VARCHAR(50) NOT NULL,
ADD COLUMN     "shipping_cost" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "supplier_id" INTEGER NOT NULL,
ADD COLUMN     "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'draft';

-- AlterTable
ALTER TABLE "sales_items" DROP COLUMN "createdAt",
DROP COLUMN "discount",
DROP COLUMN "productId",
DROP COLUMN "totalPrice",
DROP COLUMN "transactionId",
DROP COLUMN "unitPrice",
DROP COLUMN "variantId",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "discount_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "product_id" INTEGER,
ADD COLUMN     "total_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "transaction_id" INTEGER NOT NULL,
ADD COLUMN     "unit_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "variant_id" INTEGER;

-- AlterTable
ALTER TABLE "sales_transactions" DROP COLUMN "cashierId",
DROP COLUMN "createdAt",
DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "customerPhone",
DROP COLUMN "discount",
DROP COLUMN "discountType",
DROP COLUMN "isRefund",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "receiptNumber",
DROP COLUMN "refundReason",
DROP COLUMN "syncedAt",
DROP COLUMN "syncedToWebflow",
DROP COLUMN "tax",
DROP COLUMN "total",
DROP COLUMN "transactionCode",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customer_email" VARCHAR(255),
ADD COLUMN     "customer_name" VARCHAR(255),
ADD COLUMN     "customer_phone" VARCHAR(20),
ADD COLUMN     "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "payment_method" VARCHAR(50) NOT NULL,
ADD COLUMN     "payment_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN     "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "transaction_number" VARCHAR(50) NOT NULL,
ADD COLUMN     "transaction_type" VARCHAR(20) NOT NULL DEFAULT 'sale',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "stock_additions" ALTER COLUMN "purchase_date" DROP NOT NULL,
ALTER COLUMN "purchase_date" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "reference_no" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "stock_adjustments" DROP COLUMN "createdAt",
DROP COLUMN "newStock",
DROP COLUMN "previousStock",
DROP COLUMN "productId",
DROP COLUMN "type",
DROP COLUMN "userId",
DROP COLUMN "variantId",
ADD COLUMN     "adjustment_type" VARCHAR(50) NOT NULL,
ADD COLUMN     "approved_at" TIMESTAMPTZ(6),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "new_quantity" INTEGER NOT NULL,
ADD COLUMN     "old_quantity" INTEGER NOT NULL,
ADD COLUMN     "product_id" INTEGER,
ADD COLUMN     "reference_number" VARCHAR(100),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD COLUMN     "variant_id" INTEGER;

-- AlterTable
ALTER TABLE "stock_reconciliations" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255),
DROP COLUMN "status",
ADD COLUMN     "status" "stock_reconciliation_status" DEFAULT 'DRAFT',
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "submitted_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "approved_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "contact_person" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "city" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "state" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "postal_code" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "country" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "website" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "tax_number" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "payment_terms" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "credit_limit" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "notes",
ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "permissions" TEXT[],
ALTER COLUMN "first_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "last_name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "password_hash" DROP NOT NULL,
ALTER COLUMN "password_hash" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(20),
DROP COLUMN "role",
ADD COLUMN     "role" VARCHAR(20) NOT NULL DEFAULT 'employee',
ALTER COLUMN "last_login" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "last_logout" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "last_activity" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "reset_token" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "reset_token_expires" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "email_verified_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "email_verification_token" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "email_verification_expires" SET DATA TYPE TIMESTAMPTZ(6),
DROP COLUMN "user_status",
ADD COLUMN     "user_status" VARCHAR(20) DEFAULT 'PENDING',
ALTER COLUMN "approved_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "email_notifications" DROP NOT NULL,
ALTER COLUMN "marketing_emails" DROP NOT NULL,
ALTER COLUMN "created_at" DROP NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(6),
ALTER COLUMN "updated_at" DROP NOT NULL,
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(6);

-- DropTable
DROP TABLE "webflow_syncs";

-- DropEnum
DROP TYPE "AIContentType";

-- DropEnum
DROP TYPE "ContentStatus";

-- DropEnum
DROP TYPE "DiscountType";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ProductStatus";

-- DropEnum
DROP TYPE "PurchaseOrderStatus";

-- DropEnum
DROP TYPE "StockAdjustmentType";

-- DropEnum
DROP TYPE "StockReconciliationStatus";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "UserStatus";

-- DropEnum
DROP TYPE "WebflowSyncStatus";

-- CreateTable
CREATE TABLE "webflow_sync" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "webflow_item_id" VARCHAR(255),
    "sync_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "last_sync_at" TIMESTAMPTZ(6),
    "sync_errors" TEXT,
    "webflow_url" TEXT,
    "is_published" BOOLEAN DEFAULT false,
    "auto_sync" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webflow_sync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webflow_sync_webflow_item_id_key" ON "webflow_sync"("webflow_item_id");

-- CreateIndex
CREATE INDEX "idx_webflow_sync_auto_sync" ON "webflow_sync"("auto_sync");

-- CreateIndex
CREATE INDEX "idx_webflow_sync_product_id" ON "webflow_sync"("product_id");

-- CreateIndex
CREATE INDEX "idx_webflow_sync_sync_status" ON "webflow_sync"("sync_status");

-- CreateIndex
CREATE INDEX "idx_webflow_sync_webflow_item_id" ON "webflow_sync"("webflow_item_id");

-- CreateIndex
CREATE INDEX "idx_rate_limit_key" ON "rate_limits"("key");

-- CreateIndex
CREATE INDEX "idx_rate_limit_created_at" ON "rate_limits"("created_at");

-- CreateIndex
CREATE INDEX "idx_ai_content_content_type" ON "ai_content"("content_type");

-- CreateIndex
CREATE INDEX "idx_ai_content_is_approved" ON "ai_content"("is_approved");

-- CreateIndex
CREATE INDEX "idx_ai_content_product_id" ON "ai_content"("product_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_record_id" ON "audit_logs"("record_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_table_name" ON "audit_logs"("table_name");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_brands_is_active" ON "brands"("is_active");

-- CreateIndex
CREATE INDEX "idx_brands_name" ON "brands"("name");

-- CreateIndex
CREATE INDEX "idx_product_variants_product_id" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "idx_product_variants_sku" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "idx_products_sku" ON "products"("sku");

-- CreateIndex
CREATE INDEX "idx_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "idx_products_stock" ON "products"("stock");

-- CreateIndex
CREATE INDEX "idx_products_supplier_id" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_order" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_product" ON "purchase_order_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_product_id" ON "purchase_order_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_purchase_order_id" ON "purchase_order_items"("purchase_order_id");

-- CreateIndex
CREATE INDEX "idx_purchase_order_items_variant_id" ON "purchase_order_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_number_key" ON "purchase_orders"("order_number");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_number" ON "purchase_orders"("order_number");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_order_date" ON "purchase_orders"("order_date");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_status" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_supplier" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_supplier_id" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_purchase_orders_user_id" ON "purchase_orders"("user_id");

-- CreateIndex
CREATE INDEX "idx_sales_items_product_id" ON "sales_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_sales_items_transaction_id" ON "sales_items"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_sales_items_variant_id" ON "sales_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_transactions_transaction_number_key" ON "sales_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_created_at" ON "sales_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_payment_status" ON "sales_transactions"("payment_status");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_transaction_number" ON "sales_transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "idx_sales_transactions_user_id" ON "sales_transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_stock_additions_created_by" ON "stock_additions"("created_by");

-- CreateIndex
CREATE INDEX "idx_stock_additions_product_id" ON "stock_additions"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_additions_purchase_date" ON "stock_additions"("purchase_date");

-- CreateIndex
CREATE INDEX "idx_stock_additions_supplier_id" ON "stock_additions"("supplier_id");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_adjustment_type" ON "stock_adjustments"("adjustment_type");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_approved_by" ON "stock_adjustments"("approved_by");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_created_at" ON "stock_adjustments"("created_at");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_product_id" ON "stock_adjustments"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_status" ON "stock_adjustments"("status");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_user_id" ON "stock_adjustments"("user_id");

-- CreateIndex
CREATE INDEX "idx_stock_adjustments_variant_id" ON "stock_adjustments"("variant_id");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliation_items_product_id" ON "stock_reconciliation_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliation_items_reconciliation_id" ON "stock_reconciliation_items"("reconciliation_id");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_approved_by" ON "stock_reconciliations"("approved_by");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_created_at" ON "stock_reconciliations"("created_at");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_created_by" ON "stock_reconciliations"("created_by");

-- CreateIndex
CREATE INDEX "idx_stock_reconciliations_status" ON "stock_reconciliations"("status");

-- CreateIndex
CREATE INDEX "idx_suppliers_active" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "idx_suppliers_contact" ON "suppliers"("contact_person");

-- CreateIndex
CREATE INDEX "idx_suppliers_email" ON "suppliers"("email");

-- CreateIndex
CREATE INDEX "idx_suppliers_name" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "idx_users_approved_by" ON "users"("approved_by");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email_verification_token" ON "users"("email_verification_token");

-- CreateIndex
CREATE INDEX "idx_users_email_verified" ON "users"("email_verified");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_last_activity" ON "users"("last_activity");

-- CreateIndex
CREATE INDEX "idx_users_last_login" ON "users"("last_login");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_user_status" ON "users"("user_status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_additions" ADD CONSTRAINT "stock_additions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_additions" ADD CONSTRAINT "stock_additions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_additions" ADD CONSTRAINT "stock_additions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliations" ADD CONSTRAINT "stock_reconciliations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_reconciliation_items" ADD CONSTRAINT "stock_reconciliation_items_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "stock_reconciliations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "fk_stock_adjustments_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "fk_stock_adjustments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "fk_stock_adjustments_variant_id" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_content" ADD CONSTRAINT "ai_content_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_content" ADD CONSTRAINT "ai_content_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "webflow_sync" ADD CONSTRAINT "webflow_sync_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
