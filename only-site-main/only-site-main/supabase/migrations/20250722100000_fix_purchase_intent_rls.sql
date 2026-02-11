/*
# [Fix] Correct Purchase Intents RLS Policies
This migration corrects the Row Level Security (RLS) policies for the `purchase_intents` table to resolve an issue where anonymous users could not submit their pre-purchase information. The previous policy was too restrictive.

## Query Description:
This script modifies security policies. It first removes any existing policies on the `purchase_intents` table to prevent conflicts and then creates new, correct ones.
- The new `INSERT` policy allows any user (including anonymous visitors) to add their information. This is safe as it only allows adding new rows.
- The `SELECT`, `UPDATE`, and `DELETE` policies are restricted to administrators only, ensuring that customer data is protected and can only be managed from the admin dashboard.
There is no risk of data loss with this operation.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.purchase_intents`
- Policies Affected: `Allow public insert`, `Allow admin full access`

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. Policies for `purchase_intents` are being replaced.
- Auth Requirements: `INSERT` is now public. `SELECT`, `UPDATE`, `DELETE` require admin privileges via the `is_admin()` function.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. RLS policy checks have minimal overhead.
*/

-- Step 1: Ensure RLS is enabled on the table.
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies to avoid conflicts.
DROP POLICY IF EXISTS "Allow admin full access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow public insert" ON public.purchase_intents;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.purchase_intents;


-- Step 3: Create a policy to allow anonymous users to INSERT.
-- This is crucial for the pre-purchase form to work for visitors.
CREATE POLICY "Allow public insert"
ON public.purchase_intents
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 4: Create a policy that gives administrators full access (SELECT, UPDATE, DELETE).
-- This secures the data so only admins can view or manage it.
CREATE POLICY "Allow admin full access"
ON public.purchase_intents
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
