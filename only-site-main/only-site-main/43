/*
  # Fix products table schema - ensure category_id column exists

  1. Schema fixes
    - Ensure categories table exists with proper structure
    - Ensure products table has category_id column
    - Add proper foreign key relationship
    - Insert default categories if they don't exist

  2. Safety measures
    - Use IF NOT EXISTS to prevent errors
    - Preserve existing data
    - Handle edge cases gracefully
*/

-- Ensure categories table exists
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;

CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete categories"
  ON categories
  FOR DELETE
  TO public
  USING (true);

-- Insert default categories
INSERT INTO categories (name, slug) VALUES
('PUBG Mobile', 'pubg'),
('Call of Duty Mobile', 'codm')
ON CONFLICT (slug) DO NOTHING;

-- Ensure products table has the required columns
DO $$
BEGIN
  -- Add category_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid;
  END IF;

  -- Add image_path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products ADD COLUMN image_path text;
  END IF;
END $$;

-- Update existing products to have category_id based on their category field
UPDATE products 
SET category_id = (
  SELECT id FROM categories 
  WHERE slug = CASE 
    WHEN products.category = 'pubg' THEN 'pubg'
    WHEN products.category = 'codm' THEN 'codm'
    ELSE 'pubg'
  END
)
WHERE category_id IS NULL;

-- Set default category for any remaining null values
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'pubg' LIMIT 1)
WHERE category_id IS NULL;

-- Now make category_id NOT NULL
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;

-- Drop existing foreign key constraint if it exists
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- Add foreign key constraint
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies and recreate them
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;

CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images');
