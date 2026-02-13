-- Create verified_users table
CREATE TABLE IF NOT EXISTS verified_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  product_type TEXT NOT NULL, -- 'cheatloop' or 'sinki'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(username, product_type)
);

-- Enable RLS
ALTER TABLE verified_users ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read verified_users (to check if they are verified)
CREATE POLICY "Anyone can read verified_users"
  ON verified_users
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users (admins) can manage verified_users
CREATE POLICY "Admins can manage verified_users"
  ON verified_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
