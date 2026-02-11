-- Add column for alternative payment links
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS alternative_links JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN products.alternative_links IS 'Array of additional payment links objects {label, url}';
