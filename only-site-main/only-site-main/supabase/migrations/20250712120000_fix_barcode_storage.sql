/*
  # [Fix] Barcode Image Storage Setup
  This script corrects a previous migration error and properly configures the Supabase storage bucket for barcode images.

  ## Query Description: 
  - Creates a new storage bucket named 'barcode-images' if it doesn't already exist.
  - Sets appropriate Row Level Security (RLS) policies to allow public viewing of barcodes and secure uploads by authenticated admin users.
  - This operation is safe and will not affect existing data. It corrects a syntax error from a previous script.

  ## Metadata:
  - Schema-Category: ["Structural"]
  - Impact-Level: ["Low"]
  - Requires-Backup: [false]
  - Reversible: [true]

  ## Structure Details:
  - storage.buckets: Inserts one row for 'barcode-images'.
  - storage.objects: Adds four RLS policies for the 'barcode-images' bucket.

  ## Security Implications:
  - RLS Status: [Enabled]
  - Policy Changes: [Yes]
  - Auth Requirements: [Public read, Authenticated write/update/delete]

  ## Performance Impact:
  - Indexes: [None]
  - Triggers: [None]
  - Estimated Impact: [Negligible]
*/

-- Step 1: Create the storage bucket for barcode images if it does not exist.
-- This bucket is not public by default; access is controlled by RLS policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'barcode-images', 'barcode-images', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'barcode-images'
);

-- Step 2: Grant usage permissions on the schema to the necessary roles.
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON TABLE storage.buckets TO anon, authenticated;
GRANT SELECT ON TABLE storage.objects TO anon, authenticated;

-- Step 3: Drop any potentially lingering incorrect policies from the previous failed attempt.
-- This ensures a clean state before creating the correct policies.
DROP POLICY IF EXISTS "Public read access for barcode images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload to barcode-images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update barcode images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete barcode images" ON storage.objects;

-- Step 4: Create a policy to allow public (anon) read access to files in the 'barcode-images' bucket.
-- This is necessary so the barcode can be displayed on the public payment page.
CREATE POLICY "Public read access for barcode images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'barcode-images' );

-- Step 5: Create a policy that allows authenticated users (our admin) to insert into the 'barcode-images' bucket.
CREATE POLICY "Admin can upload to barcode-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'barcode-images' );

-- Step 6: Create a policy to allow the owner of a file to update it.
-- The owner is the user who uploaded the file.
CREATE POLICY "Admin can update barcode images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'barcode-images' AND auth.uid() = owner );

-- Step 7: Create a policy to allow the owner of a file to delete it.
CREATE POLICY "Admin can delete barcode images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'barcode-images' AND auth.uid() = owner );
