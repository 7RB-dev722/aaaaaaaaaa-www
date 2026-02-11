/*
  # Fix Storage Bucket Creation

  1. Storage Setup
    - Ensure 'product-images' bucket exists
    - Set up proper public access
    - Add comprehensive storage policies

  2. Security
    - Enable public read access for product images
    - Allow public upload/update/delete for admin functionality
*/

-- First, try to create the bucket if it doesn't exist
DO $$
BEGIN
  -- Check if bucket exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'product-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'product-images', 
      'product-images', 
      true, 
      52428800, -- 50MB limit
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    );
  ELSE
    -- Update existing bucket to ensure it's public
    UPDATE storage.buckets 
    SET public = true,
        file_size_limit = 52428800,
        allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    WHERE id = 'product-images';
  END IF;
END $$;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Public can upload product images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
  );

CREATE POLICY "Public can update product images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'product-images')
  WITH CHECK (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
  );

CREATE POLICY "Public can delete product images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (
    bucket_id = 'product-images' 
    AND (storage.foldername(name))[1] = 'products'
  );
