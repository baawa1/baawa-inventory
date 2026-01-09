-- Create stock_transactions table (missing from production)
-- This table tracks all stock movements for audit purposes
--
-- Safe to run - will only create if table doesn't exist
-- Non-destructive migration

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

-- Verification query
-- Run this after applying the migration to confirm table exists:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'stock_transactions'
-- ORDER BY ordinal_position;
