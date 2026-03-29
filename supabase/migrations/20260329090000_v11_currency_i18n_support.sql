do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'currency_code'
  ) then
    create type public.currency_code as enum ('USD', 'UZS');
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'users'
  ) and exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create or replace function public.current_user_role()
    returns public.app_role
    language sql
    stable
    security definer
    set search_path = public
    as $fn$
      select role from public.users where id = auth.uid();
    $fn$;
  end if;
end $$;

alter table public.bookings
  add column if not exists currency public.currency_code not null default 'USD',
  add column if not exists total_amount_original numeric(12,2) not null default 0,
  add column if not exists total_amount_usd numeric(12,2) not null default 0,
  add column if not exists exchange_rate_used numeric(12,6) not null default 1;

update public.bookings
set
  total_amount_original = coalesce(nullif(total_amount_original, 0), total_amount),
  total_amount_usd = coalesce(nullif(total_amount_usd, 0), total_amount),
  exchange_rate_used = coalesce(nullif(exchange_rate_used, 0), 1),
  currency = coalesce(currency, 'USD');

alter table public.expenses
  add column if not exists currency public.currency_code not null default 'USD',
  add column if not exists amount_original numeric(12,2) not null default 0,
  add column if not exists amount_usd numeric(12,2) not null default 0,
  add column if not exists exchange_rate_used numeric(12,6) not null default 1;

update public.expenses
set
  amount_original = coalesce(nullif(amount_original, 0), amount),
  amount_usd = coalesce(nullif(amount_usd, 0), amount),
  exchange_rate_used = coalesce(nullif(exchange_rate_used, 0), 1),
  currency = coalesce(currency, 'USD');

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency public.currency_code not null,
  quote_currency public.currency_code not null,
  rate numeric(12,6) not null,
  rate_date date not null,
  source text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists exchange_rates_unique_daily_source
  on public.exchange_rates (base_currency, quote_currency, rate_date, source);

create index if not exists exchange_rates_lookup_idx
  on public.exchange_rates (base_currency, quote_currency, rate_date desc, created_at desc);

alter table public.exchange_rates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exchange_rates'
      and policyname = 'Authenticated users can read exchange rates'
  ) then
    create policy "Authenticated users can read exchange rates"
      on public.exchange_rates
      for select
      to authenticated
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'exchange_rates'
      and policyname = 'Owners can manage exchange rates'
  ) then
    create policy "Owners can manage exchange rates"
      on public.exchange_rates
      for all
      to authenticated
      using (public.current_user_role() = 'owner')
      with check (public.current_user_role() = 'owner');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'exchange_rates'
  ) then
    alter publication supabase_realtime add table public.exchange_rates;
  end if;
end $$;
