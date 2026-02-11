-- Create banned_ips table
CREATE TABLE IF NOT EXISTS banned_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE banned_ips ENABLE ROW LEVEL SECURITY;

-- Policies for banned_ips
-- Allow public read access (so we can check if a user is banned)
CREATE POLICY "Allow public read access" ON banned_ips
  FOR SELECT
  USING (true);

-- Allow admins to insert/delete
CREATE POLICY "Allow admin full access" ON banned_ips
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_banned_ips_address ON banned_ips(ip_address);
