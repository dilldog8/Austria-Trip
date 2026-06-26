-- Run this once in the Supabase SQL editor, after 0001 (schema.sql) has already been run.
-- This migrates the app from single-user/Property-only to multi-tenant/multi-category.

-- 1. Organizations -----------------------------------------------------------

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. Profiles (one row per auth user, links a user to an org + role) --------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('admin', 'valuer')),
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create or replace function get_my_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from profiles where id = auth.uid()
$$;

create policy "Members can view profiles in their org" on profiles
  for select using (org_id = get_my_org_id());

-- No insert/update/delete policies: profile rows are only ever written
-- server-side via the service role key (see lib/supabase/admin.ts), which
-- bypasses RLS entirely. This keeps role/org assignment out of client reach.

-- Bootstrap: create one org and make every existing auth user (i.e. whoever
-- is already using the app today) an admin of it. Anyone invited after this
-- point is added as a 'valuer' via the admin UI and inherits this org.
insert into organizations (name)
select 'The Valuator Group'
where not exists (select 1 from organizations);

insert into profiles (id, org_id, role)
select u.id, (select id from organizations limit 1), 'admin'
from auth.users u
where not exists (select 1 from profiles p where p.id = u.id);

-- 3. valuation_jobs: add org_id + generic category/details columns ---------

alter table valuation_jobs add column if not exists org_id uuid references organizations(id);
alter table valuation_jobs add column if not exists asset_category text;
alter table valuation_jobs add column if not exists subject_title text;
alter table valuation_jobs add column if not exists details jsonb not null default '{}';

-- Backfill any existing rows (the Phase 1 test job) as 'property' jobs.
-- Run the bootstrap snippet in README FIRST so an organizations row exists
-- and your account has a profile — this backfill assigns existing jobs to
-- the org of whichever user created them.
update valuation_jobs vj
set
  asset_category = 'property',
  subject_title = vj.property_address,
  details = jsonb_build_object(
    'property_type', vj.property_type,
    'building_size_sqm', vj.building_size_sqm,
    'land_size_sqm', vj.land_size_sqm,
    'year_built', vj.year_built,
    'condition_notes', vj.condition_notes
  ),
  org_id = (select org_id from profiles where id = vj.created_by)
where vj.asset_category is null;

alter table valuation_jobs alter column org_id set not null;
alter table valuation_jobs alter column asset_category set not null;
alter table valuation_jobs alter column subject_title set not null;
alter table valuation_jobs add constraint valuation_jobs_asset_category_check
  check (asset_category in ('property', 'plant_machinery', 'motor_vehicle', 'art_collectibles'));

alter table valuation_jobs drop column if exists property_address;
alter table valuation_jobs drop column if exists property_type;
alter table valuation_jobs drop column if exists building_size_sqm;
alter table valuation_jobs drop column if exists land_size_sqm;
alter table valuation_jobs drop column if exists year_built;
alter table valuation_jobs drop column if exists condition_notes;

-- 4. comparable_sales: add details jsonb for category-specific attributes ---

alter table comparable_sales add column if not exists details jsonb not null default '{}';

-- 5. RLS rewrite: org-wide collaborative access instead of created_by-only -

drop policy if exists "Owner can manage own jobs" on valuation_jobs;
create policy "Org members can manage org jobs" on valuation_jobs
  for all using (org_id = get_my_org_id()) with check (org_id = get_my_org_id());

drop policy if exists "Owner can manage own comparables" on comparable_sales;
create policy "Org members can manage org comparables" on comparable_sales
  for all using (
    job_id in (select id from valuation_jobs where org_id = get_my_org_id())
  ) with check (
    job_id in (select id from valuation_jobs where org_id = get_my_org_id())
  );

drop policy if exists "Owner can manage own photos" on job_photos;
create policy "Org members can manage org photos" on job_photos
  for all using (
    job_id in (select id from valuation_jobs where org_id = get_my_org_id())
  ) with check (
    job_id in (select id from valuation_jobs where org_id = get_my_org_id())
  );

drop policy if exists "Owner can manage own photo files" on storage.objects;
create policy "Org members can manage org photo files" on storage.objects
  for all using (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] in (
      select id::text from valuation_jobs where org_id = get_my_org_id()
    )
  ) with check (
    bucket_id = 'job-photos'
    and (storage.foldername(name))[1] in (
      select id::text from valuation_jobs where org_id = get_my_org_id()
    )
  );
