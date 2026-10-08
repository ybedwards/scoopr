-- Phase 1: accounts, roles, service area, pricing, customer properties, scooper applications.

create type public.user_role as enum ('customer', 'scooper', 'admin');
create type public.yard_size as enum ('small', 'medium', 'large');
create type public.application_status as enum ('pending', 'approved', 'rejected', 'deactivated');

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New sign-ups pick customer or scooper; nobody can sign up as admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    case when requested = 'scooper' then 'scooper'::public.user_role else 'customer'::public.user_role end,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.phone
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may switch between customer and scooper; only admins grant or remove admin.
-- Requests with no signed-in user (SQL editor, service role) are trusted, which is
-- how the first admin is made: update profiles set role = 'admin' where email = '...'.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.role is distinct from old.role and not public.is_admin()
     and (new.role = 'admin' or old.role = 'admin') then
    raise exception 'only admins can change admin roles';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- Service area --------------------------------------------------------------

create table public.service_zips (
  zip text primary key check (zip ~ '^\d{5}$'),
  area text not null,
  active boolean not null default true
);

alter table public.service_zips enable row level security;

create policy "anyone reads service area" on public.service_zips
  for select using (true);
create policy "admins manage service area" on public.service_zips
  for all using (public.is_admin()) with check (public.is_admin());

-- Pricing (a single row the admin edits) -------------------------------------

create table public.pricing_rules (
  id smallint primary key default 1 check (id = 1),
  base_visit_cents integer not null check (base_visit_cents > 0),
  extra_dog_cents integer not null check (extra_dog_cents >= 0),
  yard_small numeric(4, 2) not null check (yard_small > 0),
  yard_medium numeric(4, 2) not null check (yard_medium > 0),
  yard_large numeric(4, 2) not null check (yard_large > 0),
  freq_twice_weekly numeric(4, 2) not null check (freq_twice_weekly > 0),
  freq_weekly numeric(4, 2) not null check (freq_weekly > 0),
  freq_biweekly numeric(4, 2) not null check (freq_biweekly > 0),
  one_time_base_cents integer not null check (one_time_base_cents > 0),
  commission_rate numeric(4, 3) not null check (commission_rate >= 0 and commission_rate < 1),
  updated_at timestamptz not null default now()
);

alter table public.pricing_rules enable row level security;

create policy "anyone reads pricing" on public.pricing_rules
  for select using (true);
create policy "admins update pricing" on public.pricing_rules
  for update using (public.is_admin()) with check (public.is_admin());

-- Customer properties -------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null default 'PA',
  zip text not null references public.service_zips (zip),
  dogs smallint not null check (dogs between 1 and 10),
  yard_size public.yard_size not null,
  gate_notes text,
  dog_outside boolean not null default false,
  created_at timestamptz not null default now()
);

create index properties_customer_id_idx on public.properties (customer_id);

alter table public.properties enable row level security;

create policy "customers manage own properties" on public.properties
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy "admins read properties" on public.properties
  for select using (public.is_admin());

-- Scooper applications ------------------------------------------------------

create table public.scooper_applications (
  scooper_id uuid primary key references public.profiles (id) on delete cascade,
  status public.application_status not null default 'pending',
  service_zips text[] not null check (cardinality(service_zips) > 0),
  has_tools boolean not null default false,
  has_vehicle boolean not null default false,
  -- 0 = Sunday ... 6 = Saturday
  available_days smallint[] not null default '{}',
  max_visits_per_day smallint not null default 10 check (max_visits_per_day between 1 and 40),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id),
  review_note text
);

-- Scoopers can edit their application but never review it themselves.
create or replace function public.guard_application_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
    end if;
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
  else
    new.status := old.status;
  end if;
  new.reviewed_at := case when tg_op = 'INSERT' then null else old.reviewed_at end;
  new.reviewed_by := case when tg_op = 'INSERT' then null else old.reviewed_by end;
  new.review_note := case when tg_op = 'INSERT' then null else old.review_note end;
  return new;
end;
$$;

create trigger scooper_applications_guard_review
  before insert or update on public.scooper_applications
  for each row execute function public.guard_application_review();

alter table public.scooper_applications enable row level security;

create policy "scoopers read own application" on public.scooper_applications
  for select using (scooper_id = auth.uid() or public.is_admin());
create policy "scoopers submit own application" on public.scooper_applications
  for insert with check (scooper_id = auth.uid());
create policy "scoopers edit own application" on public.scooper_applications
  for update using (scooper_id = auth.uid() or public.is_admin());

-- Admins see scooper names and phones on the applications list.
create or replace view public.scooper_applications_admin
with (security_invoker = true) as
  select a.*, p.full_name, p.email, p.phone
  from public.scooper_applications a
  join public.profiles p on p.id = a.scooper_id;
