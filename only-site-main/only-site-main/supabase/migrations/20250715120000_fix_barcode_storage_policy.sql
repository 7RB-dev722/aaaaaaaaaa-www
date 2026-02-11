/*
# [Fix Barcode Image Upload Permissions]
This migration script resolves the "row-level security policy" error by setting the correct permissions on the `barcode-images` storage bucket. It allows public read access so customers can see the QR codes, and restricts write access (upload, update, delete) to authenticated admin users.

## Query Description: [This operation updates security policies for the `barcode-images` storage bucket. It ensures that previously uploaded images remain accessible while allowing new uploads from the admin panel. There is no risk to existing data.]

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects RLS policies on the `storage.objects` table for the `barcode-images` bucket.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: [Grants SELECT to `public` and INSERT/UPDATE/DELETE to `authenticated` users for the `barcode-images` bucket.]

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: [Negligible. RLS policy checks have minimal overhead.]
*/

-- 1. Create a policy to allow public read access on the 'barcode-images' bucket.
-- This allows anyone to view the QR codes on the payment page.
CREATE POLICY "Public Read Access for Barcode Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barcode-images');

-- 2. Create a policy to allow authenticated users (admin) to manage images in the 'barcode-images' bucket.
-- This covers uploading (INSERT), updating (UPDATE), and deleting (DELETE).
CREATE POLICY "Admin Full Access for Barcode Images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'barcode-images')
WITH CHECK (bucket_id = 'barcode-images');
