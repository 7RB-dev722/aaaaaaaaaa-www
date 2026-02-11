-- Add video_url column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_library_id if not exists (just in case)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS video_library_id UUID REFERENCES video_library(id) ON DELETE SET NULL;
