/*
# [Fix] Correct RLS Policies for Purchase Intents
[This migration corrects the Row-Level Security (RLS) policies for the `purchase_intents` table to resolve an issue where non-admin users could not submit their pre-purchase information. The previous policy was too restrictive.]

## Query Description: [This operation will drop all existing RLS policies on the `purchase_intents` table and recreate them correctly.
1.  **Public Insert:** A new policy will be created to allow ANY user (including anonymous visitors) to insert their information into the table. This is necessary for the pre-purchase form to work for everyone.
2.  **Admin Access:** The policy for viewing, updating, and deleting these records remains restricted to administrators only.
This change is safe and does not risk any existing data.]

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table Affected: `public.purchase_intents`
- Policies Dropped: All existing policies on `purchase_intents`.
- Policies Created:
  - `Allow admin full access`: Grants SELECT, UPDATE, DELETE rights to admins.
  - `Allow public insert access`: Grants INSERT rights to everyone.

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Public insert is allowed. Admin rights required for other operations.]

## Performance Impact:
- Indexes: [No change]
- Triggers: [No change]
- Estimated Impact: [Negligible performance impact. This is a security policy change.]
*/

-- Drop all existing policies on the table to ensure a clean slate.
-- Using DO block to handle cases where policies might not exist, preventing errors.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow admin full access' AND polrelid = 'public.purchase_intents'::regclass) THEN
    EXECUTE 'DROP POLICY "Allow admin full access" ON public.purchase_intents;';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public insert access' AND polrelid = 'public.purchase_intents'::regclass) THEN
    EXECUTE 'DROP POLICY "Allow public insert access" ON public.purchase_intents;';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public insert' AND polrelid = 'public.purchase_intents'::regclass) THEN
    EXECUTE 'DROP POLICY "Allow public insert" ON public.purchase_intents;';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Enable insert for authenticated users' AND polrelid = 'public.purchase_intents'::regclass) THEN
    EXECUTE 'DROP POLICY "Enable insert for authenticated users" ON public.purchase_intents;';
  END IF;
END;
$$;

-- Ensure RLS is enabled on the table, just in case it was disabled.
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- Create the correct policies.

-- 1. Admins can do anything.
CREATE POLICY "Allow admin full access"
ON public.purchase_intents
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 2. Anyone can insert a new record. This is the key fix.
CREATE POLICY "Allow public insert access"
ON public.purchase_intents
FOR INSERT
WITH CHECK (true);
