-- إضافة إعدادات نظام الحماية المتقدم (Heuristic) إلى جدول site_settings
-- block_advanced_threshold: حد النقاط الذي يتم عنده حظر الزائر (من 0 إلى 100)
-- advanced_ban_message: الرسالة التي تظهر للزائر المحظور بواسطة النظام المتقدم

INSERT INTO site_settings (key, value) VALUES 
('block_advanced_threshold', '50'),
('advanced_ban_message', 'تم اكتشاف نشاط غير طبيعي من جهازك. يرجى التأكد من إيقاف أي أدوات تلاعب أو محاكاة.')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value;

-- التأكد من وجود خيار تفعيل النظام أيضاً
INSERT INTO site_settings (key, value) VALUES 
('block_advanced_protection', 'false')
ON CONFLICT (key) DO NOTHING;
