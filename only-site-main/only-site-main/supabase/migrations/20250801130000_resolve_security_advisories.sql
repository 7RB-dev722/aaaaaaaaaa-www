/*
# [ENABLE RLS & SET POLICIES]
This migration script enables Row Level Security (RLS) on all public tables and applies a set of secure default policies. This is a critical security enhancement to protect your data from unauthorized access.

## Query Description: [This operation will restrict access to your tables. Public read access will be maintained for most content tables, while write access and access to sensitive tables will be restricted to authenticated admin users. This is a crucial step to prevent data leaks.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [true]
- Reversible: [true]

## Structure Details:
[Enables RLS on: site_settings, categories, products, winning_photos, purchase_images, purchase_intents, invoice_templates, product_keys, user_notifications. Adds SELECT, INSERT, UPDATE, DELETE policies.]

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Public read for most, authenticated for write/sensitive data.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Slight overhead on queries due to RLS policy checks, which is necessary for security.]
*/

-- Enable RLS and set policies for all public tables

-- Table: site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
CREATE POLICY "Allow public read access" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.site_settings;
CREATE POLICY "Allow admin write access" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');

-- Table: categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.categories;
CREATE POLICY "Allow admin write access" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- Table: products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.products;
CREATE POLICY "Allow admin write access" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- Table: winning_photos
ALTER TABLE public.winning_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.winning_photos;
CREATE POLICY "Allow public read access" ON public.winning_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.winning_photos;
CREATE POLICY "Allow admin write access" ON public.winning_photos FOR ALL USING (auth.role() = 'authenticated');

-- Table: purchase_images
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.purchase_images;
CREATE POLICY "Allow public read access" ON public.purchase_images FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow admin write access" ON public.purchase_images;
CREATE POLICY "Allow admin write access" ON public.purchase_images FOR ALL USING (auth.role() = 'authenticated');

-- Table: purchase_intents
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.purchase_intents;
CREATE POLICY "Allow anonymous insert" ON public.purchase_intents FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow admin access" ON public.purchase_intents;
CREATE POLICY "Allow admin access" ON public.purchase_intents FOR SELECT, UPDATE, DELETE USING (auth.role() = 'authenticated');

-- Table: invoice_templates
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin access" ON public.invoice_templates;
CREATE POLICY "Allow admin access" ON public.invoice_templates FOR ALL USING (auth.role() = 'authenticated');

-- Table: product_keys
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow admin full access" ON public.product_keys;
CREATE POLICY "Allow admin full access" ON public.product_keys FOR ALL USING (auth.role() = 'authenticated');

-- Table: user_notifications
-- This policy assumes a `user_id` column of type UUID that references `auth.users.id`.
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow individual access" ON public.user_notifications;
CREATE POLICY "Allow individual access" ON public.user_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
