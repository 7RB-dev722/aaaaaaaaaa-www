/*
  # Create Local Payment Methods Table
  
  ## Structure Details:
  - Table: local_payment_methods
  - Columns: id, country, method_name, account_details, is_crypto, etc.
  
  ## Security:
  - Enable RLS
  - Public read access
  - Authenticated write access
*/

create table if not exists public.local_payment_methods (
  id uuid default gen_random_uuid() primary key,
  country text not null,
  method_name text not null,
  account_holder text,
  account_number text,
  iban text,
  custom_price text,
  product_prices jsonb default '{}'::jsonb,
  is_active boolean default true,
  is_crypto boolean default false,
  crypto_network text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.local_payment_methods enable row level security;

-- Policies
create policy "Allow public read access" on public.local_payment_methods
  for select using (true);

create policy "Allow authenticated insert" on public.local_payment_methods
  for insert with check (auth.role() = 'authenticated');

create policy "Allow authenticated update" on public.local_payment_methods
  for update using (auth.role() = 'authenticated');

create policy "Allow authenticated delete" on public.local_payment_methods
  for delete using (auth.role() = 'authenticated');
