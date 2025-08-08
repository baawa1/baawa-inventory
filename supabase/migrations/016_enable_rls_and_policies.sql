-- Enable Row Level Security (RLS) and create policies for all tables
-- This migration secures the production database with proper access control

BEGIN;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for suppliers table
CREATE POLICY "Authenticated users can view suppliers" ON suppliers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff and admins can manage suppliers" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

-- Create policies for categories table
CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff and admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

-- Create policies for brands table
CREATE POLICY "Authenticated users can view brands" ON brands
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff and admins can manage brands" ON brands
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

-- Create policies for products table
CREATE POLICY "Authenticated users can view products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff and admins can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

-- Create policies for product_variants table
CREATE POLICY "Authenticated users can view product variants" ON product_variants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Staff and admins can manage product variants" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

-- Create policies for sales_transactions table
CREATE POLICY "Users can view their own transactions" ON sales_transactions
    FOR SELECT USING (user_id = auth.uid()::integer);

CREATE POLICY "Users can create their own transactions" ON sales_transactions
    FOR INSERT WITH CHECK (user_id = auth.uid()::integer);

CREATE POLICY "Admins can view all transactions" ON sales_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage all transactions" ON sales_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for sales_items table
CREATE POLICY "Users can view items from their transactions" ON sales_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_transactions 
            WHERE id = sales_items.sales_transaction_id 
            AND user_id = auth.uid()::integer
        )
    );

CREATE POLICY "Users can create items for their transactions" ON sales_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_transactions 
            WHERE id = sales_items.sales_transaction_id 
            AND user_id = auth.uid()::integer
        )
    );

CREATE POLICY "Admins can view all sales items" ON sales_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for split_payments table
CREATE POLICY "Users can view their own split payments" ON split_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_transactions 
            WHERE id = split_payments.sales_transaction_id 
            AND user_id = auth.uid()::integer
        )
    );

CREATE POLICY "Users can create split payments for their transactions" ON split_payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales_transactions 
            WHERE id = split_payments.sales_transaction_id 
            AND user_id = auth.uid()::integer
        )
    );

-- Create policies for stock_additions table
CREATE POLICY "Staff and admins can view stock additions" ON stock_additions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

CREATE POLICY "Staff and admins can manage stock additions" ON stock_additions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

-- Create policies for stock_reconciliations table
CREATE POLICY "Users can view their own reconciliations" ON stock_reconciliations
    FOR SELECT USING (created_by_id = auth.uid()::integer);

CREATE POLICY "Users can create reconciliations" ON stock_reconciliations
    FOR INSERT WITH CHECK (created_by_id = auth.uid()::integer);

CREATE POLICY "Admins can view all reconciliations" ON stock_reconciliations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage all reconciliations" ON stock_reconciliations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for stock_reconciliation_items table
CREATE POLICY "Users can view items from their reconciliations" ON stock_reconciliation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stock_reconciliations 
            WHERE id = stock_reconciliation_items.reconciliation_id 
            AND created_by_id = auth.uid()::integer
        )
    );

CREATE POLICY "Admins can view all reconciliation items" ON stock_reconciliation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for stock_adjustments table
CREATE POLICY "Users can view their own adjustments" ON stock_adjustments
    FOR SELECT USING (user_id = auth.uid()::integer);

CREATE POLICY "Users can create adjustments" ON stock_adjustments
    FOR INSERT WITH CHECK (user_id = auth.uid()::integer);

CREATE POLICY "Admins can view all adjustments" ON stock_adjustments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage all adjustments" ON stock_adjustments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for audit_logs table (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for ai_content table
CREATE POLICY "Users can view their own AI content" ON ai_content
    FOR SELECT USING (user_id = auth.uid()::integer);

CREATE POLICY "Users can create AI content" ON ai_content
    FOR INSERT WITH CHECK (user_id = auth.uid()::integer);

CREATE POLICY "Admins can view all AI content" ON ai_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for rate_limits table (system table, admin only)
CREATE POLICY "Admins can view rate limits" ON rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for session_blacklist table (system table, admin only)
CREATE POLICY "Admins can view session blacklist" ON session_blacklist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for financial_transactions table
CREATE POLICY "Users can view their own financial transactions" ON financial_transactions
    FOR SELECT USING (created_by = auth.uid()::integer);

CREATE POLICY "Users can create financial transactions" ON financial_transactions
    FOR INSERT WITH CHECK (created_by = auth.uid()::integer);

CREATE POLICY "Admins can view all financial transactions" ON financial_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage all financial transactions" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for expense_details table
CREATE POLICY "Users can view their own expense details" ON expense_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM financial_transactions 
            WHERE id = expense_details.transaction_id 
            AND created_by = auth.uid()::integer
        )
    );

CREATE POLICY "Admins can view all expense details" ON expense_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for income_details table
CREATE POLICY "Users can view their own income details" ON income_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM financial_transactions 
            WHERE id = income_details.transaction_id 
            AND created_by = auth.uid()::integer
        )
    );

CREATE POLICY "Admins can view all income details" ON income_details
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for financial_reports table
CREATE POLICY "Users can view their own reports" ON financial_reports
    FOR SELECT USING (generated_by = auth.uid()::integer);

CREATE POLICY "Users can create reports" ON financial_reports
    FOR INSERT WITH CHECK (generated_by = auth.uid()::integer);

CREATE POLICY "Admins can view all reports" ON financial_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role = 'ADMIN'
        )
    );

-- Create policies for coupons table
CREATE POLICY "Authenticated users can view active coupons" ON coupons
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true 
        AND (valid_until IS NULL OR valid_until > NOW())
    );

CREATE POLICY "Staff and admins can manage coupons" ON coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::integer 
            AND role IN ('ADMIN', 'STAFF', 'MANAGER')
        )
    );

COMMIT;
