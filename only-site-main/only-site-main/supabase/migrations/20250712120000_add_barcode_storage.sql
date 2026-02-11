/*
# [FEATURE] Add Barcode Image Upload Functionality
This migration creates a dedicated storage bucket for barcode images and sets the necessary access policies.

## Query Description: This operation creates a new storage bucket named `barcode-images`. It configures Row Level Security (RLS) policies to allow public read access (so barcodes can be displayed on the payment page) and restricts write access (upload, update, delete) to authenticated users, such as administrators. This change is structural and does not affect existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Creates new storage bucket: `barcode-images`
- Adds new RLS policies to `storage.objects` for the `barcode-images` bucket.

## Security Implications:
- RLS Status: Enabled on `storage.objects` by default.
- Policy Changes: Yes, new policies are added.
- Auth Requirements: `authenticated` role required for uploads. `public` role granted read access.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible performance impact.
*/

-- Create a new, publicly readable bucket for barcode images.
-- The `public: true` argument makes all objects in the bucket publicly accessible via a URL.
INSERT INTO storage.buckets (id, name, public)
VALUES ('barcode-images', 'barcode-images', true)
ON CONFLICT (id) DO NOTHING;

-- Revoke any existing policies for the barcode-images bucket to ensure a clean slate.
DROP POLICY IF EXISTS "Allow public read access to barcodes" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin to manage barcodes" ON storage.objects;

-- Grant public read-only access to the `barcode-images` bucket.
-- This allows anyone to view the barcode images on the payment page without being logged in.
CREATE POLICY "Allow public read access to barcodes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barcode-images');

-- Grant authenticated users (i.e., the admin) full permissions to manage files in the bucket.
-- This allows the admin to upload, update, and delete barcode images from the dashboard.
CREATE POLICY "Allow admin to manage barcodes"
ON storage.objects FOR INSERT, UPDATE, DELETE
TO authenticated
WITH CHECK (bucket_id = 'barcode-images');
