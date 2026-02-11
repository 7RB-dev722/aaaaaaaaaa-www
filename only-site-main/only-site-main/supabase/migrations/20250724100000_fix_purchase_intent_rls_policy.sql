/*
# [FIX] Correct RLS Policy for Purchase Intents
This migration corrects the Row-Level Security (RLS) policy for the `purchase_intents` table. The previous policy was too restrictive, preventing anonymous users from submitting their information before a purchase, which caused the "violates row-level security policy" error.

## Query Description:
This script will:
1. Drop any existing 'INSERT' policy for anonymous users on the `purchase_intents` table to ensure a clean state.
2. Create a new, correct 'INSERT' policy that explicitly allows anonymous users (`anon` role) to add new rows.

This change is safe and necessary for the pre-purchase form to function correctly. It does not affect any existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the new policy and recreating the old one, though not recommended)

## Structure Details:
- Table affected: `public.purchase_intents`
- Policies affected:
  - `Allow anonymous inserts` (or similar name) will be dropped and recreated.

## Security Implications:
- RLS Status: Remains enabled.
- Policy Changes: Yes. The `INSERT` policy for the `anon` role is being corrected to be less restrictive, which is the intended behavior for this feature. This allows the public-facing form to work.
- Auth Requirements: This specifically targets the `anon` role.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. RLS policy checks are very fast.
*/

-- First, drop any potentially conflicting INSERT policies for the 'anon' role.
-- We try dropping a few common names to be safe.
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.purchase_intents;

-- Now, create the correct policy that allows any anonymous user to insert.
-- This is required for the pre-purchase information form to work.
CREATE POLICY "Allow anonymous inserts"
ON public.purchase_intents
FOR INSERT TO anon
WITH CHECK (true);
