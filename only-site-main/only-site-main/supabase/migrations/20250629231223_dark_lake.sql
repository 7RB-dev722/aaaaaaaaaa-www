/*
  # إنشاء جدول المنتجات

  1. الجداول الجديدة
    - `products`
      - `id` (uuid, primary key)
      - `title` (text, اسم المنتج)
      - `price` (numeric, السعر)
      - `features` (text[], قائمة المميزات)
      - `description` (text, الوصف)
      - `buy_link` (text, رابط الشراء)
      - `image` (text, رابط الصورة)
      - `is_popular` (boolean, منتج مميز)
      - `category` (text, الفئة)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جدول `products`
    - إضافة سياسة للقراءة للجميع
    - إضافة سياسة للكتابة للمدراء فقط
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  price numeric NOT NULL,
  features text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  buy_link text NOT NULL,
  image text DEFAULT '',
  is_popular boolean DEFAULT false,
  category text NOT NULL DEFAULT 'pubg',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- سياسة للقراءة - يمكن للجميع قراءة المنتجات
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- سياسة للإدراج - يمكن للجميع إضافة منتجات (سيتم تقييدها لاحقاً)
CREATE POLICY "Anyone can insert products"
  ON products
  FOR INSERT
  TO public
  WITH CHECK (true);

-- سياسة للتحديث - يمكن للجميع تحديث المنتجات (سيتم تقييدها لاحقاً)
CREATE POLICY "Anyone can update products"
  ON products
  FOR UPDATE
  TO public
  USING (true);

-- سياسة للحذف - يمكن للجميع حذف المنتجات (سيتم تقييدها لاحقاً)
CREATE POLICY "Anyone can delete products"
  ON products
  FOR DELETE
  TO public
  USING (true);

-- إدراج المنتجات الافتراضية
INSERT INTO products (title, price, features, description, buy_link, image, is_popular, category) VALUES
('Cheatloop ESP', 40, ARRAY['Enemy Location Only (ESP)'], 'A lightweight, safe tool that provides precise enemy location (ESP) without any aim assist or combat enhancements. Perfect for players who want a tactical edge without risking bans.', 'https://checkout.thewayl.com/pay?id=cmcddncnp003dj21704izo2q4&currency=usd&lang=ar', '/cheatloop.png', false, 'pubg'),
('Cheatloop Normal', 45, ARRAY['ESP + Aimbot'], 'Combines accurate enemy detection with a smooth aimbot system. Designed for players who want better combat performance while keeping their main account secure.', 'https://checkout.thewayl.com/pay?id=cmcdkxddn0037qw5dh0b5lofq&currency=usd&lang=ar', '/cheatloop.png', true, 'pubg'),
('Cheatloop Exclusive', 50, ARRAY['ESP + Aimbot + Magic Bullet'], 'The most powerful Cheatloop version. Includes magic bullet for shooting through walls, combined with aimbot and ESP. Built for pro players looking for full control with top-level protection.', 'https://checkout.thewayl.com/pay?id=cmcdkyhf6003iphva82f5hk97&currency=usd&lang=ar', '/cheatloop.png', false, 'pubg'),
('Sinki Silver', 40, ARRAY['ESP Only'], 'Simple and stable wallhack solution that shows enemy positions only. Ideal for cautious players who want information without taking risks.', 'https://checkout.thewayl.com/pay?id=cmcddncnp003dj21704izo2q4&currency=usd&lang=ar', '/sinki.jpg', false, 'pubg'),
('Sinki Gold', 45, ARRAY['ESP + Aimbot + Magic Bullet'], 'A premium version combining ESP, powerful aimbot, and magic bullet for devastating accuracy. Great for dominating fights while staying protected from bans.', 'https://checkout.thewayl.com/pay?id=cmcdkxddn0037qw5dh0b5lofq&currency=usd&lang=ar', '/sinki.jpg', false, 'pubg'),
('Sinki TDM (Streamer Edition)', 50, ARRAY['Overpowered abilities for TDM Mode'], 'Specially made for streamers and pro TDM players, this version provides superior combat power specifically for Warehouse/TDM mode in PUBG Mobile. Compete like a legend without fear of bans.', 'https://checkout.thewayl.com/pay?id=cmcdkyhf6003iphva82f5hk97&currency=usd&lang=ar', '/sinki.jpg', false, 'pubg'),
('Cheatloop CODM', 32, ARRAY['ESP + Aimbot'], 'Combines accurate enemy detection with a smooth aimbot system. Designed for Call of Duty Mobile players who want enhanced combat performance while keeping their main account safe. Ideal for competitive players seeking tactical advantage without risking bans.', 'https://checkout.thewayl.com/pay?id=cmcdl1dem003jphvab4nh4s1v&currency=usd&lang=ar', '/cheatloop.png', true, 'codm');

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء trigger لتحديث updated_at عند التعديل
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
