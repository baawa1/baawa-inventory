-- Add stock tracking columns to stock_additions table
-- These columns track the product stock levels before and after each addition
-- Sprint 2.1 completion: Add missing columns to production database

-- Add new_stock column (tracks stock after addition)
ALTER TABLE "stock_additions"
ADD COLUMN IF NOT EXISTS "new_stock" INTEGER NOT NULL DEFAULT 0;

-- Add previous_stock column (tracks stock before addition)
ALTER TABLE "stock_additions"
ADD COLUMN IF NOT EXISTS "previous_stock" INTEGER NOT NULL DEFAULT 0;

-- Add column comments for documentation
COMMENT ON COLUMN "stock_additions"."new_stock" IS 'Product stock level after this addition';
COMMENT ON COLUMN "stock_additions"."previous_stock" IS 'Product stock level before this addition';
