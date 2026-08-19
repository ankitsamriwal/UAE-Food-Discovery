-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- for a fresh project before the app can read/write eateries.

create table if not exists eating_joints (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emirate text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  specialty text not null,
  story text not null default '',
  image text not null,
  tags text[] not null default '{}',
  rating numeric not null default 5,
  is_late_night boolean not null default false,
  is_under_20 boolean not null default false,
  contributor text not null default 'Anonymous',
  created_at timestamptz not null default now()
);

-- If you ran an earlier version of this schema (with reviews_count and no
-- story/is_late_night/is_under_20 columns), bring an existing table up to
-- date instead of dropping it:
-- alter table eating_joints add column if not exists story text not null default '';
-- alter table eating_joints add column if not exists is_late_night boolean not null default false;
-- alter table eating_joints add column if not exists is_under_20 boolean not null default false;
-- alter table eating_joints drop column if exists reviews_count;

alter table eating_joints enable row level security;

-- This app has no authentication: any visitor can browse, add, and delete
-- listings, matching the original localStorage-only prototype's trust model.
-- Tighten these policies (e.g. require auth, restrict delete to the row's
-- creator) before treating this as more than a community demo.
-- (drop-then-create makes this block safe to re-run on an existing table)
drop policy if exists "Public can read eating joints" on eating_joints;
create policy "Public can read eating joints"
  on eating_joints for select
  using (true);

drop policy if exists "Public can add eating joints" on eating_joints;
create policy "Public can add eating joints"
  on eating_joints for insert
  with check (true);

drop policy if exists "Public can delete eating joints" on eating_joints;
create policy "Public can delete eating joints"
  on eating_joints for delete
  using (true);

-- Seed data, optional.
insert into eating_joints (name, emirate, address, lat, lng, specialty, story, image, tags, rating, is_late_night, is_under_20, contributor, created_at)
values
  ('Al Muraqqabat Karak & Cafeteria', 'Dubai', 'Al Muraqqabat Street, Deira, Dubai', 25.2671, 55.3235, 'Cardamom Karak Tea & Fresh Oman Chips Regag', 'The uncle here has been pulling tea since 1998. Order off-menu: ask for extra cheese and hot sauce in your regag bread.', 'https://images.unsplash.com/photo-1541518763669-27fef04b14e8?auto=format&fit=crop&q=80&w=800', array['Karak Tea', 'Under AED 20', 'Late Night', 'Cafeteria Vibe', 'Regag Bread'], 4.9, true, true, 'DeiraLocal', '2026-01-15'),
  ('Al Khayma Heritage Restaurant', 'Dubai', 'Building 79, Al Fahidi Historical District, Dubai', 25.2634, 55.2972, 'Charcoal Lamb Machboos & Hot Luqaimat', 'Set inside a windtower courtyard. Best place to take visiting friends for real Emirati hospitality.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', array['Emirati Heritage', 'Kunafa', 'Shisha Courtyard', 'Hidden Gem'], 4.8, false, false, 'Community Seed', '2026-02-01'),
  ('Bu Qtair Seafood Shack', 'Dubai', 'Old 32B Street, Fishing Harbour 2, Umm Suqeim, Dubai', 25.1412, 55.1915, 'Deep-Fried Fresh Hamour in Secret Spices & Paratha', 'No menu. You pick raw fish by weight at the port counter, they fry it crispy with Indian spices.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800', array['Seafood Market', 'Budget Feast', 'Hidden Gem'], 4.7, false, false, 'JumeirahFoodie', '2026-02-10');
