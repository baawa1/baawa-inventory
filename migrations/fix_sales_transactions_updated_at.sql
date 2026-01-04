-- Fix 3.5 Extension: Add auto-update trigger for sales_transactions.updated_at
-- This fixes the issue where updated_at doesn't change when payment status is updated
--
-- Safe to run multiple times (idempotent)
-- Non-destructive: only adds trigger functionality

-- Create or replace the update function (if not already exists from Fix 3.5)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_sales_transactions_updated_at ON sales_transactions;

-- Create trigger for sales_transactions
CREATE TRIGGER update_sales_transactions_updated_at
BEFORE UPDATE ON sales_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Verification query
-- Run this after applying the migration to confirm trigger exists:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name = 'update_sales_transactions_updated_at';
