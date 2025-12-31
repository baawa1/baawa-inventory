-- Add CHECK constraint to prevent negative stock values
-- Sprint 1.2: Add stock non-negative constraint

-- Add constraint to products table
ALTER TABLE "products" ADD CONSTRAINT "check_stock_non_negative" CHECK (stock >= 0);

-- Add constraint to min_stock as well (should also be non-negative)
ALTER TABLE "products" ADD CONSTRAINT "check_min_stock_non_negative" CHECK (min_stock >= 0);
