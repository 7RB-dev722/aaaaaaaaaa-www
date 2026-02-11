/*
  # Fix Local Payments RLS and Add Initial Data
  
  ## Security Updates
  - Enable Row Level Security (RLS) on `local_payment_methods` table
  - Add policy for Public Read Access (so users can see payment methods)
  - Add policy for Admin Full Access (so admins can manage methods)

  ## Data Migration
  - Insert the "Super Key" payment method for Iraq as requested
*/

-- 1. Enable RLS
ALTER TABLE IF EXISTS public.local_payment_methods ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies

-- Allow public to view active payment methods
DROP POLICY IF EXISTS "Public can view active local payment methods" ON public.local_payment_methods;
CREATE POLICY "Public can view active local payment methods"
ON public.local_payment_methods
FOR SELECT
TO public
USING (true);

-- Allow authenticated users (Admins) to do everything
DROP POLICY IF EXISTS "Admins can manage local payment methods" ON public.local_payment_methods;
CREATE POLICY "Admins can manage local payment methods"
ON public.local_payment_methods
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Insert "Super Key" for Iraq
INSERT INTO public.local_payment_methods (country, method_name, account_holder, account_number, custom_price, is_active)
SELECT 'Iraq', 'Super Key', 'abdulawatban', '3923864171', '50,000 IQD', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.local_payment_methods WHERE country = 'Iraq' AND method_name = 'Super Key'
);
