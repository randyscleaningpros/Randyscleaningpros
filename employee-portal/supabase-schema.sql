-- Randy's Cleaning Pros — Team Portal schema
-- Run this once in your Supabase project's SQL editor.

create extension if not exists "pgcrypto";

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  pin text not null,
  rate numeric default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  street text not null,
  city text,
  state text,
  zip text,
  gate_code text,
  alarm_code text,
  parking text,
  key_location text,
  entry_instructions text,
  pets text,
  notes text,
  birthday date,
  referral text,
  recurring text,
  properties jsonb default '[]',
  favorite_employee_id uuid references employees(id) on delete set null,
  vip boolean default false,
  do_not_book boolean default false,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  property text,
  service_date date not null,
  arrival_window text,
  service_type text default 'residential',
  status text default 'scheduled',
  quote_expiry date,
  estimated_minutes int default 0,
  actual_minutes int,
  price numeric default 0,
  condition_name text,
  room_data jsonb default '{}',
  extras jsonb default '[]',
  notes text,
  before_photos jsonb default '[]',
  after_photos jsonb default '[]',
  signature text,
  checklist jsonb default '{}',
  payment_status text default 'unpaid',
  payment_method text,
  amount_paid numeric default 0,
  damage_report text,
  reclean_requested boolean default false,
  satisfaction_rating int,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

-- If you already ran an earlier version of this schema, run the lines
-- below to add the newer columns without losing existing data:
-- alter table customers add column if not exists alarm_code text;
-- alter table customers add column if not exists key_location text;
-- alter table customers add column if not exists entry_instructions text;
-- alter table customers add column if not exists birthday date;
-- alter table customers add column if not exists referral text;
-- alter table customers add column if not exists recurring text;
-- alter table customers add column if not exists properties jsonb default '[]';
-- alter table customers add column if not exists favorite_employee_id uuid references employees(id) on delete set null;
-- alter table customers add column if not exists vip boolean default false;
-- alter table customers add column if not exists do_not_book boolean default false;
-- alter table jobs add column if not exists property text;
-- alter table jobs add column if not exists service_type text default 'residential';
-- alter table jobs add column if not exists quote_expiry date;
-- alter table jobs add column if not exists payment_status text default 'unpaid';
-- alter table jobs add column if not exists payment_method text;
-- alter table jobs add column if not exists amount_paid numeric default 0;
-- alter table jobs add column if not exists damage_report text;
-- alter table jobs add column if not exists reclean_requested boolean default false;
-- alter table jobs add column if not exists satisfaction_rating int;

create table if not exists mileage (
  id uuid primary key default gen_random_uuid(),
  trip_date date not null,
  job_id uuid references jobs(id) on delete set null,
  employee_id uuid references employees(id) on delete set null,
  purpose text,
  start_location text,
  end_location text,
  odometer_start numeric,
  odometer_end numeric,
  miles numeric not null,
  vehicle text,
  notes text,
  created_at timestamptz default now()
);

-- ============================================================
-- IMPORTANT SECURITY NOTE
-- These starter policies allow anyone with your public anon key
-- to read and write every table. That's fine for trying the app
-- out, but before you store real customer or employee data,
-- add Supabase Authentication and rewrite these policies so only
-- signed-in Randy's Cleaning Pros staff can access the data.
-- ============================================================

alter table employees enable row level security;
alter table customers enable row level security;
alter table jobs enable row level security;
alter table mileage enable row level security;

create policy "allow all employees" on employees for all using (true) with check (true);
create policy "allow all customers" on customers for all using (true) with check (true);
create policy "allow all jobs" on jobs for all using (true) with check (true);
create policy "allow all mileage" on mileage for all using (true) with check (true);
