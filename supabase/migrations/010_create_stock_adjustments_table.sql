-- Create stock_adjustments table
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCREASE', 'DECREASE', 'RECOUNT', 'DAMAGE', 'TRANSFER', 'RETURN')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(500) NOT NULL,
    notes TEXT,
    reference_number VARCHAR(100),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    variant_id INTEGER, -- References product_variants if implemented
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_user_id ON stock_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_type ON stock_adjustments(type);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_reference_number ON stock_adjustments(reference_number);

-- Create updated_at trigger for stock_adjustments
CREATE TRIGGER update_stock_adjustments_updated_at BEFORE UPDATE ON stock_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to ensure quantity matches adjustment logic
ALTER TABLE stock_adjustments ADD CONSTRAINT chk_stock_adjustments_quantity_logic
    CHECK (
        (type IN ('INCREASE', 'RETURN') AND quantity > 0) OR
        (type IN ('DECREASE', 'DAMAGE', 'TRANSFER') AND quantity < 0) OR
        (type = 'RECOUNT' AND quantity IS NOT NULL)
    );

-- Add constraint to ensure stock values are non-negative
ALTER TABLE stock_adjustments ADD CONSTRAINT chk_stock_adjustments_stock_values
    CHECK (previous_stock >= 0 AND new_stock >= 0);

-- Comment on table and important columns
COMMENT ON TABLE stock_adjustments IS 'Tracks all stock adjustments with reasons and audit trail';
COMMENT ON COLUMN stock_adjustments.type IS 'Type of adjustment: INCREASE, DECREASE, RECOUNT, DAMAGE, TRANSFER, RETURN';
COMMENT ON COLUMN stock_adjustments.quantity IS 'Signed quantity change (positive for increase, negative for decrease)';
COMMENT ON COLUMN stock_adjustments.previous_stock IS 'Stock level before adjustment';
COMMENT ON COLUMN stock_adjustments.new_stock IS 'Stock level after adjustment';
COMMENT ON COLUMN stock_adjustments.reason IS 'Required reason for the adjustment';
COMMENT ON COLUMN stock_adjustments.reference_number IS 'Optional reference number (PO number, transfer ID, etc.)';
