-- Add sort_order column to products table
ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Optional: Update existing products to have a default sort order based on creation time
WITH sorted_products AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM products
)
UPDATE products
SET sort_order = sorted_products.new_order
FROM sorted_products
WHERE products.id = sorted_products.id;