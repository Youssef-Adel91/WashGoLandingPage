-- Leads from people who want to START a mobile car-wash (landing page, "عايز أبدأ مغسلة متنقلة").
-- Run in the LANDING project's SQL Editor (the one that already has shop_leads), not the app project.
create table if not exists public.mobile_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  full_name     text not null check (char_length(full_name) between 2 and 120),
  phone         text not null check (phone ~ '^01[0125][0-9]{8}$'),
  governorate   text check (char_length(governorate) <= 60),
  equipment     text check (char_length(equipment) <= 40),   -- have device / want to buy / installments / not sure
  vehicle       text check (char_length(vehicle) <= 40),
  best_call_time text check (char_length(best_call_time) <= 40),
  consent       boolean not null default false check (consent = true),
  area          text check (char_length(area) <= 60),
  utm_source    text check (char_length(utm_source) <= 60),
  utm_campaign  text check (char_length(utm_campaign) <= 60),
  status        text not null default 'new',
  notes         text
);
create unique index if not exists mobile_leads_phone_key on public.mobile_leads (phone);
alter table public.mobile_leads enable row level security;
drop policy if exists "anon can insert mobile leads" on public.mobile_leads;
create policy "anon can insert mobile leads" on public.mobile_leads
  for insert to anon
  with check (consent = true and status = 'new' and notes is null);
