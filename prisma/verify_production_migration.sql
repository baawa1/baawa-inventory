-- =====================================================
-- Production Migration Verification Script
-- Migration: 20260119175207_add_stock_tracking_to_stock_additions
-- Purpose: Verify new_stock and previous_stock columns exist
-- =====================================================

-- 1. Check if columns exist in stock_additions table
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE
        WHEN is_nullable = 'NO' THEN '✅ NOT NULL'
        ELSE '❌ NULLABLE'
    END as constraint_status
FROM information_schema.columns
WHERE table_name = 'stock_additions'
  AND column_name IN ('new_stock', 'previous_stock')
ORDER BY column_name;

-- Expected output:
-- column_name     | data_type | column_default | is_nullable | constraint_status
-- ----------------+-----------+----------------+-------------+-------------------
-- new_stock       | integer   | 0              | NO          | ✅ NOT NULL
-- previous_stock  | integer   | 0              | NO          | ✅ NOT NULL


-- 2. Check column descriptions/comments
SELECT
    column_name,
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_name = 'stock_additions'
  AND column_name IN ('new_stock', 'previous_stock')
ORDER BY column_name;

-- Expected output:
-- column_name     | column_comment
-- ----------------+------------------------------------------------
-- new_stock       | Product stock level after this addition
-- previous_stock  | Product stock level before this addition


-- 3. Verify table structure (all columns)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock_additions'
ORDER BY ordinal_position;


-- 4. Check if there are any existing stock additions
SELECT
    COUNT(*) as total_stock_additions,
    COUNT(CASE WHEN new_stock = 0 AND previous_stock = 0 THEN 1 END) as records_with_zero_values,
    COUNT(CASE WHEN new_stock > 0 OR previous_stock > 0 THEN 1 END) as records_with_actual_values
FROM stock_additions;

-- Expected output example:
-- total_stock_additions | records_with_zero_values | records_with_actual_values
-- ----------------------+--------------------------+---------------------------
-- 50                    | 45                       | 5
-- (Old records will have 0,0 - new records will have actual values)


-- 5. Sample recent stock additions to verify new data
SELECT
    id,
    product_id,
    quantity,
    cost_per_unit,
    previous_stock,
    new_stock,
    created_at,
    CASE
        WHEN new_stock > 0 AND previous_stock >= 0 THEN '✅ Valid'
        WHEN new_stock = 0 AND previous_stock = 0 THEN '⚠️ Legacy (before migration)'
        ELSE '❌ Invalid'
    END as data_status
FROM stock_additions
ORDER BY created_at DESC
LIMIT 10;


-- 6. Verify referential integrity (join with products)
SELECT
    sa.id,
    sa.product_id,
    p.name as product_name,
    p.stock as current_product_stock,
    sa.quantity as quantity_added,
    sa.previous_stock,
    sa.new_stock,
    sa.created_at
FROM stock_additions sa
JOIN products p ON p.id = sa.product_id
ORDER BY sa.created_at DESC
LIMIT 5;


-- 7. Check migration tracking in Prisma migrations table
SELECT
    migration_name,
    started_at,
    finished_at,
    applied_steps_count,
    CASE
        WHEN finished_at IS NOT NULL THEN '✅ Applied'
        ELSE '❌ Incomplete'
    END as status
FROM "_prisma_migrations"
WHERE migration_name LIKE '%stock_tracking%'
ORDER BY started_at DESC;

-- Expected output:
-- migration_name                                         | started_at           | finished_at          | applied_steps_count | status
-- -------------------------------------------------------+----------------------+----------------------+---------------------+---------
-- 20260119175207_add_stock_tracking_to_stock_additions | 2026-01-19 17:52:07 | 2026-01-19 17:52:07 | 1                   | ✅ Applied


-- =====================================================
-- SUMMARY CHECK
-- =====================================================

SELECT
    'Migration Verification Summary' as check_name,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'stock_additions'
              AND column_name = 'new_stock'
              AND data_type = 'integer'
              AND is_nullable = 'NO'
        ) THEN '✅ new_stock column OK'
        ELSE '❌ new_stock column MISSING or INVALID'
    END as new_stock_status,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'stock_additions'
              AND column_name = 'previous_stock'
              AND data_type = 'integer'
              AND is_nullable = 'NO'
        ) THEN '✅ previous_stock column OK'
        ELSE '❌ previous_stock column MISSING or INVALID'
    END as previous_stock_status,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM "_prisma_migrations"
            WHERE migration_name = '20260119175207_add_stock_tracking_to_stock_additions'
              AND finished_at IS NOT NULL
        ) THEN '✅ Migration applied'
        ELSE '⚠️ Migration not tracked (if applied manually via SQL)'
    END as migration_status;


-- =====================================================
-- NEXT STEPS
-- =====================================================

-- If all checks pass (✅):
-- 1. Test stock addition via the application UI
-- 2. Verify success toast appears
-- 3. Check that new stock additions have non-zero values for tracking fields
-- 4. Monitor application logs for any P2022 errors

-- If checks fail (❌):
-- 1. Re-run the migration SQL from PRODUCTION_MIGRATION_GUIDE.md
-- 2. Verify database connection credentials
-- 3. Check Supabase dashboard for any schema locks or issues
-- 4. Contact support with error details
