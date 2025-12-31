-- Drop foreign key constraints
ALTER TABLE "sales_items" DROP CONSTRAINT IF EXISTS "sales_items_variant_id_fkey";
ALTER TABLE "stock_adjustments" DROP CONSTRAINT IF EXISTS "fk_stock_adjustments_variant_id";
ALTER TABLE "stock_adjustments" DROP CONSTRAINT IF EXISTS "stock_adjustments_variant_id_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "idx_sales_items_variant_id";
DROP INDEX IF EXISTS "idx_stock_adjustments_variant_id";
DROP INDEX IF EXISTS "idx_product_variants_product_id";
DROP INDEX IF EXISTS "idx_product_variants_sku";

-- Drop variant_id columns (already NULL from data migration)
ALTER TABLE "sales_items" DROP COLUMN IF EXISTS "variant_id";
ALTER TABLE "stock_adjustments" DROP COLUMN IF EXISTS "variant_id";

-- Make product_id required (NOT NULL)
ALTER TABLE "sales_items" ALTER COLUMN "product_id" SET NOT NULL;
ALTER TABLE "stock_adjustments" ALTER COLUMN "product_id" SET NOT NULL;

-- Drop has_variants column from products (already false from data migration)
ALTER TABLE "products" DROP COLUMN IF EXISTS "has_variants";

-- Drop product_variants table
DROP TABLE IF EXISTS "product_variants" CASCADE;
