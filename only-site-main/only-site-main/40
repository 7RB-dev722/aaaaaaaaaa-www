/*
  # إضافة جدول الفئات ونظام رفع الصور

  1. الجداول الجديدة
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, اسم الفئة)
      - `slug` (text, معرف الفئة)
      - `created_at` (timestamp)

  2. التعديلات على الجداول الموجودة
    - تحديث جدول `products` لإضافة `category_id`
    - إضافة عمود `image_path` لحفظ مسار الصورة المرفوعة

  3. Storage
    - إنشاء bucket للصور
    - إضافة سياسات الأمان للصور

  4. الأمان
    - تفعيل RLS على جدول `categories`
    - إضافة سياسات للقراءة والكتابة
*/

-- إنشاء جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- سياسات الفئات
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete categories"
  ON categories
  FOR DELETE
  TO public
  USING (true);

-- إضافة الفئات الافتراضية
INSERT INTO categories (name, slug) VALUES
('PUBG Mobile', 'pubg'),
('Call of Duty Mobile', 'codm')
ON CONFLICT (slug) DO NOTHING;

-- إضافة عمود category_id إلى جدول products (nullable أولاً)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid;
  END IF;
END $$;

-- إضافة عمود image_path لحفظ مسار الصورة المرفوعة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products ADD COLUMN image_path text;
  END IF;
END $$;

-- تحديث المنتجات الموجودة لربطها بالفئات
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'pubg')
WHERE category = 'pubg' AND category_id IS NULL;

UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'codm')
WHERE category = 'codm' AND category_id IS NULL;

-- تعيين فئة افتراضية للمنتجات التي لا تحتوي على فئة
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'pubg')
WHERE category_id IS NULL;

-- الآن جعل العمود غير قابل للإلغاء
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;

-- إضافة foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_category_id_fkey'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id);
  END IF;
END $$;

-- إنشاء storage bucket للصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات storage للصور
CREATE POLICY "Anyone can view product images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images');
