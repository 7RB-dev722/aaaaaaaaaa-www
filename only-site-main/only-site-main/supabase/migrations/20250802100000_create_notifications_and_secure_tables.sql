/*
  # [STRUCTURAL & SECURITY] Create Notifications Table and Secure All Public Tables
  This comprehensive migration script performs two critical functions:
  1. Creates the 'user_notifications' table required for the application's notification system.
  2. Enables and enforces Row Level Security (RLS) across all public tables to fix critical security vulnerabilities.

  ## Query Description:
  This is a CRITICAL security update. It creates the missing table and then restricts data access based on user roles, protecting your application from unauthorized access.
  - Publicly readable data (products, categories) will remain accessible.
  - Admin-only data (purchase intents, product keys) will be restricted to authenticated users.
  - User-specific data (notifications) will be accessible only to the owner.
  This script is idempotent, meaning it is safe to run multiple times.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true (by disabling RLS or altering policies)
*/

-- Step 1: Create the missing user_notifications table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    is_read boolean NOT NULL DEFAULT false,
    title text NOT NULL,
    message text NULL,
    metadata jsonb NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
    CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Step 2: Enable RLS on all relevant public tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_photos ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all potentially conflicting old policies idempotently
DROP POLICY IF EXISTS "Allow admin access" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
DROP POLICY IF EXISTS "Allow admin access" ON public.invoice_templates;
DROP POLICY IF EXISTS "Allow admin access" ON public.product_keys;
DROP POLICY IF EXISTS "Allow admin access" ON public.products;
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow admin access" ON public.purchase_images;
DROP POLICY IF EXISTS "Allow public read access" ON public.purchase_images;
DROP POLICY IF EXISTS "Allow admin access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow admin access" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Allow individual access" ON public.user_notifications;
DROP POLICY IF EXISTS "Allow individual read access" ON public.user_notifications;
DROP POLICY IF EXISTS "Allow individual update" ON public.user_notifications;
DROP POLICY IF EXISTS "Allow admin access" ON public.winning_photos;
DROP POLICY IF EXISTS "Allow public read access" ON public.winning_photos;

-- Step 4: Create correct policies for all tables

-- == Tables with PUBLIC READ access and ADMIN WRITE access ==
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.products FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.purchase_images FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.purchase_images FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" ON public.winning_photos FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.winning_photos FOR ALL USING (auth.role() = 'authenticated');

-- == Tables with ADMIN-ONLY access ==
CREATE POLICY "Allow admin access" ON public.invoice_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin access" ON public.product_keys FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin access" ON public.purchase_intents FOR ALL USING (auth.role() = 'authenticated');

-- == Tables with USER-SPECIFIC access ==
CREATE POLICY "Allow individual read access" ON public.user_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow individual update" ON public.user_notifications FOR UPDATE USING (auth.uid() = user_id);
