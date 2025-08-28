-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "sales_transactions" ADD COLUMN     "wordpress_id" INTEGER;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "wordpress_id" INTEGER;
