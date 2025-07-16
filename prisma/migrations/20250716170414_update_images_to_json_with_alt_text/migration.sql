/*
  Warnings:

  - The `images` column on the `product_variants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `images` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "images",
ADD COLUMN     "images" JSONB;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "images",
ADD COLUMN     "images" JSONB;
