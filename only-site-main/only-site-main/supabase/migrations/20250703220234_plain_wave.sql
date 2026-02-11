/*
  # حذف عمود video_link من جدول المنتجات

  1. التحديثات
    - حذف عمود video_link من جدول products
    - تنظيف schema cache
    - تحديث الفهارس

  2. الأمان
    - الحفاظ على جميع البيانات الأخرى
    - حذف العمود المسبب للمشاكل فقط
*/

-- حذف عمود video_link إذا كان موجوداً
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'video_link'
  ) THEN
    ALTER TABLE products DROP COLUMN video_link;
    RAISE NOTICE 'Removed video_link column from products table';
  END IF;
END $$;

-- حذف الفهرس المرتبط بـ video_link إذا كان موجوداً
DROP INDEX IF EXISTS idx_products_video_link;

-- تحديث إحصائيات الجدول
ANALYZE products;

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- إضافة تعليق للتأكد من التحديث
COMMENT ON TABLE products IS 'Products table - video_link column removed - ' || now()::text;

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'video_link column removed successfully from products table';
END $$;
