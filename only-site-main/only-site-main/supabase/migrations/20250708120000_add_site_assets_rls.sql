/*
  # RLS Policies for Site Assets Bucket
  This migration adds Row Level Security (RLS) policies to the `site-assets` storage bucket. These policies are essential for allowing authenticated users (administrators) to upload, view, update, and delete files such as the site logo and other assets managed through the "Customize Site" section of the admin panel.

  ## Query Description:
  - This script creates four policies on the `storage.objects` table, specifically for the `site-assets` bucket.
  - It grants `SELECT`, `INSERT`, `UPDATE`, and `DELETE` permissions to any user who is logged in (i.e., has the `authenticated` role).
  - This is a safe operation and does not affect existing data. It only grants permissions to perform actions. Without these policies, all attempts to modify the bucket's content will be denied by default, leading to "violates row-level security policy" errors.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (the policies can be dropped)

  ## Structure Details:
  - Table: `storage.objects`
  - Policies Added:
    - `Allow authenticated select on site-assets`
    - `Allow authenticated insert on site-assets`
    - `Allow authenticated update on site-assets`
    - `Allow authenticated delete on site-assets`

  ## Security Implications:
  - RLS Status: Policies are being enabled for a specific bucket.
  - Policy Changes: Yes, adding 4 new policies.
  - Auth Requirements: Actions are restricted to users with the `authenticated` role.

  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible. RLS checks are highly optimized in PostgreSQL.
*/

-- Enable RLS on the storage.objects table if not already enabled.
-- This is generally safe as policies will deny access by default.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Policy for SELECT
-- Allows authenticated users to view/list files in the 'site-assets' bucket.
CREATE POLICY "Allow authenticated select on site-assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'site-assets');

-- 2. Policy for INSERT
-- Allows authenticated users to upload new files to the 'site-assets' bucket.
CREATE POLICY "Allow authenticated insert on site-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');

-- 3. Policy for UPDATE
-- Allows authenticated users to update existing files in the 'site-assets' bucket.
CREATE POLICY "Allow authenticated update on site-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets');

-- 4. Policy for DELETE
-- Allows authenticated users to delete files from the 'site-assets' bucket.
CREATE POLICY "Allow authenticated delete on site-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets');
