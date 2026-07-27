create table job_checklists (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  job_number text,
  job_date date,
  crew_name text,
  customer_name text,
  customer_address text,
  customer_phone text,
  cleaning_type text,
  arrive_time time,
  depart_time time,
  notes text,
  checklist jsonb
);

alter table job_checklists enable row level security;

create policy "Allow insert for everyone"
  on job_checklists for insert
  with check (true);

create policy "Allow read for everyone"
  on job_checklists for select
  using (true);
