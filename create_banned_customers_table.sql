-- Create banned_customers table
CREATE TABLE IF NOT EXISTS banned_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or phone number
  type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE banned_customers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so we can check if a user is banned during checkout)
CREATE POLICY "Allow public read access" ON banned_customers
  FOR SELECT
  USING (true);

-- Allow admins to insert/delete
CREATE POLICY "Allow admin full access" ON banned_customers
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_banned_customers_identifier ON banned_customers(identifier);
