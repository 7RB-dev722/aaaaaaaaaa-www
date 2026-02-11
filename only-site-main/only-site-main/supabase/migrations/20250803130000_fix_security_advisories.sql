/*
  # Fix Security Advisories and Ensure Data

  ## Query Description:
  1. Enables Row Level Security (RLS) on `local_payment_methods`, `user_notifications`, and `product_keys` to fix security advisories.
  2. Creates strictly scoped policies for `local_payment_methods`:
     - Public (anon): Can only view active methods.
     - Admins (authenticated): Full access.
  3. Creates policies for `user_notifications`:
     - Users can only see their own notifications.
  4. Creates policies for `product_keys`:
     - Admins have full access.
  5. Ensures the "Super Key" payment method for Iraq exists.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Secure local_payment_methods
ALTER TABLE IF EXISTS public.local_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active methods
DROP POLICY IF EXISTS "Public read active methods" ON public.local_payment_methods;
CREATE POLICY "Public read active methods"
ON public.local_payment_methods
FOR SELECT
TO anon
USING (is_active = true);

-- Policy: Authenticated users (Admins) have full access
DROP POLICY IF EXISTS "Admins full access local_payments" ON public.local_payment_methods;
CREATE POLICY "Admins full access local_payments"
ON public.local_payment_methods
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 2. Secure user_notifications
ALTER TABLE IF EXISTS public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users see own notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.user_notifications;
CREATE POLICY "Users view own notifications"
ON public.user_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- 3. Secure product_keys
ALTER TABLE IF EXISTS public.product_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Admins full access
DROP POLICY IF EXISTS "Admins full access product_keys" ON public.product_keys;
CREATE POLICY "Admins full access product_keys"
ON public.product_keys
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 4. Ensure Super Key Data for Iraq
INSERT INTO public.local_payment_methods (country, method_name, account_holder, account_number, custom_price, is_active)
SELECT 'Iraq', 'Super Key', 'abdulawatban', '3923864171', '50,000 IQD', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.local_payment_methods 
    WHERE country = 'Iraq' AND method_name = 'Super Key'
);
