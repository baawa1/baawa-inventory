-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- Insert some sample brands
INSERT INTO brands (name, description, website, is_active) VALUES
('Apple', 'Technology company known for innovative consumer electronics', 'https://www.apple.com', true),
('Samsung', 'Multinational conglomerate known for electronics and technology', 'https://www.samsung.com', true),
('Anker', 'Consumer electronics brand specializing in charging technology', 'https://www.anker.com', true),
('Belkin', 'Accessories manufacturer for consumer electronics', 'https://www.belkin.com', true),
('Logitech', 'Computer peripherals and software company', 'https://www.logitech.com', true)
ON CONFLICT (name) DO NOTHING;
