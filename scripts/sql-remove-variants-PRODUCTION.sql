-- ============================================================================
-- ProductVariant Removal Migration - FOR PRODUCTION DATABASE
-- ============================================================================
-- Created: 2025-12-30
-- WARNING: Run this on PRODUCTION database AFTER testing on DEV
-- IMPORTANT: Create a backup before running this script!
--
-- This script will:
-- 1. Consolidate variant stock into parent products
-- 2. Update sales_items to reference parent products
-- 3. Update stock_adjustments to reference parent products
-- 4. Remove hasVariants flag
-- 5. Drop ProductVariant table and related constraints
-- ============================================================================

-- Safety check: This should be run AFTER the dev migration is successful
-- Uncomment the line below to enable execution
-- SET statement_timeout = '300s';

BEGIN;

-- ============================================================================
-- STEP 1: Consolidate variant stock into parent products
-- ============================================================================
DO $$
DECLARE
    product_record RECORD;
    total_variant_stock INT;
BEGIN
    RAISE NOTICE 'Step 1: Consolidating variant stock...';

    FOR product_record IN
        SELECT id, name, stock
        FROM products
        WHERE has_variants = true
    LOOP
        -- Calculate total stock from all variants
        SELECT COALESCE(SUM(current_stock), 0)
        INTO total_variant_stock
        FROM product_variants
        WHERE product_id = product_record.id;

        -- Update product stock
        UPDATE products
        SET
            stock = stock + total_variant_stock,
            has_variants = false
        WHERE id = product_record.id;

        RAISE NOTICE '  - Product %: Added % stock from variants', product_record.name, total_variant_stock;
    END LOOP;

    RAISE NOTICE 'Stock consolidation complete.';
END $$;

-- ============================================================================
-- STEP 2: Update sales_items - move variant references to product
-- ============================================================================
DO $$
DECLARE
    updated_count INT;
BEGIN
    RAISE NOTICE 'Step 2: Updating sales_items...';

    UPDATE sales_items si
    SET
        product_id = pv.product_id,
        variant_id = NULL
    FROM product_variants pv
    WHERE si.variant_id = pv.id
    AND si.variant_id IS NOT NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '  - Updated % sales items', updated_count;
END $$;

-- ============================================================================
-- STEP 3: Update stock_adjustments - move variant references to product
-- ============================================================================
DO $$
DECLARE
    updated_count INT;
BEGIN
    RAISE NOTICE 'Step 3: Updating stock_adjustments...';

    UPDATE stock_adjustments sa
    SET
        product_id = pv.product_id,
        variant_id = NULL
    FROM product_variants pv
    WHERE sa.variant_id = pv.id
    AND sa.variant_id IS NOT NULL;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '  - Updated % stock adjustments', updated_count;
END $$;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================
DO $$
DECLARE
    sales_with_variants INT;
    adjustments_with_variants INT;
    products_with_flag INT;
BEGIN
    RAISE NOTICE 'Step 4: Verifying migration...';

    SELECT COUNT(*) INTO sales_with_variants
    FROM sales_items WHERE variant_id IS NOT NULL;

    SELECT COUNT(*) INTO adjustments_with_variants
    FROM stock_adjustments WHERE variant_id IS NOT NULL;

    SELECT COUNT(*) INTO products_with_flag
    FROM products WHERE has_variants = true;

    RAISE NOTICE '  - Sales items with variant_id: % (should be 0)', sales_with_variants;
    RAISE NOTICE '  - Stock adjustments with variant_id: % (should be 0)', adjustments_with_variants;
    RAISE NOTICE '  - Products with hasVariants flag: % (should be 0)', products_with_flag;

    IF sales_with_variants > 0 OR adjustments_with_variants > 0 OR products_with_flag > 0 THEN
        RAISE EXCEPTION 'Migration verification failed! Not all references were updated.';
    END IF;

    RAISE NOTICE 'Verification successful!';
END $$;

-- ============================================================================
-- STEP 5: Drop foreign key constraints
-- ============================================================================
RAISE NOTICE 'Step 5: Dropping foreign key constraints...';

ALTER TABLE sales_items
DROP CONSTRAINT IF EXISTS sales_items_variant_id_fkey;

ALTER TABLE stock_adjustments
DROP CONSTRAINT IF EXISTS stock_adjustments_variant_id_fkey;

-- ============================================================================
-- STEP 6: Drop indexes
-- ============================================================================
RAISE NOTICE 'Step 6: Dropping indexes...';

DROP INDEX IF EXISTS idx_product_variants_product_id;
DROP INDEX IF EXISTS idx_product_variants_sku;
DROP INDEX IF EXISTS idx_sales_items_variant_id;
DROP INDEX IF EXISTS idx_stock_adjustments_variant_id;

-- ============================================================================
-- STEP 7: Drop variant_id columns
-- ============================================================================
RAISE NOTICE 'Step 7: Dropping variant_id columns...';

ALTER TABLE sales_items DROP COLUMN IF EXISTS variant_id;
ALTER TABLE stock_adjustments DROP COLUMN IF EXISTS variant_id;

-- ============================================================================
-- STEP 8: Make product_id NOT NULL (was optional before)
-- ============================================================================
RAISE NOTICE 'Step 8: Making product_id required...';

-- Check for any NULL product_id values first
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

ALTER TABLE sales_items
ALTER COLUMN product_id SET NOT NULL;

ALTER TABLE stock_adjustments
ALTER COLUMN product_id SET NOT NULL;

-- ============================================================================
-- STEP 9: Drop has_variants column from products
-- ============================================================================
RAISE NOTICE 'Step 9: Dropping has_variants column...';

ALTER TABLE products DROP COLUMN IF EXISTS has_variants;

-- ============================================================================
-- STEP 10: Drop product_variants table
-- ============================================================================
RAISE NOTICE 'Step 10: Dropping product_variants table...';

DROP TABLE IF EXISTS product_variants CASCADE;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary of changes:';
    RAISE NOTICE '  ✓ Variant stock consolidated into parent products';
    RAISE NOTICE '  ✓ Sales items updated to reference products';
    RAISE NOTICE '  ✓ Stock adjustments updated to reference products';
    RAISE NOTICE '  ✓ has_variants column removed from products';
    RAISE NOTICE '  ✓ variant_id columns removed from sales_items and stock_adjustments';
    RAISE NOTICE '  ✓ product_variants table dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update Prisma schema to remove ProductVariant model';
    RAISE NOTICE '  2. Run: npx prisma generate';
    RAISE NOTICE '  3. Update application code to remove variant references';
    RAISE NOTICE '  4. Test thoroughly';
    RAISE NOTICE '';
END $$;

COMMIT;

-- If you need to rollback, you'll need to restore from backup
-- There is no automated rollback for this migration
