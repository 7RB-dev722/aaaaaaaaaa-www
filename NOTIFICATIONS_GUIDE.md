# دليل إصلاح الإشعارات (Notifications Fix Guide)

بناءً على الصور التي أرسلتها، إليك الخطوات الدقيقة لتشغيل الإشعارات الخلفية.

## الخطوة 1: توليد المفاتيح (إذا لم تفعل ذلك مسبقاً)

1. افتح التيرمينال في مشروعك وشغّل:
   ```bash
   node scripts/generate-push-keys.js
   ```
2. انسخ المفتاحين (Public Key و Private Key).
3. ضع **Public Key** في ملف `.env` في مشروعك:
   ```env
   VITE_VAPID_PUBLIC_KEY="المفتاح_الذي_نسخته"
   ```

## الخطوة 2: إعداد الأسرار في Supabase (هام جداً)

الخطأ في الصورة (النقطة الحمراء) سببه غالباً نقص هذه الإعدادات.

1. اذهب إلى **Supabase Dashboard** > **Edge Functions**.
2. اضغط على الدالة **`smooth-processor`**.
3. قد لا تجد زر "Secrets" مباشرة، ابحث عن **Manage Secrets** أو ارجع للقائمة الرئيسية واذهب إلى **Settings > Edge Functions**.
4. أضف المتغيرات التالية (Add new secret):

| الاسم (Name) | القيمة (Value) |
|--------------|----------------|
| `VAPID_PUBLIC_KEY` | المفتاح العام الذي ولدته في الخطوة 1 |
| `VAPID_PRIVATE_KEY` | المفتاح الخاص الذي ولدته في الخطوة 1 |
| `SUPABASE_URL` | رابط مشروعك (موجود في ملف .env) |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الخدمة السري (موجود في ملف .env) |

> **ملاحظة:** بدون هذه القيم، ستفشل الوظيفة دائماً.

## الخطوة 3: تحديث كود الوظيفة

بما أنك تستخدم الاسم `smooth-processor`، يجب عليك رفع الكود الجديد الذي أضفته لك:

1. في التيرمينال، نفذ الأمر:
   ```bash
   npx supabase functions deploy smooth-processor --no-verify-jwt
   ```
   *(إذا طلب منك كلمة مرور قاعدة البيانات، أدخلها. إذا لم يعمل الأمر، يمكنك نسخ محتوى الملف `supabase/functions/smooth-processor/index.ts` ولصقه يدوياً في محرر Supabase إذا كنت تستخدمه).*

## الخطوة 4: إصلاح الويب هوك (Webhook)

في الصورة التي أرسلتها، إعدادات الويب هوك صحيحة، لكن تأكد من إضافة الهيدر:

1. اذهب إلى **Database > Webhooks**.
2. عدّل الويب هوك `notify-admin`.
3. تأكد من الرابط: `.../functions/v1/smooth-processor`
4. **هام:** في قسم **HTTP Headers**، أضف:
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_SERVICE_ROLE_KEY` (استبدل `YOUR_SERVICE_ROLE_KEY` بالمفتاح الحقيقي الموجود في `.env`).

---

بعد تطبيق هذه الخطوات، جرب زر "تجربة (سيرفر)" في لوحة التحكم، وستصلك الإشعارات حتى لو كان الموقع مغلقاً!
