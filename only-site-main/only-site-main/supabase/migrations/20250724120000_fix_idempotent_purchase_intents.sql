/*
          # [Fix and Create Purchase Intents Table and Policies (Idempotent)]
          This script safely creates the `purchase_intents` table, an admin-checking function, and the necessary Row Level Security (RLS) policies. It is designed to be run multiple times without causing errors, as it checks for the existence of objects before creating or replacing them.

          ## Query Description: [This operation will create or update the schema for storing customer pre-purchase information. It ensures that only administrators can view or delete this data, while any authenticated user can submit their own information. No existing data will be lost if the table already exists.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables Affected: `public.purchase_intents`
          - Functions Affected: `public.is_admin()`
          - Policies Affected: RLS policies for SELECT, INSERT, DELETE on `public.purchase_intents`
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Admin role for viewing/deleting, Authenticated for inserting]
          
          ## Performance Impact:
          - Indexes: [Primary Key on `id`]
          - Triggers: [None]
          - Estimated Impact: [Low. This is a standard setup for a new table.]
          */

-- Create the table only if it doesn't exist
CREATE TABLE IF NOT EXISTS public.purchase_intents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    product_id uuid NOT NULL,
    product_title character varying NOT NULL,
    country character varying NOT NULL,
    email character varying NOT NULL,
    phone_number character varying,
    CONSTRAINT purchase_intents_pkey PRIMARY KEY (id),
    CONSTRAINT purchase_intents_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE public.purchase_intents TO authenticated;

-- Create or replace the admin-checking function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user has the 'admin' role in their app_metadata
  -- This is a secure way to check for admin privileges
  RETURN (
    SELECT raw_app_meta_data->>'is_admin'
    FROM auth.users
    WHERE id = auth.uid()
  )::boolean;
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

-- Enable RLS on the table
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create them
DROP POLICY IF EXISTS "Admins can view all purchase intents" ON public.purchase_intents;
CREATE POLICY "Admins can view all purchase intents"
    ON public.purchase_intents
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own purchase intent" ON public.purchase_intents;
CREATE POLICY "Users can insert their own purchase intent"
    ON public.purchase_intents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete purchase intents" ON public.purchase_intents;
CREATE POLICY "Admins can delete purchase intents"
    ON public.purchase_intents
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

/*
# ADMIN SETUP INSTRUCTION
After this migration is applied, you need to grant admin rights to your user.
You can do this in your Supabase dashboard under "Authentication" -> "Users".
Find your user, click "Edit user", and under "User App Metadata", add the following JSON:
{
  "is_admin": true
}
*/
