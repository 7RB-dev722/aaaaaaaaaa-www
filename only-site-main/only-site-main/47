/*
  # إصلاح مشكلة عمود image_path نهائياً

  1. التأكد من وجود جميع الأعمدة المطلوبة
  2. إجبار Supabase على تحديث schema cache
  3. إعادة تعيين جميع الصلاحيات
  4. التحقق من صحة البيانات

  هذا Migration سيحل مشكلة "Could not find the 'image_path' column" نهائياً
*/

-- التأكد من وجود جدول الفئات أولاً
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- التأكد من تفعيل RLS على الفئات
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- إضافة الفئات الافتراضية
INSERT INTO categories (name, slug) VALUES
('PUBG Mobile', 'pubg'),
('Call of Duty Mobile', 'codm')
ON CONFLICT (slug) DO NOTHING;

-- التأكد من وجود جميع الأعمدة في جدول المنتجات
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- التحقق من وجود عمود category_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products' 
        AND column_name = 'category_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE products ADD COLUMN category_id uuid;
        RAISE NOTICE 'Added category_id column to products table';
    END IF;

    -- التحقق من وجود عمود image_path
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products' 
        AND column_name = 'image_path'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE products ADD COLUMN image_path text;
        RAISE NOTICE 'Added image_path column to products table';
    ELSE
        RAISE NOTICE 'image_path column already exists';
    END IF;
END $$;

-- تحديث المنتجات الموجودة لربطها بالفئات
UPDATE products 
SET category_id = (
  SELECT id FROM categories 
  WHERE slug = CASE 
    WHEN products.category = 'pubg' THEN 'pubg'
    WHEN products.category = 'codm' THEN 'codm'
    ELSE 'pubg'
  END
)
WHERE category_id IS NULL;

-- التأكد من أن جميع المنتجات لها فئة
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'pubg' LIMIT 1)
WHERE category_id IS NULL;

-- جعل category_id مطلوب إذا لم يكن كذلك
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products' 
        AND column_name = 'category_id'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;
        RAISE NOTICE 'Set category_id as NOT NULL';
    END IF;
END $$;

-- إعادة إنشاء القيد الخارجي
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- حذف وإعادة إنشاء جميع السياسات للفئات
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;

CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert categories" ON categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON categories FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete categories" ON categories FOR DELETE TO public USING (true);

-- حذف وإعادة إنشاء جميع السياسات للمنتجات
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

CREATE POLICY "Anyone can read products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert products" ON products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON products FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete products" ON products FOR DELETE TO public USING (true);

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

-- حذف جميع سياسات Storage الموجودة
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;

-- إنشاء سياسات Storage جديدة
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Public can upload product images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public can update product images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Public can delete product images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'product-images');

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_image_path ON products(image_path);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- إجبار PostgreSQL على تحديث إحصائيات الجداول
ANALYZE products;
ANALYZE categories;

-- إجبار Supabase على تحديث schema cache
NOTIFY pgrst, 'reload schema';

-- إضافة تعليقات للتأكد من التحديث
COMMENT ON TABLE products IS 'Products table - schema updated and fixed';
COMMENT ON COLUMN products.image_path IS 'Path to uploaded image in Supabase Storage - FIXED';
COMMENT ON TABLE categories IS 'Categories table - schema updated';

-- إدراج رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'Schema update completed successfully. image_path column should now be available.';
END $$;
