-- WashGo landing page — leads table (run in a NEW, separate Supabase project's SQL editor)
create extension if not exists pgcrypto;

create table if not exists public.shop_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  shop_name     text not null check (char_length(shop_name) between 2 and 120),
  owner_name    text not null check (char_length(owner_name) between 2 and 120),
  phone         text not null check (phone ~ '^01[0125][0-9]{8}$'),
  governorate   text check (char_length(governorate) <= 60),
  bays          text check (char_length(bays) <= 20),
  cars_per_day  text check (char_length(cars_per_day) <= 20),
  booking_method text check (char_length(booking_method) <= 60),
  biggest_problem text check (char_length(biggest_problem) <= 60),
  best_call_time  text check (char_length(best_call_time) <= 40),
  consent       boolean not null default false check (consent = true),
  area          text check (char_length(area) <= 60),      -- from QR link ?a=
  utm_source    text check (char_length(utm_source) <= 60),
  utm_campaign  text check (char_length(utm_campaign) <= 60),
  status        text not null default 'new',               -- new | contacted | interested | onboarded | rejected
  notes         text
);

-- one lead per phone number (a repeat submit is treated as success by the page)
create unique index if not exists shop_leads_phone_key on public.shop_leads (phone);

alter table public.shop_leads enable row level security;

-- anonymous visitors may INSERT only. They can never read, update or delete.
drop policy if exists "anon can insert leads" on public.shop_leads;
create policy "anon can insert leads" on public.shop_leads
  for insert to anon
  with check (consent = true and status = 'new' and notes is null);

revoke all on public.shop_leads from anon, authenticated;
grant insert on public.shop_leads to anon;
-- You read/manage leads from the Supabase dashboard (Table Editor) — it uses the admin role.
