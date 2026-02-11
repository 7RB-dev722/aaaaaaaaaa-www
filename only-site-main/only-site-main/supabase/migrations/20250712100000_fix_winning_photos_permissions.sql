/*
# [Fix Winning Photos Visibility]
This migration ensures that images uploaded to the 'winning_photos' storage bucket are publicly visible. It addresses an issue where photos are uploaded successfully but do not appear on the public page due to incorrect storage permissions.

## Query Description:
1.  **Update Bucket to Public**: It marks the `winning-photos` bucket as public. This is a prerequisite for using simple public URLs without signed tokens. This change is safe and does not affect existing data.
2.  **Create Public Read Policy**: It creates a Row Level Security (RLS) policy that grants read-only (`SELECT`) access to all anonymous users (`anon` role) for any object within the `winning-photos` bucket. This allows `<img>` tags on your website to display the images. The policy is created idempotently by first dropping it if it exists.

This operation is safe and essential for the winning photos gallery to function correctly.

## Metadata:
- Schema-Category: ["Security", "Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects: `storage.buckets`, `storage.objects`
- Changes: Updates `public` flag on `winning-photos` bucket, adds a new RLS policy.

## Security Implications:
- RLS Status: Enabled on `storage.objects` by default in Supabase.
- Policy Changes: Yes, adds a read-only policy for anonymous users on a specific bucket. This is intended behavior for a public gallery.
- Auth Requirements: None.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible. RLS policies on storage are highly optimized.
*/

-- Step 1: Ensure the 'winning-photos' bucket is marked as public.
-- This allows files to be served via a public URL.
UPDATE storage.buckets
SET public = true
WHERE id = 'winning-photos';

-- Step 2: Create a policy to allow public read access to the 'winning-photos' bucket.
-- We first drop the policy if it exists to avoid conflicts and ensure a clean state.
DROP POLICY IF EXISTS "Allow public read access to winning photos" ON storage.objects;

-- Now, create the policy to grant anonymous read access.
CREATE POLICY "Allow public read access to winning photos"
ON storage.objects FOR SELECT
TO anon
USING ( bucket_id = 'winning-photos' );
