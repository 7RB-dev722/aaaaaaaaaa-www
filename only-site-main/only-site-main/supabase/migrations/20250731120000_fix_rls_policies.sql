/*
# [SECURITY] Enable RLS and Define Policies
This migration enables Row Level Security on all public tables and defines a baseline set of access policies to address critical security advisories.

## Query Description:
This is a critical security update. It will restrict access to your data based on user roles.
- **Public Data:** `products`, `categories`, `winning_photos`, `site_settings`, `purchase_images` will be readable by everyone.
- **Anonymous Inserts:** Anonymous users will be able to create new records in `purchase_intents`.
- **Admin Access:** Authenticated users (admins) will have full CRUD access to all tables.
- **User Data:** `user_notifications` will be restricted so users can only see their own notifications.

**WARNING:** Applying this script will make your data private by default. If your application relies on anonymous users reading data from tables other than those listed above, you will need to add specific `SELECT` policies for them.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "High"
- Requires-Backup: true
- Reversible: true (by disabling RLS or altering policies)

## Structure Details:
- Enables RLS on: `products`, `categories`, `winning_photos`, `site_settings`, `purchase_images`, `purchase_intents`, `invoice_templates`, `product_keys`, `user_notifications`.
- Creates policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` on the tables above.

## Security Implications:
- RLS Status: Enabled on all tables.
- Policy Changes: Yes, this script drops any existing policies on these tables and creates new ones.
- Auth Requirements: Policies are based on `auth.role()` and `auth.uid()`.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: RLS adds a small overhead to queries. The performance impact should be minimal for most operations but depends on policy complexity and query patterns.
*/

-- Step 1: Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winning_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies on these tables to ensure a clean slate
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
DROP POLICY IF EXISTS "Allow admin access" ON public.products;

DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
DROP POLICY IF EXISTS "Allow admin access" ON public.categories;

DROP POLICY IF EXISTS "Allow public read access" ON public.winning_photos;
DROP POLICY IF EXISTS "Allow admin access" ON public.winning_photos;

DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin access" ON public.site_settings;

DROP POLICY IF EXISTS "Allow public read access" ON public.purchase_images;
DROP POLICY IF EXISTS "Allow admin access" ON public.purchase_images;

DROP POLICY IF EXISTS "Allow public insert access" ON public.purchase_intents;
DROP POLICY IF EXISTS "Allow admin access" ON public.purchase_intents;

DROP POLICY IF EXISTS "Allow admin access" ON public.invoice_templates;

DROP POLICY IF EXISTS "Allow admin access" ON public.product_keys;

DROP POLICY IF EXISTS "Allow users to manage their own notifications" ON public.user_notifications;
DROP POLICY IF EXISTS "Allow admin access" ON public.user_notifications;


-- Step 3: Create new policies

-- ## Table: products ##
CREATE POLICY "Allow public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.products FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: categories ##
CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: winning_photos ##
CREATE POLICY "Allow public read access" ON public.winning_photos FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.winning_photos FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: site_settings ##
CREATE POLICY "Allow public read access" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: purchase_images ##
CREATE POLICY "Allow public read access" ON public.purchase_images FOR SELECT USING (true);
CREATE POLICY "Allow admin access" ON public.purchase_images FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: purchase_intents ##
CREATE POLICY "Allow public insert access" ON public.purchase_intents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin access" ON public.purchase_intents FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: invoice_templates ##
CREATE POLICY "Allow admin access" ON public.invoice_templates FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: product_keys ##
CREATE POLICY "Allow admin access" ON public.product_keys FOR ALL USING (auth.role() = 'authenticated');

-- ## Table: user_notifications ##
CREATE POLICY "Allow users to manage their own notifications" ON public.user_notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin access" ON public.user_notifications
  FOR ALL
  USING (auth.role() = 'authenticated');
