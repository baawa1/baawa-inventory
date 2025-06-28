-- Create stock_additions table for tracking stock purchases
CREATE TABLE stock_additions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_per_unit DECIMAL(10, 2) NOT NULL CHECK (cost_per_unit >= 0),
    total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost >= 0),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    reference_no VARCHAR(255), -- Invoice/receipt number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_reconciliations table for multi-product stock counts
CREATE TYPE stock_reconciliation_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE stock_reconciliations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status stock_reconciliation_status DEFAULT 'DRAFT',
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Create stock_reconciliation_items table for individual product adjustments
CREATE TABLE stock_reconciliation_items (
    id SERIAL PRIMARY KEY,
    reconciliation_id INTEGER NOT NULL REFERENCES stock_reconciliations(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    system_count INTEGER NOT NULL CHECK (system_count >= 0),
    physical_count INTEGER NOT NULL CHECK (physical_count >= 0),
    discrepancy INTEGER NOT NULL, -- Calculated as physical_count - system_count
    discrepancy_reason TEXT,
    estimated_impact DECIMAL(10, 2), -- Financial impact of the discrepancy
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_stock_additions_product_id ON stock_additions(product_id);
CREATE INDEX idx_stock_additions_supplier_id ON stock_additions(supplier_id);
CREATE INDEX idx_stock_additions_created_by ON stock_additions(created_by);
CREATE INDEX idx_stock_additions_purchase_date ON stock_additions(purchase_date);

CREATE INDEX idx_stock_reconciliations_status ON stock_reconciliations(status);
CREATE INDEX idx_stock_reconciliations_created_by ON stock_reconciliations(created_by);
CREATE INDEX idx_stock_reconciliations_approved_by ON stock_reconciliations(approved_by);
CREATE INDEX idx_stock_reconciliations_created_at ON stock_reconciliations(created_at);

CREATE INDEX idx_stock_reconciliation_items_reconciliation_id ON stock_reconciliation_items(reconciliation_id);
CREATE INDEX idx_stock_reconciliation_items_product_id ON stock_reconciliation_items(product_id);

-- Create function to automatically calculate discrepancy
CREATE OR REPLACE FUNCTION calculate_discrepancy()
RETURNS TRIGGER AS $$
BEGIN
    NEW.discrepancy = NEW.physical_count - NEW.system_count;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate discrepancy on insert/update
CREATE TRIGGER trigger_calculate_discrepancy
    BEFORE INSERT OR UPDATE ON stock_reconciliation_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_discrepancy();

-- Create function to update total_cost automatically
CREATE OR REPLACE FUNCTION calculate_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = NEW.quantity * NEW.cost_per_unit;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate total_cost on insert/update
CREATE TRIGGER trigger_calculate_total_cost
    BEFORE INSERT OR UPDATE ON stock_additions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_cost();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_stock_additions_updated_at
    BEFORE UPDATE ON stock_additions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_stock_reconciliations_updated_at
    BEFORE UPDATE ON stock_reconciliations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE stock_additions IS 'Tracks stock additions from purchases and deliveries';
COMMENT ON COLUMN stock_additions.reference_no IS 'Invoice or receipt number for the purchase';
COMMENT ON COLUMN stock_additions.cost_per_unit IS 'Unit cost at time of purchase';
COMMENT ON COLUMN stock_additions.total_cost IS 'Total cost of the stock addition (auto-calculated)';

COMMENT ON TABLE stock_reconciliations IS 'Multi-product stock reconciliation records with approval workflow';
COMMENT ON COLUMN stock_reconciliations.status IS 'DRAFT: editable, PENDING: submitted for approval, APPROVED: applied to stock, REJECTED: not applied';

COMMENT ON TABLE stock_reconciliation_items IS 'Individual product adjustments within a stock reconciliation';
COMMENT ON COLUMN stock_reconciliation_items.discrepancy IS 'Difference between physical and system count (auto-calculated)';
COMMENT ON COLUMN stock_reconciliation_items.estimated_impact IS 'Financial impact of the discrepancy based on product cost';
