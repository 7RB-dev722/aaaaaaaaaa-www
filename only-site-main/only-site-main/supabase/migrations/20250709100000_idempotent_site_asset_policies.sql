/*
# [Make Site Asset Policies Idempotent]
This migration script ensures that the security policies for the 'site-assets' storage bucket can be applied multiple times without causing errors. It does this by first attempting to remove any existing policies with the same names before creating them. This resolves the "policy already exists" error during migrations.

## Query Description: [This operation safely resets the security policies for the `site-assets` bucket. It first drops the policies if they exist and then recreates them. There is no risk to existing data, as this only affects permissions for uploading and viewing files in this specific bucket.]

## Metadata:
- Schema-Category: ["Security"]
- Impact-Level: ["Low"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Policies affected:
  - "Admin can upload to site-assets" on storage.objects
  - "Admin can update site-assets" on storage.objects
  - "Admin can delete from site-assets" on storage.objects
  - "Public can view site-assets" on storage.objects

## Security Implications:
- RLS Status: [Enabled]
- Policy Changes: [Yes]
- Auth Requirements: [Ensures only authenticated users can manage site assets, while anyone can view them.]

## Performance Impact:
- Indexes: [None]
- Triggers: [None]
- Estimated Impact: [Negligible. This is a metadata change.]
*/

-- Drop existing policies if they exist to avoid "already exists" errors.
-- This makes the migration script idempotent (safe to run multiple times).
DROP POLICY IF EXISTS "Admin can upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete from site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view site-assets" ON storage.objects;

-- Recreate policies for the 'site-assets' bucket.

-- Allows authenticated users to upload files to the 'site-assets' bucket.
CREATE POLICY "Admin can upload to site-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'site-assets' AND
  (select auth.uid()) IS NOT NULL
);

-- Allows authenticated users to update files in the 'site-assets' bucket.
CREATE POLICY "Admin can update site-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'site-assets' AND
  (select auth.uid()) IS NOT NULL
);

-- Allows authenticated users to delete files from the 'site-assets' bucket.
CREATE POLICY "Admin can delete from site-assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'site-assets' AND
  (select auth.uid()) IS NOT NULL
);

-- Allows anyone to view files in the 'site-assets' bucket. This is necessary for images to be publicly visible.
CREATE POLICY "Public can view site-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );
