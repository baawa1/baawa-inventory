-- Add performance indexes for products, brands, and categories
-- This migration adds critical indexes to improve query performance

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(is_archived, stock) WHERE is_archived = false;

-- Brands table indexes
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_name_search ON brands USING gin(to_tsvector('english', name));

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_name_search ON categories USING gin(to_tsvector('english', name));

-- Stock adjustments indexes
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_type ON stock_adjustments(type);

-- Sales items indexes
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON sales_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON sales_items(sale_id);

-- Users table indexes  
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Suppliers table indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_brand_category ON products(brand_id, category_id) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_products_search_active ON products(is_archived, stock, updated_at) WHERE is_archived = false;

-- Add comments for documentation
COMMENT ON INDEX idx_products_name_search IS 'Full-text search index for product names';
COMMENT ON INDEX idx_brands_name_search IS 'Full-text search index for brand names';
COMMENT ON INDEX idx_categories_name_search IS 'Full-text search index for category names';
COMMENT ON INDEX idx_products_active_stock IS 'Optimized index for active products with stock filtering';
COMMENT ON INDEX idx_products_brand_category IS 'Composite index for brand and category filtering';
COMMENT ON INDEX idx_products_search_active IS 'Composite index for search and filtering active products';
