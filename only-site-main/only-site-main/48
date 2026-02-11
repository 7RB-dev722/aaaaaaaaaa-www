/*
  # إضافة حقول الفيديو للمنتجات

  1. التحديثات على الجداول
    - إضافة عمود `video_link` لحفظ رابط الفيديو
    - إضافة عمود `show_video` لتحديد ما إذا كان سيتم عرض زر الفيديو

  2. الأمان
    - الحفاظ على جميع البيانات الموجودة
    - إضافة الحقول كحقول اختيارية
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
    ALTER TABLE products ADD COLUMN video_link text;
    RAISE NOTICE 'Added video_link column to products table';
  END IF;
END $$;

-- إضافة عمود show_video
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
  END IF;
END $$;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_show_video ON products(show_video);

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';

-- إضافة تعليق للتأكد من التحديث
COMMENT ON COLUMN products.video_link IS 'URL link to product video (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN products.show_video IS 'Whether to show video button on product card';
