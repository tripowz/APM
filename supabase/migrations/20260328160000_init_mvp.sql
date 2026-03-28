create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'member');
create type public.apartment_status as enum ('active', 'inactive');
create type public.payment_status as enum ('unpaid', 'partial', 'paid');
create type public.booking_status as enum (
  'new',
  'confirmed',
  'checked_in',
  'checked_out',
  'cancelled'
);
create type public.expense_category as enum (
  'cleaning',
  'repair',
  'supplies',
  'utilities',
  'commission',
  'marketing',
  'other'
);

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now())
);

create table public.apartments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  address text not null,
  base_price numeric(12, 2) not null default 0 check (base_price >= 0),
  status public.apartment_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  guest_name text not null,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  prepaid_amount numeric(12, 2) not null default 0 check (prepaid_amount >= 0),
  payment_status public.payment_status not null default 'unpaid',
  booking_status public.booking_status not null default 'new',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_check_out_after_check_in check (check_out > check_in),
  constraint bookings_prepaid_lte_total check (prepaid_amount <= total_amount)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  apartment_id uuid not null references public.apartments (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  category public.expense_category not null,
  expense_date date not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null,
  currency text not null default 'USD',
  timezone text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index apartments_status_idx on public.apartments (status);
create index bookings_apartment_check_in_idx on public.bookings (apartment_id, check_in);
create index bookings_status_idx on public.bookings (booking_status, payment_status);
create index expenses_apartment_date_idx on public.expenses (apartment_id, expense_date desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.sync_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email;

  return new;
end;
$$;

create or replace function public.prevent_user_email_drift()
returns trigger
language plpgsql
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'Update auth.users.email instead of public.users.email';
  end if;

  return new;
end;
$$;

create trigger apartments_touch_updated_at
before update on public.apartments
for each row
execute function public.touch_updated_at();

create trigger bookings_touch_updated_at
before update on public.bookings
for each row
execute function public.touch_updated_at();

create trigger expenses_touch_updated_at
before update on public.expenses
for each row
execute function public.touch_updated_at();

create trigger settings_touch_updated_at
before update on public.settings
for each row
execute function public.touch_updated_at();

create trigger on_auth_user_changed
after insert or update of email, raw_user_meta_data on auth.users
for each row
execute function public.sync_auth_user();

create trigger users_prevent_email_drift
before update on public.users
for each row
execute function public.prevent_user_email_drift();

insert into public.users (id, full_name, email)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
  email
from auth.users
on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.apartments enable row level security;
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;
alter table public.settings enable row level security;

create policy "authenticated users can read users"
on public.users
for select
to authenticated
using (true);

create policy "owners or self can update users"
on public.users
for update
to authenticated
using (id = auth.uid() or public.current_user_role() = 'owner')
with check (id = auth.uid() or public.current_user_role() = 'owner');

create policy "authenticated users can manage apartments"
on public.apartments
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can manage bookings"
on public.bookings
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can manage expenses"
on public.expenses
for all
to authenticated
using (true)
with check (true);

create policy "authenticated users can manage settings"
on public.settings
for all
to authenticated
using (true)
with check (true);

alter publication supabase_realtime add table public.apartments;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settings;
