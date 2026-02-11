/*
  # حل نهائي لمشكلة image_path وتبسيط النظام

  1. إزالة الأعمدة المعقدة التي تسبب مشاكل
  2. الاعتماد على عمود image فقط
  3. تبسيط البنية لتجنب مشاكل schema cache
  4. ضمان الاستقرار والتوافق
*/

-- إزالة الأعمدة التي تسبب مشاكل في schema cache
ALTER TABLE products DROP COLUMN IF EXISTS image_path;
ALTER TABLE products DROP COLUMN IF EXISTS video_link;
ALTER TABLE products DROP COLUMN IF EXISTS show_video;

-- التأكد من وجود عمود image الأساسي
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'image'
  ) THEN
    ALTER TABLE products ADD COLUMN image text DEFAULT '';
  END IF;
END $$;

-- تحديث المنتجات الموجودة لضمان وجود قيم صحيحة
UPDATE products SET image = COALESCE(image, '') WHERE image IS NULL;

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_image ON products(image);

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- تحديث إحصائيات الجدول
ANALYZE products;

-- إضافة تعليق للتأكد من التحديث
COMMENT ON TABLE products IS 'Products table - simplified schema without problematic columns - ' || now()::text;
COMMENT ON COLUMN products.image IS 'Image path - simplified single column approach - ' || now()::text;

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL SCHEMA SIMPLIFICATION COMPLETED';
    RAISE NOTICE 'Removed problematic columns: image_path, video_link, show_video';
    RAISE NOTICE 'Using simplified image column only';
    RAISE NOTICE 'Timestamp: %', now();
    RAISE NOTICE '========================================';
END $$;
