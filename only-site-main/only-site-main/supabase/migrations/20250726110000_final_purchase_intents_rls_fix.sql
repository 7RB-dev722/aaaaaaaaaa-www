-- Drop all existing policies on purchase_intents to ensure a clean slate.
DROP POLICY IF EXISTS "Allow admin access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.purchase_intents;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow public insert access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow admin select access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow admin update access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow admin delete access" ON public.purchase_intents;


/*
          # [Fix] Final RLS Policy for Purchase Intents
          This script provides a definitive fix for the Row-Level Security (RLS) policies on the `purchase_intents` table. It ensures that any visitor can submit their information before purchase, while restricting all other access to administrators only.

          ## Query Description: This operation will reset and correctly apply the security rules for the `purchase_intents` table. It drops all previous, potentially incorrect policies and creates a new set of rules. The most critical change is allowing **public insert access**, which resolves the error users were facing.

          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Affects Table: `public.purchase_intents`
          - Policies Reset: `SELECT`, `INSERT`, `UPDATE`, `DELETE`

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
            - **INSERT:** Now allows public access (`anon` and `authenticated` roles). This is the fix.
            - **SELECT, UPDATE, DELETE:** Restricted to administrators only, using the `is_admin()` function.
          - Auth Requirements: `is_admin()` function must exist for admin operations.

          ## Performance Impact:
          - Indexes: No change.
          - Triggers: No change.
          - Estimated Impact: Negligible. RLS policy checks are highly optimized.
          */

-- 1. Enable RLS on the table if it's not already enabled.
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

-- 2. Create the policy to ALLOW ALL INSERTS. This is the key fix.
-- This allows anonymous users to submit the pre-purchase form.
CREATE POLICY "Allow public insert access"
ON public.purchase_intents
FOR INSERT
WITH CHECK (true);

-- 3. Create the policy to allow ONLY ADMINS to SELECT (view) the data.
CREATE POLICY "Allow admin select access"
ON public.purchase_intents
FOR SELECT
USING (is_admin(auth.uid()));

-- 4. Create the policy to allow ONLY ADMINS to UPDATE the data.
CREATE POLICY "Allow admin update access"
ON public.purchase_intents
FOR UPDATE
USING (is_admin(auth.uid()));

-- 5. Create the policy to allow ONLY ADMINS to DELETE the data.
CREATE POLICY "Allow admin delete access"
ON public.purchase_intents
FOR DELETE
USING (is_admin(auth.uid()));
