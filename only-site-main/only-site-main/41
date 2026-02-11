/*
  # إصلاح العلاقة بين المنتجات والفئات

  1. التعديلات
    - جعل عمود category_id غير قابل للإلغاء
    - التأكد من وجود العلاقة الخارجية
    - تحديث المنتجات الموجودة

  2. الأمان
    - الحفاظ على جميع البيانات الموجودة
*/

-- تحديث المنتجات التي لا تحتوي على category_id
UPDATE products 
SET category_id = (SELECT id FROM categories WHERE slug = 'pubg')
WHERE category_id IS NULL;

-- جعل العمود غير قابل للإلغاء
ALTER TABLE products ALTER COLUMN category_id SET NOT NULL;

-- التأكد من وجود العلاقة الخارجية
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_category_id_fkey'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;
