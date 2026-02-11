/*
  # إضافة عمود رابط الفيديو للمنتجات

  1. التحديثات على الجداول
    - إضافة عمود `video_link` لحفظ رابط الفيديو

  2. الأمان
    - الحفاظ على جميع البيانات الموجودة
    - إضافة الحقل كحقل اختياري
*/

-- إضافة عمود video_link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'video_link'
  ) THEN
    ALTER TABLE products ADD COLUMN video_link text DEFAULT '';
    RAISE NOTICE 'Added video_link column to products table';
  END IF;
END $$;

-- تحديث المنتجات الموجودة لضمان وجود قيم صحيحة
UPDATE products SET video_link = COALESCE(video_link, '') WHERE video_link IS NULL;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_video_link ON products(video_link);

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- تحديث إحصائيات الجدول
ANALYZE products;

-- إضافة تعليق للتأكد من التحديث
COMMENT ON COLUMN products.video_link IS 'URL link to product video (YouTube, Vimeo, etc.) - ' || now()::text;

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'Video link column added successfully to products table';
END $$;
