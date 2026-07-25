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
  parking text,
  pets text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  employee_id uuid references employees(id) on delete set null,
  service_date date not null,
  arrival_window text,
  status text default 'scheduled',
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
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

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
