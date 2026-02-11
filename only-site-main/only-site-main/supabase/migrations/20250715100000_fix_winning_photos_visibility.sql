/*
# [Fix Winning Photos Visibility]
This migration ensures that photos uploaded to the 'winning_photos' gallery are visible to the public by adjusting the database's Row Level Security (RLS) policies.

## Query Description:
This script enables Row Level Security on the `winning_photos` table and creates a policy that allows anyone (including anonymous visitors) to view the photo records. This change is necessary for the "Winning Photos" page to display images to the public. It does not affect any existing data and is a safe, structural change.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.winning_photos`
- Operation: Enable RLS, Create SELECT Policy

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes (Adds a public read policy)
- Auth Requirements: None for reading, making data public as intended.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. RLS adds a minor overhead, but the policy is simple (`USING (true)`).
*/

-- Step 1: Enable Row Level Security on the table if it's not already enabled.
-- This is a safe operation and won't do anything if RLS is already on.
ALTER TABLE public.winning_photos ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop the existing public read policy if it exists, to prevent errors on re-run.
DROP POLICY IF EXISTS "Allow public read access to winning photos" ON public.winning_photos;

-- Step 3: Create the policy to allow public read access.
-- This policy allows any user (anonymous or authenticated) to read all rows from the winning_photos table.
CREATE POLICY "Allow public read access to winning photos"
ON public.winning_photos
FOR SELECT
USING (true);
