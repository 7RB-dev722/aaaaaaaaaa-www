/*
  # Secure Local Payments & Seed Data
  
  1. Security:
    - Enable RLS on `local_payment_methods` table.
    - Add policy for public read access (so customers can see payment methods).
    - Add policy for admin full access (so you can manage them).
    
  2. Data:
    - Insert "Super Key" payment method for Iraq if it doesn't exist.
*/

-- Enable RLS to fix security advisory
ALTER TABLE local_payment_methods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to active methods" ON local_payment_methods;
DROP POLICY IF EXISTS "Allow authenticated users to manage payment methods" ON local_payment_methods;
DROP POLICY IF EXISTS "Allow admin full access" ON local_payment_methods;

-- 1. Allow everyone to see active payment methods (for the checkout page)
CREATE POLICY "Allow public read access to active methods" ON local_payment_methods
  FOR SELECT USING (is_active = true);

-- 2. Allow authenticated users (Admins) to do everything (Insert, Update, Delete, Select all)
CREATE POLICY "Allow authenticated users to manage payment methods" ON local_payment_methods
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data: Add Super Key for Iraq
INSERT INTO local_payment_methods (country, method_name, account_holder, account_number, custom_price, is_active)
SELECT 'Iraq', 'Super Key', 'abdulawatban', '3923864171', '50,000 IQD', true
WHERE NOT EXISTS (
    SELECT 1 FROM local_payment_methods WHERE account_number = '3923864171'
);
