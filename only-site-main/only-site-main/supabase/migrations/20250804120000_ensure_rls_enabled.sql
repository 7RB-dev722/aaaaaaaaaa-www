/*
  # Security Fix: Enable RLS on all tables
  
  ## Query Description:
  This migration ensures that Row Level Security (RLS) is explicitly enabled for all tables in the public schema.
  This resolves security advisories where policies might exist but RLS enforcement is not active.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Enables RLS on: products, categories, winning_photos, site_settings, purchase_images, 
    purchase_intents, invoice_templates, product_keys, local_payment_methods, user_notifications
*/

-- Enable RLS on all tables to satisfy security policies
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS winning_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS local_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_notifications ENABLE ROW LEVEL SECURITY;

-- Re-verify policies for local_payment_methods to ensure access is not lost
DO $$ 
BEGIN
    -- Policy for reading local payment methods (Public)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'local_payment_methods' AND policyname = 'Public can view active local payment methods'
    ) THEN
        CREATE POLICY "Public can view active local payment methods" 
        ON local_payment_methods FOR SELECT 
        USING (is_active = true);
    END IF;

    -- Policy for managing local payment methods (Admins)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'local_payment_methods' AND policyname = 'Admins can manage local payment methods'
    ) THEN
        CREATE POLICY "Admins can manage local payment methods" 
        ON local_payment_methods FOR ALL 
        USING (auth.role() = 'authenticated');
    END IF;
END $$;
