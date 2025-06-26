-- Create purchase_orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'PENDING',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_order_items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    received_qty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for purchase orders
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX idx_purchase_orders_number ON purchase_orders(order_number);

-- Create indexes for purchase order items
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- Create updated_at trigger for purchase_orders
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint checks
ALTER TABLE purchase_orders ADD CONSTRAINT chk_purchase_order_status 
    CHECK (status IN ('PENDING', 'ORDERED', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED'));

ALTER TABLE purchase_order_items ADD CONSTRAINT chk_purchase_order_items_quantity 
    CHECK (quantity > 0);

ALTER TABLE purchase_order_items ADD CONSTRAINT chk_purchase_order_items_received_qty 
    CHECK (received_qty >= 0 AND received_qty <= quantity);
