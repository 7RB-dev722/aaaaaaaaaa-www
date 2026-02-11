/*
  # Fix Products Visibility & Permissions
  
  ## Query Description:
  This query resets and re-applies Row Level Security (RLS) policies for Products and Categories tables.
  It ensures that:
  1. Everyone (public/anon) can READ products and categories (required for the store to work).
  2. Authenticated users (admins) can DO EVERYTHING (Create, Read, Update, Delete).
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High" (Restores access to data)
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Enable RLS (Ensure it's on)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to remove conflicts or restrictive rules
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON products;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON products;
DROP POLICY IF EXISTS "Public Read" ON products;
DROP POLICY IF EXISTS "Admin Full Access" ON products;

DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON categories;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON categories;
DROP POLICY IF EXISTS "Public Read" ON categories;
DROP POLICY IF EXISTS "Admin Full Access" ON categories;

-- 3. Create CLEAN, PERMISSIVE policies for Products

-- Allow ANYONE to SELECT (Read) products (Fixes "disappearing products")
CREATE POLICY "Public Read Products" 
ON products FOR SELECT 
USING (true);

-- Allow AUTHENTICATED users (Admins) to do INSERT, UPDATE, DELETE
CREATE POLICY "Admin Write Products" 
ON products FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Create CLEAN, PERMISSIVE policies for Categories

-- Allow ANYONE to SELECT (Read) categories
CREATE POLICY "Public Read Categories" 
ON categories FOR SELECT 
USING (true);

-- Allow AUTHENTICATED users (Admins) to do INSERT, UPDATE, DELETE
CREATE POLICY "Admin Write Categories" 
ON categories FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
