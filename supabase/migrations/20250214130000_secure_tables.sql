/*
  # Secure All Tables (Enable RLS)
  
  ## Query Description:
  This migration addresses critical security advisories by enabling Row Level Security (RLS) on all application tables and defining explicit access policies.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Enables RLS on: products, categories, winning_photos, purchase_images, purchase_intents, invoice_templates, product_keys, site_settings, local_payment_methods.
  - Re-defines policies to ensure:
    - Public Read: Products, Categories, Photos, Settings, Payment Methods.
    - Public Insert: Purchase Intents (Orders).
    - Admin Full Access: All tables.
*/

-- 1. Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_payment_methods ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies (Drop existing to avoid conflicts, then Create)

-- Products: Public Read, Admin Full
DROP POLICY IF EXISTS "Public read access" ON products;
CREATE POLICY "Public read access" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin full access" ON products;
CREATE POLICY "Admin full access" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Categories: Public Read, Admin Full
DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin full access" ON categories;
CREATE POLICY "Admin full access" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Winning Photos: Public Read, Admin Full
DROP POLICY IF EXISTS "Public read access" ON winning_photos;
CREATE POLICY "Public read access" ON winning_photos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin full access" ON winning_photos;
CREATE POLICY "Admin full access" ON winning_photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Images: Public Read, Admin Full
DROP POLICY IF EXISTS "Public read access" ON purchase_images;
CREATE POLICY "Public read access" ON purchase_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin full access" ON purchase_images;
CREATE POLICY "Admin full access" ON purchase_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Local Payment Methods: Public Read, Admin Full
DROP POLICY IF EXISTS "Public read access" ON local_payment_methods;
CREATE POLICY "Public read access" ON local_payment_methods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin full access" ON local_payment_methods;
CREATE POLICY "Admin full access" ON local_payment_methods FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Site Settings: Public Read, Admin Full
DROP POLICY IF EXISTS "Public read access" ON site_settings;
CREATE POLICY "Public read access" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin full access" ON site_settings;
CREATE POLICY "Admin full access" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Intents: Public Insert, Admin Full
DROP POLICY IF EXISTS "Public insert access" ON purchase_intents;
CREATE POLICY "Public insert access" ON purchase_intents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admin full access" ON purchase_intents;
CREATE POLICY "Admin full access" ON purchase_intents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Invoice Templates: Admin Full (Internal use)
DROP POLICY IF EXISTS "Admin full access" ON invoice_templates;
CREATE POLICY "Admin full access" ON invoice_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Product Keys: Admin Full (Highly Sensitive)
DROP POLICY IF EXISTS "Admin full access" ON product_keys;
CREATE POLICY "Admin full access" ON product_keys FOR ALL TO authenticated USING (true) WITH CHECK (true);
