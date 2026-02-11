/*
  # [Feature] Create Purchase Intents Table with RLS

  This script creates the `purchase_intents` table to store customer information before they proceed to payment. It also sets up a helper function and Row Level Security (RLS) policies to control access to this data. This script corrects a syntax error from a previous attempt.

  ## Query Description:
  - **`is_admin()` function**: A new security function is created to check if the currently logged-in user has an 'admin' role in their metadata. This is a secure way to identify administrators. You will need to assign this role to your admin users in the Supabase dashboard.
  - **`purchase_intents` table**: A new table is created to store the country, email, and phone number of potential customers.
  - **RLS Policies**: Security policies are applied to ensure that:
    1. Anyone can submit their information (insert).
    2. Only administrators can view and delete these records.
    3. Non-admin users cannot see or modify any data in this table.
  This operation is safe and does not affect any existing data as it only creates new database objects.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (The function and table can be dropped if needed)

  ## Structure Details:
  - **New Function**: `public.is_admin()`
  - **New Table**: `public.purchase_intents`
    - Columns: `id`, `created_at`, `product_id`, `product_title`, `country`, `email`, `phone_number`
  - **New Policies**:
    - "Allow anonymous inserts" on `purchase_intents`
    - "Allow admins to view all" on `purchase_intents`
    - "Allow admins to delete" on `purchase_intents`
    - "Allow admins to insert" on `purchase_intents`

  ## Security Implications:
  - RLS Status: Enabled on `purchase_intents`.
  - Policy Changes: Yes, new policies are added for secure data access.
  - Auth Requirements: A custom claim `user_role: 'admin'` is required for admin access. See instructions below.

  ## Performance Impact:
  - Indexes: A primary key index is created on the `id` column. A foreign key is added to `product_id`.
  - Triggers: None.
  - Estimated Impact: Negligible performance impact on queries.

  ## Admin Setup Instructions:
  To make a user an admin, run the following SQL query in your Supabase SQL Editor. Replace 'YOUR_ADMIN_USER_ID' with the actual user ID from the `auth.users` table.
  
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"user_role": "admin"}'::jsonb
  WHERE id = 'YOUR_ADMIN_USER_ID';
*/

-- Create a function to check if the user is an admin
-- This function checks for a custom claim 'user_role' in the JWT.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'user_role' = 'admin', false);
$$;

-- Create the table to store purchase intents
CREATE TABLE public.purchase_intents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    product_id uuid NOT NULL,
    product_title character varying NOT NULL,
    country character varying NOT NULL,
    email character varying NOT NULL,
    phone_number character varying NOT NULL,
    CONSTRAINT purchase_intents_pkey PRIMARY KEY (id),
    CONSTRAINT purchase_intents_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- Grant usage on the new table
GRANT ALL ON TABLE public.purchase_intents TO anon;
GRANT ALL ON TABLE public.purchase_intents TO authenticated;
GRANT ALL ON TABLE public.purchase_intents TO service_role;

-- Enable Row Level Security on the new table
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- Define policies for the purchase_intents table

-- 1. Allow anonymous users to insert their own data.
CREATE POLICY "Allow anonymous inserts"
ON public.purchase_intents
FOR INSERT
TO anon
WITH CHECK (true);

-- 2. Allow admins (authenticated users with the 'admin' role) to view all data.
CREATE POLICY "Allow admins to view all"
ON public.purchase_intents
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 3. Allow admins to delete data.
CREATE POLICY "Allow admins to delete"
ON public.purchase_intents
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. Admins can also insert if needed (e.g., for testing).
CREATE POLICY "Allow admins to insert"
ON public.purchase_intents
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());
