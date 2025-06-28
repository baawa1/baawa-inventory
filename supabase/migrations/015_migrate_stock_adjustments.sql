-- Migration script to transition from old stock_adjustments to new stock system
-- This script should be run after all new tables are created

BEGIN;

-- Step 1: Analyze existing stock_adjustments data
-- Note: This is just an analysis query, not a modification
-- Run this first to understand the data before migration

SELECT 
    type,
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM stock_adjustments 
GROUP BY type;

-- Step 2: Add approval workflow columns to existing stock_adjustments table
-- This allows the old system to coexist with the new system during transition

ALTER TABLE stock_adjustments 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED' 
CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE stock_adjustments 
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id);

ALTER TABLE stock_adjustments 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE stock_adjustments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Step 3: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_status ON stock_adjustments(status);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_approved_by ON stock_adjustments(approved_by);

-- Step 4: Update existing records to be marked as approved
-- Since the old system applied adjustments immediately, they should be marked as approved
UPDATE stock_adjustments 
SET 
    status = 'APPROVED',
    approved_at = created_at,
    approved_by = user_id
WHERE status = 'APPROVED' AND approved_at IS NULL;

-- Step 5: Create a function to migrate simple stock additions to stock_additions table
-- This will handle INCREASE and RETURN types that are pure stock additions
CREATE OR REPLACE FUNCTION migrate_stock_additions() RETURNS VOID AS $$
DECLARE
    adjustment_record RECORD;
BEGIN
    -- Migrate INCREASE and RETURN adjustments to stock_additions
    FOR adjustment_record IN 
        SELECT * FROM stock_adjustments 
        WHERE type IN ('INCREASE', 'RETURN') 
        AND status = 'APPROVED'
    LOOP
        -- Insert into stock_additions table
        INSERT INTO stock_additions (
            product_id,
            quantity,
            cost_per_unit,
            supplier_id,
            purchase_date,
            notes,
            created_by,
            created_at
        ) VALUES (
            adjustment_record.product_id,
            ABS(adjustment_record.quantity), -- Ensure positive quantity
            0.00, -- Default cost, can be updated manually if needed
            NULL, -- No supplier info in old system
            adjustment_record.created_at::DATE,
            COALESCE(adjustment_record.notes, '') || 
            ' (Migrated from stock adjustment #' || adjustment_record.id || ')',
            adjustment_record.user_id,
            adjustment_record.created_at
        );
    END LOOP;
    
    RAISE NOTICE 'Migrated % stock additions', 
        (SELECT COUNT(*) FROM stock_adjustments WHERE type IN ('INCREASE', 'RETURN') AND status = 'APPROVED');
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a function to migrate complex adjustments to stock_reconciliations
-- This will handle DECREASE, DAMAGE, TRANSFER, and RECOUNT types
CREATE OR REPLACE FUNCTION migrate_stock_reconciliations() RETURNS VOID AS $$
DECLARE
    adjustment_record RECORD;
    reconciliation_id INTEGER;
BEGIN
    -- Group adjustments by date and user to create reconciliations
    FOR adjustment_record IN 
        SELECT 
            user_id,
            created_at::DATE as adjustment_date,
            COUNT(*) as adjustment_count
        FROM stock_adjustments 
        WHERE type IN ('DECREASE', 'DAMAGE', 'TRANSFER', 'RECOUNT')
        AND status = 'APPROVED'
        GROUP BY user_id, created_at::DATE
        ORDER BY adjustment_date
    LOOP
        -- Create a reconciliation for each group
        INSERT INTO stock_reconciliations (
            title,
            description,
            status,
            created_by,
            approved_by,
            created_at,
            submitted_at,
            approved_at
        ) VALUES (
            'Migrated Adjustments - ' || adjustment_record.adjustment_date,
            'Automatically migrated from old stock adjustment system. Contains ' || 
            adjustment_record.adjustment_count || ' adjustments.',
            'APPROVED',
            adjustment_record.user_id,
            adjustment_record.user_id,
            adjustment_record.adjustment_date,
            adjustment_record.adjustment_date,
            adjustment_record.adjustment_date
        ) RETURNING id INTO reconciliation_id;
        
        -- Insert reconciliation items for each adjustment in this group
        INSERT INTO stock_reconciliation_items (
            reconciliation_id,
            product_id,
            system_count,
            physical_count,
            discrepancy,
            discrepancy_reason,
            notes
        )
        SELECT 
            reconciliation_id,
            sa.product_id,
            sa.previous_stock,
            sa.new_stock,
            sa.quantity,
            sa.reason,
            COALESCE(sa.notes, '') || ' (Migrated from adjustment #' || sa.id || ')'
        FROM stock_adjustments sa
        WHERE sa.type IN ('DECREASE', 'DAMAGE', 'TRANSFER', 'RECOUNT')
        AND sa.status = 'APPROVED'
        AND sa.user_id = adjustment_record.user_id
        AND sa.created_at::DATE = adjustment_record.adjustment_date;
    END LOOP;
    
    RAISE NOTICE 'Migrated % stock reconciliations', 
        (SELECT COUNT(DISTINCT (user_id, created_at::DATE)) 
         FROM stock_adjustments 
         WHERE type IN ('DECREASE', 'DAMAGE', 'TRANSFER', 'RECOUNT') 
         AND status = 'APPROVED');
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add comments to document the migration
COMMENT ON COLUMN stock_adjustments.status IS 'Added for transition to new system - old records marked as APPROVED by default';
COMMENT ON COLUMN stock_adjustments.approved_by IS 'Added for transition - old records approved by original user';
COMMENT ON COLUMN stock_adjustments.approved_at IS 'Added for transition - old records approved at creation time';

-- Step 8: Create a view for backward compatibility during transition
CREATE OR REPLACE VIEW legacy_stock_adjustments AS
SELECT 
    id,
    type,
    quantity,
    previous_stock,
    new_stock,
    reason,
    notes,
    reference_number,
    user_id,
    product_id,
    created_at,
    status,
    approved_by,
    approved_at,
    rejection_reason
FROM stock_adjustments
WHERE status = 'APPROVED';

COMMENT ON VIEW legacy_stock_adjustments IS 'Legacy view for backward compatibility during transition';

COMMIT;

-- Instructions for manual execution:
-- 1. Run this script in a test environment first
-- 2. Verify the data looks correct
-- 3. Run: SELECT migrate_stock_additions();
-- 4. Run: SELECT migrate_stock_reconciliations();
-- 5. Verify migrated data in new tables
-- 6. Once verified, the old stock_adjustments table can be renamed or archived
