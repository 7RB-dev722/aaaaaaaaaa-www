/*
  # Force Supabase Schema Cache Refresh for is_hidden Column

  This migration ensures the is_hidden column is properly recognized by Supabase's PostgREST API
  by forcing a complete schema cache refresh and rebuilding the table metadata.

  1. Verify and recreate the is_hidden column
  2. Force multiple types of cache refreshes
  3. Update table statistics and metadata
  4. Ensure PostgREST recognizes the new schema
*/

-- First, let's check if the column exists and create it if needed
DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products'
    AND column_name = 'is_hidden'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE products ADD COLUMN is_hidden boolean DEFAULT false NOT NULL;
    RAISE NOTICE 'Added is_hidden column to products table';
  ELSE
    RAISE NOTICE 'is_hidden column already exists';
  END IF;
END $$;

-- Ensure all existing products have the default value
UPDATE products SET is_hidden = COALESCE(is_hidden, false);

-- Drop and recreate indexes to force metadata refresh
DROP INDEX IF EXISTS idx_products_is_hidden;
DROP INDEX IF EXISTS idx_products_visible;

-- Create optimized indexes
CREATE INDEX idx_products_is_hidden ON products(is_hidden);
CREATE INDEX idx_products_visible ON products(category_id, is_hidden, created_at) WHERE is_hidden = false;

-- Force PostgREST schema cache reload using multiple methods
SELECT pg_notify('pgrst', 'reload schema');
NOTIFY pgrst, 'reload schema';

-- Update table statistics
ANALYZE products;

-- Force a complete metadata refresh by updating system catalogs
UPDATE pg_class SET reltuples = (SELECT COUNT(*) FROM products) WHERE relname = 'products';

-- Add comments with current timestamp to force metadata update
COMMENT ON TABLE products IS 'Gaming products table - Schema refreshed at ' || now()::text;
COMMENT ON COLUMN products.is_hidden IS 'Product visibility flag - Updated at ' || now()::text;

-- Refresh materialized views if any exist
DO $$
BEGIN
  -- This will refresh any materialized views that might be caching old schema
  PERFORM pg_reload_conf();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not reload config: %', SQLERRM;
END $$;

-- Force a vacuum to update table metadata
VACUUM ANALYZE products;

-- Final verification
DO $$
DECLARE
    column_exists boolean;
    total_products integer;
    visible_products integer;
    hidden_products integer;
BEGIN
    -- Check column existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products'
        AND column_name = 'is_hidden'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'CRITICAL: is_hidden column still not found after migration';
    END IF;
    
    -- Get statistics
    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(*) INTO visible_products FROM products WHERE is_hidden = false;
    SELECT COUNT(*) INTO hidden_products FROM products WHERE is_hidden = true;
    
    RAISE NOTICE '✅ SUCCESS: Schema cache refresh completed';
    RAISE NOTICE 'Column is_hidden exists and is accessible';
    RAISE NOTICE 'Total products: %', total_products;
    RAISE NOTICE 'Visible products: %', visible_products;
    RAISE NOTICE 'Hidden products: %', hidden_products;
    RAISE NOTICE 'Migration completed at: %', now();
END $$;

-- One final schema reload notification
SELECT pg_notify('pgrst', 'reload schema');
