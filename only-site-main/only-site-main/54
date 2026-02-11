/*
  # تحديث بيانات المنتجات

  1. التحديثات
    - حذف المنتجات الموجودة
    - إضافة المنتجات الجديدة بالبيانات المحدثة
    - تحديث روابط الشراء
    - إضافة معلومات الأمان والمستويات

  2. الأمان
    - الحفاظ على بنية قاعدة البيانات
    - تحديث البيانات فقط
*/

-- حذف المنتجات الموجودة
DELETE FROM products;

-- إضافة المنتجات الجديدة
INSERT INTO products (title, price, features, description, buy_link, image, is_popular, category, category_id) VALUES
-- Cheatloop Products
(
  'Cheatloop ESP', 
  40, 
  ARRAY['Enemy Location Only (ESP)', 'Lightweight & Fast', 'No Aim Assist', 'Tactical Advantage'], 
  'A lightweight, safe tool that provides precise enemy location (ESP) without any aim assist or combat enhancements. Perfect for players who want a tactical edge without risking bans.',
  'https://checkout.thewayl.com/pay?id=cmcdygy8u005x9408h9rd85bm',
  '/cheatloop.png',
  false,
  'pubg',
  (SELECT id FROM categories WHERE slug = 'pubg')
),
(
  'Cheatloop Normal', 
  45, 
  ARRAY['ESP + Aimbot', 'Smooth Combat System', 'Enhanced Performance', 'Account Protection'], 
  'Combines accurate enemy detection with a smooth aimbot system. Designed for players who want better combat performance while keeping their main account secure.',
  'https://checkout.thewayl.com/pay?id=cmcdyeeft005w9408abqrir22',
  '/cheatloop.png',
  true,
  'pubg',
  (SELECT id FROM categories WHERE slug = 'pubg')
),
(
  'Cheatloop Exclusive', 
  50, 
  ARRAY['ESP + Aimbot + Magic Bullet', 'Wall Penetration', 'Pro Player Features', 'Maximum Control'], 
  'The most powerful Cheatloop version. Includes magic bullet for shooting through walls, combined with aimbot and ESP. Built for pro players looking for full control with top-level protection.',
  'https://checkout.thewayl.com/pay?id=cmcdyhxe9005y9408p4lsj477',
  '/cheatloop.png',
  false,
  'pubg',
  (SELECT id FROM categories WHERE slug = 'pubg')
),

-- Sinki Products
(
  'Sinki Silver', 
  40, 
  ARRAY['ESP Only', 'Simple & Stable', 'Wallhack Solution', 'Information Advantage'], 
  'Simple and stable wallhack solution that shows enemy positions only. Ideal for cautious players who want information without taking risks.',
  'https://checkout.thewayl.com/pay?id=cmcdygy8u005x9408h9rd85bm',
  '/sinki.jpg',
  false,
  'pubg',
  (SELECT id FROM categories WHERE slug = 'pubg')
),
(
  'Sinki Gold', 
  45, 
  ARRAY['ESP + Aimbot + Magic Bullet', 'Premium Features', 'Devastating Accuracy', 'Combat Domination'], 
  'A premium version combining ESP, powerful aimbot, and magic bullet for devastating accuracy. Great for dominating fights while staying protected from bans.',
  'https://checkout.thewayl.com/pay?id=cmcdyeeft005w9408abqrir22',
  '/sinki.jpg',
  false,
  'pubg',
  (SELECT id FROM categories WHERE slug = 'pubg')
),
(
  'Sinki TDM (Streamer Edition)', 
  50, 
  ARRAY['Overpowered TDM Abilities', 'Streamer Optimized', 'Warehouse/TDM Mode', 'Legend Performance'], 
  'Specially made for streamers and pro TDM players, this version provides superior combat power specifically for Warehouse/TDM mode in PUBG Mobile. Compete like a legend without fear of bans.',
  'https://checkout.thewayl.com/pay?id=cmcdyhxe9005y9408p4lsj477',
  '/sinki.jpg',
  false,
  'pubg',
  (SELECT id FROM categories WHERE slug = 'pubg')
);

-- تحديث إحصائيات الجدول
ANALYZE products;

-- إجبار تحديث schema cache
NOTIFY pgrst, 'reload schema';

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE 'تم تحديث بيانات المنتجات بنجاح - % منتجات', (SELECT COUNT(*) FROM products);
END $$;
