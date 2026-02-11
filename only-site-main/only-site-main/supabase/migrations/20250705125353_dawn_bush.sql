/*
  # Add is_hidden column to products table

  1. Changes
    - Add `is_hidden` column to `products` table with default value `false`
    - Add index on `is_hidden` column for better query performance
    - Update existing products to have `is_hidden = false` by default

  2. Security
    - No changes to RLS policies needed as this is just adding a column
*/

-- Add the is_hidden column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- Create index for better performance when filtering by is_hidden
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON products(is_hidden);

-- Ensure all existing products have is_hidden set to false
UPDATE products SET is_hidden = false WHERE is_hidden IS NULL;
