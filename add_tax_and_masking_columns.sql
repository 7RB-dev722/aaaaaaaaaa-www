-- إضافة أعمدة الضرائب والتمويه إلى جدول المنتجات
-- Add tax and masking columns to products table

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS payment_gateway_tax NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS masked_name TEXT DEFAULT 'Online computer format',
ADD COLUMN IF NOT EXISTS masked_domain TEXT;

-- تحديث كاش قاعدة البيانات ليتعرف PostgREST على الأعمدة الجديدة فوراً
-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
