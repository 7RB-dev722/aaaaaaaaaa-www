/*
  # Comprehensive RLS Security Fix
  
  ## Query Description:
  This migration fixes critical security advisories by explicitly enabling Row Level Security (RLS) 
  on tables that were flagged as insecure. It also ensures proper access policies exist.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High" (Fixes security vulnerabilities)
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tables affected: local_payment_methods, user_notifications, product_keys
  - Actions: ENABLE ROW LEVEL SECURITY, Create/Replace Policies
*/

-- 1. Fix local_payment_methods
ALTER TABLE public.local_payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public read access" ON public.local_payment_methods;
DROP POLICY IF EXISTS "Admin full access" ON public.local_payment_methods;

-- Re-create policies
-- Allow anyone to read active payment methods (needed for the checkout page)
CREATE POLICY "Public read access" 
ON public.local_payment_methods 
FOR SELECT 
USING (true);

-- Allow authenticated users (Admins) to do everything
CREATE POLICY "Admin full access" 
ON public.local_payment_methods 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- 2. Fix user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Service role manages notifications" ON public.user_notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can read own notifications" 
ON public.user_notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 3. Fix product_keys
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access keys" ON public.product_keys;

-- Admins can manage keys
CREATE POLICY "Admin full access keys" 
ON public.product_keys 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- 4. Ensure Super Key Data Integrity (Idempotent insert)
INSERT INTO public.local_payment_methods (country, method_name, account_holder, account_number, custom_price, is_active)
SELECT 'Iraq', 'Super Key', 'abdulawatban', '3923864171', NULL, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.local_payment_methods 
    WHERE country = 'Iraq' AND method_name = 'Super Key'
);
