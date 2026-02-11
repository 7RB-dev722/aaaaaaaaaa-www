/*
  # Add Product Prices to Local Payment Methods
  
  Adds a JSONB column to store product-specific price overrides.
  
  ## Changes
  - Add `product_prices` column to `local_payment_methods` table
  
  ## Structure
  - product_prices: JSONB object where key is product_id and value is the price string
    Example: {"product_uuid_1": "50,000 IQD", "product_uuid_2": "75,000 IQD"}
*/

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'local_payment_methods' AND column_name = 'product_prices') THEN
    ALTER TABLE local_payment_methods ADD COLUMN product_prices JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
