-- Create a storage bucket for product videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-videos', 'product-videos', true, 734003200, ARRAY['video/mp4', 'video/webm', 'video/ogg'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 734003200,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg'];

-- Set up security policies for the product-videos bucket

-- Allow public read access to product videos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-videos' );

-- Allow authenticated users (admins) to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-videos' );

-- Allow authenticated users (admins) to update videos
CREATE POLICY "Authenticated users can update videos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-videos' );

-- Allow authenticated users (admins) to delete videos
CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-videos' );

-- Ensure video_link column exists in products table (if not already)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'video_link') THEN
        ALTER TABLE products ADD COLUMN video_link TEXT;
    END IF;
END $$;
