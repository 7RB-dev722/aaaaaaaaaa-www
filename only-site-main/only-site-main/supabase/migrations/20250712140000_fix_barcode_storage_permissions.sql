/*
          # [Operation Name]
          Fix Barcode Image Storage Permissions

          ## Query Description: [This script corrects the permissions for the 'barcode-images' storage bucket. It ensures that authenticated users (admins) can upload, update, and delete images, while public users can view them. This fixes the issue where uploaded barcode images were not visible on the payment page.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Affects policies on the `storage.objects` table for the `barcode-images` bucket.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Grants SELECT to public, and ALL to authenticated]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible. This is a permissions change.]
          */

-- Step 1: Create the 'barcode-images' bucket if it doesn't exist and ensure it is public.
-- This is idempotent and safe to run multiple times.
INSERT INTO storage.buckets (id, name, public)
VALUES ('barcode-images', 'barcode-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Drop existing policies for the barcode bucket to ensure a clean state.
-- This makes the script re-runnable without errors.
DROP POLICY IF EXISTS "Allow authenticated users to manage barcodes" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to barcodes" ON storage.objects;

-- Step 3: Create a policy to allow authenticated users (admins) to upload, update, and delete barcode images.
CREATE POLICY "Allow authenticated users to manage barcodes"
ON storage.objects
FOR ALL -- Covers INSERT, UPDATE, DELETE, SELECT
TO authenticated
USING (bucket_id = 'barcode-images')
WITH CHECK (bucket_id = 'barcode-images');

-- Step 4: Create a policy to allow public (anonymous) users to view the barcode images.
-- This is crucial for the images to be displayed on the public-facing payment page.
CREATE POLICY "Allow public read access to barcodes"
ON storage.objects
FOR SELECT
TO public -- 'public' is a synonym for the 'anon' role in this context
USING (bucket_id = 'barcode-images');
