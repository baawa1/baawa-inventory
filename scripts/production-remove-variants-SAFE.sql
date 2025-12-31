-- ============================================================================
-- ProductVariant Removal - PRODUCTION DATABASE (SAFE - NO DATA TO MIGRATE)
-- ============================================================================
-- Date: 2025-12-30
-- Status: SAFE - All tables are empty, no data will be lost
--
-- Verification:
--   - product_variants: 0 records
--   - Products with hasVariants: 0
--   - Sales with variant_id: 0
--   - Adjustments with variant_id: 0
--
-- This script will ONLY drop empty tables and columns
-- ============================================================================

BEGIN;

-- Verification step - ensure no data exists
DO $$
DECLARE
    variant_count INT;
    has_variants_count INT;
    sales_variant_count INT;
    adj_variant_count INT;
BEGIN
    SELECT COUNT(*) INTO variant_count FROM product_variants;
    SELECT COUNT(*) INTO has_variants_count FROM products WHERE has_variants = true;
    SELECT COUNT(*) INTO sales_variant_count FROM sales_items WHERE variant_id IS NOT NULL;
    SELECT COUNT(*) INTO adj_variant_count FROM stock_adjustments WHERE variant_id IS NOT NULL;

    IF variant_count > 0 OR has_variants_count > 0 OR sales_variant_count > 0 OR adj_variant_count > 0 THEN
        RAISE EXCEPTION 'SAFETY CHECK FAILED: Variant data exists! Do not run this script.';
    END IF;

    RAISE NOTICE 'SAFETY CHECK PASSED: No variant data found, safe to proceed.';
END $$;

-- Drop foreign key constraints
ALTER TABLE sales_items DROP CONSTRAINT IF EXISTS sales_items_variant_id_fkey;
ALTER TABLE stock_adjustments DROP CONSTRAINT IF EXISTS fk_stock_adjustments_variant_id;
ALTER TABLE stock_adjustments DROP CONSTRAINT IF EXISTS stock_adjustments_variant_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS idx_sales_items_variant_id;
DROP INDEX IF EXISTS idx_stock_adjustments_variant_id;
DROP INDEX IF EXISTS idx_product_variants_product_id;
DROP INDEX IF EXISTS idx_product_variants_sku;

-- Drop variant_id columns
ALTER TABLE sales_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE stock_adjustments DROP COLUMN IF EXISTS variant_id;

-- Make product_id NOT NULL
-- First verify no NULL values exist
DO $$
DECLARE
    null_count INT;
BEGIN
    SELECT COUNT(*) INTO null_count FROM sales_items WHERE product_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot make product_id NOT NULL: % sales items have NULL product_id', null_count;
    END IF;

    SELECT COUNT(*) INTO null_count FROM stock_adjustments WHERE product_id IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Cannot make product_id NOT NULL: % stock adjustments have NULL product_id', null_count;
    END IF;
END $$;

ALTER TABLE sales_items ALTER COLUMN product_id SET NOT NULL;
ALTER TABLE stock_adjustments ALTER COLUMN product_id SET NOT NULL;

-- Drop has_variants column
ALTER TABLE products DROP COLUMN IF EXISTS has_variants;

-- Drop product_variants table
DROP TABLE IF EXISTS product_variants CASCADE;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✅ PRODUCTION MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '  ✓ Dropped product_variants table (was empty)';
    RAISE NOTICE '  ✓ Dropped has_variants column from products';
    RAISE NOTICE '  ✓ Dropped variant_id from sales_items and stock_adjustments';
    RAISE NOTICE '  ✓ Made product_id NOT NULL in sales_items and stock_adjustments';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps on production server:';
    RAISE NOTICE '  1. Update Prisma schema (already done in codebase)';
    RAISE NOTICE '  2. Run: npx prisma generate';
    RAISE NOTICE '  3. Restart application';
    RAISE NOTICE '';
END $$;

COMMIT;
