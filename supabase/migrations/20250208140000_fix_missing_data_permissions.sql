/*
  # Fix Missing Data Permissions (RLS Policies)
  
  This migration fixes the issue where Products and Categories do not appear in the Admin Panel.
  It ensures that:
  1. Row Level Security (RLS) is enabled for security.
  2. Public users can READ (Select) products and categories (required for the store to work).
  3. Authenticated users (Admins) can DO EVERYTHING (Select, Insert, Update, Delete).
  
  ## Tables Affected:
  - products
  - categories
  - winning_photos
  - purchase_images
  - purchase_intents
  - product_keys
  - invoice_templates
  - site_settings
*/

-- 1. Products Table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for products" ON products;
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for products" ON products;
CREATE POLICY "Admin full access for products" ON products FOR ALL USING (auth.role() = 'authenticated');

-- 2. Categories Table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for categories" ON categories;
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for categories" ON categories;
CREATE POLICY "Admin full access for categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- 3. Winning Photos
ALTER TABLE winning_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for winning_photos" ON winning_photos;
CREATE POLICY "Public read access for winning_photos" ON winning_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for winning_photos" ON winning_photos;
CREATE POLICY "Admin full access for winning_photos" ON winning_photos FOR ALL USING (auth.role() = 'authenticated');

-- 4. Purchase Images
ALTER TABLE purchase_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for purchase_images" ON purchase_images;
CREATE POLICY "Public read access for purchase_images" ON purchase_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for purchase_images" ON purchase_images;
CREATE POLICY "Admin full access for purchase_images" ON purchase_images FOR ALL USING (auth.role() = 'authenticated');

-- 5. Purchase Intents (Orders)
-- Public can INSERT (create order), but only Admin can SELECT/UPDATE/DELETE
ALTER TABLE purchase_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert access for purchase_intents" ON purchase_intents;
CREATE POLICY "Public insert access for purchase_intents" ON purchase_intents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access for purchase_intents" ON purchase_intents;
CREATE POLICY "Admin full access for purchase_intents" ON purchase_intents FOR ALL USING (auth.role() = 'authenticated');

-- 6. Product Keys (Sensitive!)
-- Only Admin should access this
ALTER TABLE product_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access for product_keys" ON product_keys;
CREATE POLICY "Admin full access for product_keys" ON product_keys FOR ALL USING (auth.role() = 'authenticated');

-- 7. Invoice Templates
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for invoice_templates" ON invoice_templates;
CREATE POLICY "Public read access for invoice_templates" ON invoice_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for invoice_templates" ON invoice_templates;
CREATE POLICY "Admin full access for invoice_templates" ON invoice_templates FOR ALL USING (auth.role() = 'authenticated');

-- 8. Site Settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for site_settings" ON site_settings;
CREATE POLICY "Public read access for site_settings" ON site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access for site_settings" ON site_settings;
CREATE POLICY "Admin full access for site_settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
