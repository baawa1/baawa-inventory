-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(255),
    credit_limit DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for name search
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- Create index for active status
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- Create index for contact search
CREATE INDEX idx_suppliers_contact ON suppliers(contact_person);

-- Create index for email search  
CREATE INDEX idx_suppliers_email ON suppliers(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add unique constraint on name (case insensitive)
CREATE UNIQUE INDEX idx_suppliers_name_unique ON suppliers(LOWER(name));
