/*
  # إضافة ميزة رفع الصور

  1. التحديثات على قاعدة البيانات
    - التأكد من وجود عمود `image_path` في جدول `products`
    - إنشاء bucket للصور إذا لم يكن موجوداً
    - إضافة سياسات الأمان للصور

  2. الأمان
    - سياسات للقراءة والكتابة والحذف للصور
    - تحديد أنواع الملفات المسموحة
    - تحديد حجم الملف الأقصى
*/

-- التأكد من وجود عمود image_path
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products ADD COLUMN image_path text;
    RAISE NOTICE 'Added image_path column to products table';
  END IF;
END $$;

-- إنشاء bucket للصور مع إعدادات محسنة
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types
)
VALUES (
  'product-images', 
  'product-images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- حذف السياسات الموجودة وإعادة إنشائها
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;

-- إنشاء سياسات جديدة للصور
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
    AND (
      (storage.extension(name)) = 'jpg' OR
      (storage.extension(name)) = 'jpeg' OR
      (storage.extension(name)) = 'png' OR
      (storage.extension(name)) = 'gif' OR
      (storage.extension(name)) = 'webp'
    )
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

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_image_path ON products(image_path);

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';

-- إضافة تعليق للتأكد من التحديث
COMMENT ON COLUMN products.image_path IS 'Path to uploaded image in Supabase Storage';
