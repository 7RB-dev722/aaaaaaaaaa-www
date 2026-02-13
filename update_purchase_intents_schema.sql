-- إضافة أعمدة لتتبع حالة الدفع في جدول طلبات الشراء
ALTER TABLE public.purchase_intents 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moneymotion_session_id TEXT;

-- تحديث السياسات للسماح بتحديث الحالة (للمدراء فقط أو للـ Webhook عبر service_role)
-- ملاحظة: الـ Webhook سيستخدم مفتاح service_role الذي يتخطى سياسات RLS عادةً
COMMENT ON COLUMN public.purchase_intents.status IS 'حالة الطلب: pending, completed, failed, cancelled';
COMMENT ON COLUMN public.purchase_intents.moneymotion_session_id IS 'معرف جلسة الدفع في موني موشن للربط والتحقق';
