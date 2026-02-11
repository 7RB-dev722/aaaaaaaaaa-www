-- Create banned_countries table
CREATE TABLE IF NOT EXISTS banned_countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE banned_countries ENABLE ROW LEVEL SECURITY;

-- Policies for banned_countries
-- Allow public read access (so we can check if a user is banned)
CREATE POLICY "Allow public read access" ON banned_countries
  FOR SELECT
  USING (true);

-- Allow admins to insert/delete
CREATE POLICY "Allow admin full access" ON banned_countries
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at);
CREATE INDEX IF NOT EXISTS idx_banned_countries_name ON banned_countries(country_name);
