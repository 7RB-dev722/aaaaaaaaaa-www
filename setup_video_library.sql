-- Create a table for the Video Library
CREATE TABLE IF NOT EXISTS video_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so users can watch videos)
CREATE POLICY "Allow public read access on video_library" 
ON video_library FOR SELECT 
USING (true);

-- Allow authenticated users (admins) to do everything
CREATE POLICY "Allow admin full access on video_library" 
ON video_library FOR ALL 
USING (auth.role() = 'authenticated');

-- Add video_library_id to products table to track the relationship
-- We still keep video_url in products for backward compatibility and ease of access,
-- but we'll try to sync them.
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_library_id UUID REFERENCES video_library(id) ON DELETE SET NULL;

-- Storage bucket is already created 'product-videos' in previous steps
-- Ensure it's public (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-videos', 'product-videos', true, 734003200, ARRAY['video/mp4', 'video/webm', 'video/ogg'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 734003200,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg'];

-- Ensure RLS for storage (idempotent)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-videos');

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-videos' AND auth.role() = 'authenticated');
