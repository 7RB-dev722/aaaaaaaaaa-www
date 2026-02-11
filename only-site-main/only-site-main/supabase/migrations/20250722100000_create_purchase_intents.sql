/*
          # Create Purchase Intents Table
          This migration creates a new table `purchase_intents` to store customer information collected before they proceed to the payment page. It also sets up Row Level Security to protect this data.

          ## Query Description: This operation creates a new table and enables Row Level Security. It is a non-destructive structural change and should not impact existing data.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Table Created: `public.purchase_intents`
          - Columns: `id`, `created_at`, `product_id`, `product_title`, `country`, `email`, `phone_number`

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes, new policies are created for the `purchase_intents` table.
          - Auth Requirements: Policies restrict access to authenticated admin users (`service_role`).

          ## Performance Impact:
          - Indexes: A primary key index is added on the `id` column.
          - Triggers: None
          - Estimated Impact: Low. This is a new table and will not affect the performance of existing queries.
          */

-- 1. Create the purchase_intents table
CREATE TABLE IF NOT EXISTS public.purchase_intents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    product_id uuid,
    product_title text,
    country text,
    email text,
    phone_number text,
    CONSTRAINT purchase_intents_pkey PRIMARY KEY (id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- 3. Grant permissions to roles
GRANT ALL ON TABLE public.purchase_intents TO anon;
GRANT ALL ON TABLE public.purchase_intents TO authenticated;
GRANT ALL ON TABLE public.purchase_intents TO service_role;

-- 4. Create RLS policies
-- Allow service_role to perform all actions (for admin panel access)
CREATE POLICY "Allow full access for service_role"
ON public.purchase_intents
FOR ALL
TO service_role
USING (true);

-- Allow anonymous users to insert their own intent.
-- This is necessary for the pre-purchase form to work for non-logged-in users.
CREATE POLICY "Allow anonymous inserts"
ON public.purchase_intents
FOR INSERT
TO anon
WITH CHECK (true);

-- Disallow public read access
CREATE POLICY "Disallow public read"
ON public.purchase_intents
FOR SELECT
TO anon, authenticated
USING (false);

-- Disallow public update/delete access
CREATE POLICY "Disallow public update and delete"
ON public.purchase_intents
FOR UPDATE, DELETE
TO anon, authenticated
USING (false);

COMMENT ON TABLE public.purchase_intents IS 'Stores customer information collected before proceeding to payment.';
