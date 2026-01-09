-- COMPREHENSIVE PRODUCTION DATABASE FIX
-- This migration fixes all production database issues:
-- 1. Creates missing stock_transactions table
-- 2. Adds auto-update triggers for updated_at fields
--
-- Safe to run multiple times (idempotent)
-- Non-destructive: only adds missing functionality
--
-- Apply this to your production database via:
-- 1. Supabase Dashboard -> SQL Editor -> Copy & Run this file
-- 2. OR: psql $DATABASE_URL -f migrations/FIX_PRODUCTION_DATABASE.sql

-- ============================================================================
-- PART 1: Create missing stock_transactions table
-- ============================================================================

-- Create StockTransactionType enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "StockTransactionType" AS ENUM (
    'SALE',
    'PURCHASE',
    'ADJUSTMENT',
    'RETURN',
    'RECONCILIATION',
    'TRANSFER',
    'DAMAGE',
    'STOCK_ADDITION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create stock_transactions table
CREATE TABLE IF NOT EXISTS "stock_transactions" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "type" "StockTransactionType" NOT NULL,
  "reference_type" VARCHAR(50),
  "reference_id" INTEGER,
  "reason" TEXT,
  "user_id" INTEGER NOT NULL,
  "previous_stock" INTEGER NOT NULL,
  "new_stock" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "stock_transactions_product_id_created_at_idx" ON "stock_transactions"("product_id", "created_at");
CREATE INDEX IF NOT EXISTS "stock_transactions_type_idx" ON "stock_transactions"("type");
CREATE INDEX IF NOT EXISTS "stock_transactions_created_at_idx" ON "stock_transactions"("created_at");
CREATE INDEX IF NOT EXISTS "stock_transactions_user_id_idx" ON "stock_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "stock_transactions_reference_type_reference_id_idx" ON "stock_transactions"("reference_type", "reference_id");

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PART 2: Add auto-update triggers for updated_at fields
-- ============================================================================

-- Create or replace the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sales Transactions
DROP TRIGGER IF EXISTS update_sales_transactions_updated_at ON sales_transactions;
CREATE TRIGGER update_sales_transactions_updated_at
BEFORE UPDATE ON sales_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sales Items
DROP TRIGGER IF EXISTS update_sales_items_updated_at ON sales_items;
CREATE TRIGGER update_sales_items_updated_at
BEFORE UPDATE ON sales_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Stock Reconciliation Items
DROP TRIGGER IF EXISTS update_stock_reconciliation_items_updated_at ON stock_reconciliation_items;
CREATE TRIGGER update_stock_reconciliation_items_updated_at
BEFORE UPDATE ON stock_reconciliation_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Transaction Fees
DROP TRIGGER IF EXISTS update_transaction_fees_updated_at ON transaction_fees;
CREATE TRIGGER update_transaction_fees_updated_at
BEFORE UPDATE ON transaction_fees
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to confirm everything is set up:

-- 1. Verify stock_transactions table exists
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'stock_transactions'
-- ORDER BY ordinal_position;

-- 2. Verify all triggers exist
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name LIKE '%updated_at%'
-- ORDER BY event_object_table;

-- 3. Verify StockTransactionType enum exists
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = 'StockTransactionType'::regtype
-- ORDER BY enumsortorder;
