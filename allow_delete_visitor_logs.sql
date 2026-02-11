-- Allow authenticated users (admins) to delete visitor logs
-- Run this script in the Supabase SQL Editor

-- 1. Create a policy to allow deletion for authenticated users
CREATE POLICY "Allow delete for authenticated users only" ON visitor_logs
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- 2. Grant DELETE permission to the authenticated role
GRANT DELETE ON visitor_logs TO authenticated;

-- 3. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'visitor_logs';
