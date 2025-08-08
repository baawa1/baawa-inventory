/*
  Warnings:

  - You are about to drop the column `is_featured` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `last_sync_at` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `meta_content` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `meta_description` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `meta_excerpt` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `meta_title` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sale_end_date` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sale_price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sale_start_date` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `seo_keywords` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sync_errors` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sync_status` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `variant_attributes` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `variant_values` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `content_sync` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "content_sync" DROP CONSTRAINT "fk_content_sync_brand";

-- DropForeignKey
ALTER TABLE "content_sync" DROP CONSTRAINT "fk_content_sync_category";

-- DropForeignKey
ALTER TABLE "content_sync" DROP CONSTRAINT "fk_content_sync_product";

-- DropIndex
DROP INDEX "idx_products_is_featured";

-- DropIndex
DROP INDEX "idx_products_sort_order";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "is_featured",
DROP COLUMN "last_sync_at",
DROP COLUMN "meta_content",
DROP COLUMN "meta_description",
DROP COLUMN "meta_excerpt",
DROP COLUMN "meta_title",
DROP COLUMN "sale_end_date",
DROP COLUMN "sale_price",
DROP COLUMN "sale_start_date",
DROP COLUMN "seo_keywords",
DROP COLUMN "sort_order",
DROP COLUMN "sync_errors",
DROP COLUMN "sync_status",
DROP COLUMN "variant_attributes",
DROP COLUMN "variant_values";

-- DropTable
DROP TABLE "content_sync";
