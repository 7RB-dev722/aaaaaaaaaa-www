-- Create banned_customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.banned_customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL,
    type TEXT CHECK (type IN ('email', 'phone')) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_banned_customers_identifier ON public.banned_customers(identifier);

-- Enable RLS
ALTER TABLE public.banned_customers ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to read (needed for ban checks during checkout)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.banned_customers;
CREATE POLICY "Enable read access for all users" ON public.banned_customers FOR SELECT USING (true);

-- Allow only authenticated users (admins) to insert/delete
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.banned_customers;
CREATE POLICY "Enable insert access for authenticated users only" ON public.banned_customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete access for authenticated users only" ON public.banned_customers;
CREATE POLICY "Enable delete access for authenticated users only" ON public.banned_customers FOR DELETE USING (auth.role() = 'authenticated');
