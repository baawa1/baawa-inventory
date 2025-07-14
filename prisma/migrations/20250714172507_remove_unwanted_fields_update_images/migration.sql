/*
  Warnings:

  - You are about to drop the column `allow_backorders` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `gtin` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `primary_category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `seo_score` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_class` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `sold_individually` on the `products` table. All the data in the column will be lost.
  - The `images` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "allow_backorders",
DROP COLUMN "gtin",
DROP COLUMN "primary_category",
DROP COLUMN "seo_score",
DROP COLUMN "shipping_class",
DROP COLUMN "sold_individually",
DROP COLUMN "images",
ADD COLUMN     "images" TEXT[];
