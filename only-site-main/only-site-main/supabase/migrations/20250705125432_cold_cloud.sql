/*
  # إصلاح عمود is_hidden في جدول المنتجات

  1. التحديثات
    - إضافة عمود is_hidden إذا لم يكن موجوداً
    - تعيين القيمة الافتراضية false لجميع المنتجات الموجودة
    - إنشاء فهرس لتحسين الأداء
    - إجبار تحديث schema cache

  2. الأمان
    - استخدام IF NOT EXISTS لتجنب الأخطاء
    - الحفاظ على جميع البيانات الموجودة
*/

-- إضافة عمود is_hidden إذا لم يكن موجوداً
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'is_hidden'
  ) THEN
    ALTER TABLE products ADD COLUMN is_hidden boolean DEFAULT false;
    RAISE NOTICE 'Added is_hidden column to products table';
  ELSE
    RAISE NOTICE 'is_hidden column already exists';
  END IF;
END $$;

-- تحديث جميع المنتجات الموجودة لضمان وجود قيمة صحيحة
UPDATE products SET is_hidden = false WHERE is_hidden IS NULL;

-- إنشاء فهرس لتحسين الأداء عند البحث بحالة الإخفاء
CREATE INDEX IF NOT EXISTS idx_products_is_hidden ON products(is_hidden);

-- إنشاء فهرس مركب لتحسين الأداء عند البحث بالمنتجات المرئية
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_hidden, created_at) WHERE is_hidden = false;

-- تحديث إحصائيات الجدول
ANALYZE products;

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- إضافة تعليق للتأكد من التحديث
COMMENT ON COLUMN products.is_hidden IS 'Whether the product is hidden from public view - ' || now()::text;

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'is_hidden column setup completed successfully';
    RAISE NOTICE 'Total products: %', (SELECT COUNT(*) FROM products);
    RAISE NOTICE 'Visible products: %', (SELECT COUNT(*) FROM products WHERE is_hidden = false);
    RAISE NOTICE 'Hidden products: %', (SELECT COUNT(*) FROM products WHERE is_hidden = true);
END $$;
