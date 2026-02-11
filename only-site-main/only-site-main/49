/*
  # إصلاح مشاكل الأعمدة الجديدة

  1. التأكد من وجود أعمدة الفيديو
  2. إصلاح مشاكل schema cache
  3. تحديث البيانات الموجودة
*/

-- التأكد من وجود عمود video_link
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'video_link'
  ) THEN
    ALTER TABLE products ADD COLUMN video_link text;
    RAISE NOTICE 'Added video_link column to products table';
  ELSE
    RAISE NOTICE 'video_link column already exists';
  END IF;
END $$;

-- التأكد من وجود عمود show_video
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'products' 
    AND column_name = 'show_video'
  ) THEN
    ALTER TABLE products ADD COLUMN show_video boolean DEFAULT false;
    RAISE NOTICE 'Added show_video column to products table';
  ELSE
    RAISE NOTICE 'show_video column already exists';
  END IF;
END $$;

-- تحديث القيم الافتراضية للمنتجات الموجودة
UPDATE products 
SET show_video = false 
WHERE show_video IS NULL;

-- إضافة فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_show_video ON products(show_video);
CREATE INDEX IF NOT EXISTS idx_products_video_link ON products(video_link);

-- إجبار PostgreSQL على تحديث إحصائيات الجداول
ANALYZE products;

-- إجبار Supabase على تحديث schema cache
NOTIFY pgrst, 'reload schema';

-- إضافة تعليقات للتأكد من التحديث
COMMENT ON COLUMN products.video_link IS 'URL link to product video (YouTube, Vimeo, etc.) - FIXED';
COMMENT ON COLUMN products.show_video IS 'Whether to show video button on product card - FIXED';

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'Video columns fixed successfully. Schema cache refreshed.';
END $$;
