/*
  # Fix missing image_path column in products table

  1. Schema fixes
    - Ensure image_path column exists in products table
    - Add proper indexing for better performance
    - Verify all required columns are present

  2. Safety measures
    - Use IF NOT EXISTS to prevent errors
    - Preserve existing data
    - Handle edge cases gracefully
*/

-- Ensure the image_path column exists in the products table
DO $$
BEGIN
  -- Check if image_path column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products ADD COLUMN image_path text;
    RAISE NOTICE 'Added image_path column to products table';
  ELSE
    RAISE NOTICE 'image_path column already exists in products table';
  END IF;

  -- Ensure category_id column exists and is properly configured
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid;
    RAISE NOTICE 'Added category_id column to products table';
  END IF;

  -- Ensure categories table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'categories'
  ) THEN
    CREATE TABLE categories (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL UNIQUE,
      slug text NOT NULL UNIQUE,
      created_at timestamptz DEFAULT now()
    );
    
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    
    -- Add policies for categories
    CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO public USING (true);
    CREATE POLICY "Anyone can insert categories" ON categories FOR INSERT TO public WITH CHECK (true);
    CREATE POLICY "Anyone can update categories" ON categories FOR UPDATE TO public USING (true);
    CREATE POLICY "Anyone can delete categories" ON categories FOR DELETE TO public USING (true);
    
    -- Insert default categories
    INSERT INTO categories (name, slug) VALUES
    ('PUBG Mobile', 'pubg'),
    ('Call of Duty Mobile', 'codm');
    
    RAISE NOTICE 'Created categories table with default data';
  END IF;
END $$;

-- Update existing products to have proper category_id if they don't have one
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

-- Ensure foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_category_id_fkey'
    AND table_name = 'products'
    AND table_schema = 'public'
  ) THEN
    -- First make sure all products have a valid category_id
    UPDATE products 
    SET category_id = (SELECT id FROM categories WHERE slug = 'pubg' LIMIT 1)
    WHERE category_id IS NULL;
    
    -- Make category_id NOT NULL if it isn't already
    ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
    
    -- Add the foreign key constraint
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint for category_id';
  END IF;
END $$;

-- Ensure storage bucket exists for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Ensure storage policies exist
DO $$
BEGIN
  -- Check if policies exist, if not create them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view product images'
  ) THEN
    CREATE POLICY "Anyone can view product images"
      ON storage.objects
      FOR SELECT
      USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can upload product images'
  ) THEN
    CREATE POLICY "Anyone can upload product images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can update product images'
  ) THEN
    CREATE POLICY "Anyone can update product images"
      ON storage.objects
      FOR UPDATE
      USING (bucket_id = 'product-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can delete product images'
  ) THEN
    CREATE POLICY "Anyone can delete product images"
      ON storage.objects
      FOR DELETE
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Add helpful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Refresh the schema cache by updating a system table (this forces Supabase to refresh)
NOTIFY pgrst, 'reload schema';
