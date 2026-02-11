create table if not exists local_payment_methods (
  id uuid default gen_random_uuid() primary key,
  country text not null,
  method_name text not null,
  account_holder text,
  account_number text,
  iban text,
  custom_price text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table local_payment_methods enable row level security;

create policy "Public read access"
  on local_payment_methods for select
  using (true);

create policy "Admin full access"
  on local_payment_methods for all
  using (true)
  with check (true);
