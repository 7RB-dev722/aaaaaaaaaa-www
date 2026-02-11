-- Fix Visitor Logs RLS Policy
-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow read access for authenticated users only" ON visitor_logs;
DROP POLICY IF EXISTS "Allow public insert access" ON visitor_logs;

-- Re-enable RLS
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- Re-create Insert Policy (Public)
CREATE POLICY "Allow public insert access" ON visitor_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Re-create Select Policy (Authenticated Only - Admin)
CREATE POLICY "Allow read access for authenticated users only" ON visitor_logs
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Grant permissions (just in case)
GRANT SELECT ON visitor_logs TO authenticated;
GRANT INSERT ON visitor_logs TO anon;
GRANT INSERT ON visitor_logs TO authenticated;
