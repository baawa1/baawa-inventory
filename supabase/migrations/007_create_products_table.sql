-- Create products table with the schema that matches the Prisma model
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    cost DECIMAL(10, 2) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0 USING INDEX CONCURRENTLY,
    max_stock INTEGER,
    unit VARCHAR(50) DEFAULT 'pcs',
    weight DECIMAL(8, 3),
    dimensions VARCHAR(255),
    color VARCHAR(100),
    size VARCHAR(100),
    material VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    has_variants BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    images JSONB,
    tags TEXT[] DEFAULT '{}',
    meta_title VARCHAR(255),
    meta_description TEXT,
    seo_keywords TEXT[] DEFAULT '{}',
    supplier_id INTEGER REFERENCES suppliers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_archived ON products(is_archived);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Create updated_at trigger for products
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Insert some sample products
INSERT INTO products (name, description, sku, category, brand, cost, price, stock, min_stock) VALUES
('iPhone 13', 'Latest Apple smartphone with advanced features', 'IPHONE13-128', 'Electronics', 'Apple', 699.00, 999.00, 50, 10),
('Samsung Galaxy S21', 'High-performance Android smartphone', 'GALAXY-S21-256', 'Electronics', 'Samsung', 599.00, 849.00, 30, 5),
('MacBook Pro 14"', 'Professional laptop for creative work', 'MBP14-M1PRO', 'Electronics', 'Apple', 1799.00, 2499.00, 15, 3),
('Wireless Headphones', 'Premium noise-cancelling headphones', 'WH-XM4-BLK', 'Electronics', 'Sony', 199.00, 349.00, 25, 5),
('USB-C Hub', 'Multi-port adapter for modern devices', 'USBC-HUB-7IN1', 'Electronics', 'Anker', 29.00, 59.00, 100, 20)
ON CONFLICT (sku) DO NOTHING;
