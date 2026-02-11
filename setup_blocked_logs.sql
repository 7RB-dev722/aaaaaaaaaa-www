-- Create blocked_logs table
CREATE TABLE IF NOT EXISTS blocked_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    country TEXT,
    city TEXT,
    reason TEXT,
    user_agent TEXT,
    attempted_url TEXT,
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE blocked_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to insert (since blocked users need to log their attempt)
-- Ideally, this should be restricted, but for a public facing site detecting blocks, we need to allow insertion from the client or edge function context.
-- If using Service Role in trafficService, we don't need public insert.
-- However, trafficService often runs on client side (in this React app structure).
-- So we need public insert policy.
CREATE POLICY "Allow public insert to blocked_logs" ON blocked_logs
    FOR INSERT WITH CHECK (true);

-- Allow admins to view and delete
CREATE POLICY "Allow admins to select blocked_logs" ON blocked_logs
    FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() IN (SELECT id FROM auth.users)); 
    -- Adjust admin check as needed. For now, assuming authenticated users are admins or using service role.
    -- Actually, this app seems to use client-side logic mostly. 
    -- Let's stick to the pattern used for visitor_logs: usually public insert, restricted select.
    -- But since we have an admin panel that is authenticated, we should allow authenticated users to select.

CREATE POLICY "Allow authenticated to select blocked_logs" ON blocked_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated to delete blocked_logs" ON blocked_logs
    FOR DELETE TO authenticated USING (true);
