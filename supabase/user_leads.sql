-- Customer interest survey (landing page, "عايز أحجز غسيل لعربيتي").
-- Run in the LANDING project's SQL Editor (the one that already has shop_leads / mobile_leads), NOT the app project.
create table if not exists public.user_leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  preferred_place text not null check (char_length(preferred_place) <= 40),   -- at home / in a shop / both / depends
  wash_frequency  text check (char_length(wash_frequency) <= 40),
  top_priority    text check (char_length(top_priority) <= 40),
  wash_type       text check (char_length(wash_type) <= 40),
  max_price       text check (char_length(max_price) <= 40),
  wants_plan      text check (char_length(wants_plan) <= 40),                 -- monthly subscription interest
  governorate     text not null check (char_length(governorate) <= 60),
  full_name       text check (char_length(full_name) <= 120),
  phone           text check (phone ~ '^01[0125][0-9]{8}$'),
  consent         boolean not null default false,                             -- true only if a phone was given
  area            text check (char_length(area) <= 60),
  utm_source      text check (char_length(utm_source) <= 60),
  utm_campaign    text check (char_length(utm_campaign) <= 60),
  status          text not null default 'new',
  notes           text,
  check (phone is null or consent = true)
);
create unique index if not exists user_leads_phone_key on public.user_leads (phone) where phone is not null;
alter table public.user_leads enable row level security;
drop policy if exists "anon can insert user leads" on public.user_leads;
create policy "anon can insert user leads" on public.user_leads
  for insert to anon
  with check (status = 'new' and notes is null);

-- Handy view for reading the results from the dashboard (SQL editor):
--   select preferred_place, count(*) from user_leads group by 1 order by 2 desc;
--   select wants_plan, count(*) from user_leads group by 1 order by 2 desc;

-- name + phone are now mandatory on the page. NOT VALID = old rows without them stay, new rows must have them.
alter table public.user_leads drop constraint if exists user_leads_contact_required;
alter table public.user_leads add constraint user_leads_contact_required
  check (full_name is not null and char_length(btrim(full_name)) >= 2 and phone is not null) not valid;
