-- Create visitor_logs table to track user visits
CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  page_url TEXT
);

-- Enable Row Level Security
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs (anonymous tracking)
CREATE POLICY "Allow public insert access" ON visitor_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Allow admins (or service role) to view logs
-- Note: You might want to restrict this further in a production environment
CREATE POLICY "Allow read access for authenticated users only" ON visitor_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');
