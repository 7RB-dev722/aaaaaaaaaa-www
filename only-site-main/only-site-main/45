/*
  # إصلاح نهائي لمشاكل قاعدة البيانات

  1. التأكد من وجود جميع الأعمدة المطلوبة
  2. إصلاح العلاقات والقيود
  3. تحديث البيانات الموجودة
  4. إعادة تعيين الصلاحيات
*/

-- التأكد من وجود جدول الفئات
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
BEGIN
  -- إضافة category_id إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid;
  END IF;

  -- إضافة image_path إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'image_path'
  ) THEN
    ALTER TABLE products ADD COLUMN image_path text;
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

-- جعل category_id مطلوب
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;

-- حذف القيد الموجود وإعادة إنشاؤه
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- إعادة تعيين صلاحيات الفئات
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;

CREATE POLICY "Anyone can read categories" ON categories FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert categories" ON categories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update categories" ON categories FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete categories" ON categories FOR DELETE TO public USING (true);

-- إعادة تعيين صلاحيات المنتجات
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

CREATE POLICY "Anyone can read products" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert products" ON products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON products FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete products" ON products FOR DELETE TO public USING (true);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- إجبار Supabase على تحديث schema cache
NOTIFY pgrst, 'reload schema';

-- إضافة تعليق للتأكد من تطبيق التغييرات
COMMENT ON TABLE products IS 'Products table - updated schema';
COMMENT ON TABLE categories IS 'Categories table - updated schema';
