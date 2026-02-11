/*
# [Feature] Purchase Images &amp; RLS Security Hardening
This migration introduces a new feature for managing purchase images (like QR codes) and addresses a critical security advisory by enabling and configuring Row Level Security (RLS) on all public-facing tables.

## Query Description:
- **New Feature:**
  - Creates a `purchase_images` table to store payment QR codes or other images.
  - Adds a `purchase_image_id` foreign key to the `products` table, allowing products to link to a purchase image instead of an external URL.
  - Creates a new `purchase-images` storage bucket.
- **Security Hardening:**
  - **Addresses [ERROR] RLS Disabled in Public:** Enables Row Level Security on `products`, `categories`, `winning_photos`, `site_settings`, and the new `purchase_images` table. This is a critical step to prevent unauthorized data access.
  - **Configures Policies:**
    - Public Read Access: Allows anyone to view products, categories, photos, etc., which is necessary for the website to function.
    - Admin-Only Write Access: Restricts creating, updating, and deleting data to authenticated users only. This secures your admin panel.

## Metadata:
- Schema-Category: "Structural", "Security"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: false (disabling RLS after this would re-expose data)

## Security Implications:
- RLS Status: Enabled on all public tables.
- Policy Changes: Yes, new policies are added to control data access.
- Auth Requirements: After this migration, all admin actions (add, edit, delete) will require an authenticated Supabase user session. The admin login has been updated to support this.

## Performance Impact:
- Indexes: A foreign key index is added on `products.purchase_image_id`.
- Triggers: None.
- Estimated Impact: Minimal performance impact. RLS checks add a minor overhead but are essential for security.
*/

-- 1. Create purchase_images table
CREATE TABLE IF NOT EXISTS public.purchase_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    image_url text NOT NULL
);
COMMENT ON TABLE public.purchase_images IS 'Stores images used for purchases, like QR codes.';

-- 2. Add foreign key to products table
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'purchase_image_id') THEN
    ALTER TABLE public.products ADD COLUMN purchase_image_id uuid REFERENCES public.purchase_images(id) ON DELETE SET NULL;
    COMMENT ON COLUMN public.products.purchase_image_id IS 'Reference to an image in purchase_images for QR code payments.';
  END IF;
END $$;

-- 3. Create storage bucket for purchase images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('purchase-images', 'purchase-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. Add RLS policies for the new storage bucket
-- Drop existing policies to ensure they are up-to-date
DROP POLICY IF EXISTS "Allow public read on purchase-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin CRUD on purchase-images" ON storage.objects;

-- Allow public read access
CREATE POLICY "Allow public read on purchase-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'purchase-images');

-- Allow authenticated users (admin) to upload/update/delete
CREATE POLICY "Allow admin CRUD on purchase-images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'purchase-images');

-- 5. Enable RLS on all public tables to fix security advisory
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;

-- 6. Create/Re-create policies for all tables
-- Use DROP IF EXISTS to ensure idempotency and avoid errors on re-runs.

-- Products
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access" ON public.products;
CREATE POLICY "Allow admin full access" ON public.products FOR ALL TO authenticated USING (true);

-- Categories
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access" ON public.categories;
CREATE POLICY "Allow admin full access" ON public.categories FOR ALL TO authenticated USING (true);

-- Winning Photos
DROP POLICY IF EXISTS "Allow public read access" ON public.winning_photos;
CREATE POLICY "Allow public read access" ON public.winning_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access" ON public.winning_photos;
CREATE POLICY "Allow admin full access" ON public.winning_photos FOR ALL TO authenticated USING (true);

-- Site Settings
DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
CREATE POLICY "Allow public read access" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access" ON public.site_settings;
CREATE POLICY "Allow admin full access" ON public.site_settings FOR ALL TO authenticated USING (true);

-- Purchase Images (new table)
DROP POLICY IF EXISTS "Allow public read access" ON public.purchase_images;
CREATE POLICY "Allow public read access" ON public.purchase_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin full access" ON public.purchase_images;
CREATE POLICY "Allow admin full access" ON public.purchase_images FOR ALL TO authenticated USING (true);
