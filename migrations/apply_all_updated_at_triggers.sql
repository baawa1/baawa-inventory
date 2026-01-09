-- Comprehensive migration to add auto-update triggers for all updated_at fields
-- This fixes the issue where updated_at doesn't change when records are updated
--
-- Safe to run multiple times (idempotent)
-- Non-destructive: only adds trigger functionality

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

-- Verification query
-- Run this after applying the migration to confirm all triggers exist:
-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_name LIKE '%updated_at%'
-- ORDER BY event_object_table;
