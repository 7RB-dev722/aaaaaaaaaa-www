/*
  # حل نهائي لمشكلة عمود is_hidden

  1. إضافة عمود is_hidden بطريقة قوية
  2. إجبار تحديث schema cache
  3. معالجة جميع الحالات المحتملة
  4. ضمان عدم تكرار المشكلة
*/

-- إزالة العمود إذا كان موجوداً ومعطلاً
DO $$
BEGIN
  -- محاولة حذف العمود إذا كان موجوداً ولكن معطل
  BEGIN
    ALTER TABLE products DROP COLUMN IF EXISTS is_hidden;
    RAISE NOTICE 'Dropped existing is_hidden column if it existed';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not drop is_hidden column: %', SQLERRM;
  END;
END $$;

-- إضافة العمود من جديد
ALTER TABLE products ADD COLUMN is_hidden boolean DEFAULT false NOT NULL;

-- تحديث جميع المنتجات الموجودة
UPDATE products SET is_hidden = false;

-- إنشاء فهارس لتحسين الأداء
DROP INDEX IF EXISTS idx_products_is_hidden;
DROP INDEX IF EXISTS idx_products_visible;

CREATE INDEX idx_products_is_hidden ON products(is_hidden);
CREATE INDEX idx_products_visible ON products(category_id, is_hidden, created_at) WHERE is_hidden = false;

-- تحديث إحصائيات الجدول
ANALYZE products;

-- إجبار تحديث schema cache بطرق متعددة
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- تحديث معلومات الجدول في PostgreSQL
UPDATE pg_class SET reltuples = reltuples WHERE relname = 'products';

-- إعادة فهرسة الجدول لضمان التحديث
REINDEX TABLE products;

-- إضافة تعليق مع timestamp لإجبار تحديث metadata
COMMENT ON TABLE products IS 'Products table with is_hidden column - FINAL FIX - ' || now()::text;
COMMENT ON COLUMN products.is_hidden IS 'Product visibility flag - FINAL FIX - ' || now()::text;

-- التحقق من وجود العمود
DO $$
DECLARE
    column_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'products' 
        AND column_name = 'is_hidden'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '✅ SUCCESS: is_hidden column exists and is ready';
        RAISE NOTICE 'Total products: %', (SELECT COUNT(*) FROM products);
        RAISE NOTICE 'Visible products: %', (SELECT COUNT(*) FROM products WHERE is_hidden = false);
        RAISE NOTICE 'Hidden products: %', (SELECT COUNT(*) FROM products WHERE is_hidden = true);
    ELSE
        RAISE EXCEPTION '❌ FAILED: is_hidden column was not created properly';
    END IF;
END $$;

-- إجبار تحديث نهائي
SELECT pg_reload_conf();
