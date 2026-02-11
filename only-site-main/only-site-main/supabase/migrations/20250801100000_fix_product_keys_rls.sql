/*
# [Fix Product Keys RLS Policies]
This migration adds the necessary Row-Level Security (RLS) policies to the `product_keys` table to allow administrators (authenticated users) to manage product keys.

## Query Description:
This operation enables RLS on the `product_keys` table and creates policies for INSERT, SELECT, UPDATE, and DELETE actions. This ensures that logged-in administrators can add, view, update, and delete product keys through the admin dashboard. This change is critical for the product key management feature to function correctly. There is no risk to existing data.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.product_keys`
- Policies Added:
  - `Allow authenticated insert for product_keys`
  - `Allow authenticated select for product_keys`
  - `Allow authenticated update for product_keys`
  - `Allow authenticated delete for product_keys`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Adds full CRUD permissions for any user with the `authenticated` role. This is appropriate for an admin-only table where application-level routing restricts access.
- Auth Requirements: User must be authenticated.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. RLS checks add a minor overhead, but it's essential for security.
*/

-- Enable RLS on the product_keys table if not already enabled.
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to ensure a clean state
DROP POLICY IF EXISTS "Allow authenticated insert for product_keys" ON public.product_keys;
DROP POLICY IF EXISTS "Allow authenticated select for product_keys" ON public.product_keys;
DROP POLICY IF EXISTS "Allow authenticated update for product_keys" ON public.product_keys;
DROP POLICY IF EXISTS "Allow authenticated delete for product_keys" ON public.product_keys;

-- Create new policies granting full CRUD access to authenticated users
CREATE POLICY "Allow authenticated insert for product_keys"
ON public.product_keys
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated select for product_keys"
ON public.product_keys
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated update for product_keys"
ON public.product_keys
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete for product_keys"
ON public.product_keys
FOR DELETE
TO authenticated
USING (true);
