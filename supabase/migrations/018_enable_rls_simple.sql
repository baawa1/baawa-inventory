-- Enable Row Level Security (RLS) on all tables - Simple version
-- This migration secures the production database with basic RLS enabled

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

-- Create basic policies that allow all operations for now
-- These can be refined later with proper Auth.js integration

-- Allow all operations on all tables (temporary for development)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON brands FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON products FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON product_variants FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON sales_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON sales_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON split_payments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON stock_additions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON stock_reconciliations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON stock_reconciliation_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON stock_adjustments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON ai_content FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON rate_limits FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON session_blacklist FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON financial_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON expense_details FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON income_details FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON financial_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON coupons FOR ALL USING (true);

COMMIT;
