-- Add backup link columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_link_2 text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_link_3 text;
