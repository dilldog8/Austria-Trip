-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query)

create table if not exists valuation_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) default auth.uid(),
  property_address text not null,
  property_type text not null,
  building_size_sqm numeric,
  land_size_sqm numeric,
  year_built integer,
  condition_notes text,
  status text not null default 'draft',
  draft_report text,
  created_at timestamptz not null default now()
);

create table if not exists comparable_sales (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references valuation_jobs(id) on delete cascade,
  address text not null,
  sale_price numeric not null,
  sale_date date,
  size_sqm numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references valuation_jobs(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table valuation_jobs enable row level security;
alter table comparable_sales enable row level security;
alter table job_photos enable row level security;

create policy "Owner can manage own jobs" on valuation_jobs
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "Owner can manage own comparables" on comparable_sales
  for all using (
    job_id in (select id from valuation_jobs where created_by = auth.uid())
  ) with check (
    job_id in (select id from valuation_jobs where created_by = auth.uid())
  );

create policy "Owner can manage own photos" on job_photos
  for all using (
    job_id in (select id from valuation_jobs where created_by = auth.uid())
  ) with check (
    job_id in (select id from valuation_jobs where created_by = auth.uid())
  );

-- Storage bucket for job photos (run in SQL editor too, or create via Dashboard -> Storage -> New bucket "job-photos", private)
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', false)
on conflict (id) do nothing;

create policy "Owner can manage own photo files" on storage.objects
  for all using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] in (
      select id::text from valuation_jobs where created_by = auth.uid()
    )
  ) with check (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] in (
      select id::text from valuation_jobs where created_by = auth.uid()
    )
  );
