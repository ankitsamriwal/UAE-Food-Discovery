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
  image text not null,
  tags text[] not null default '{}',
  rating numeric not null default 5,
  reviews_count integer not null default 1,
  contributor text not null default 'Anonymous',
  created_at timestamptz not null default now()
);

alter table eating_joints enable row level security;

-- This app has no authentication: any visitor can browse, add, and delete
-- listings, matching the original localStorage-only prototype's trust model.
-- Tighten these policies (e.g. require auth, restrict delete to the row's
-- creator) before treating this as more than a community demo.
create policy "Public can read eating joints"
  on eating_joints for select
  using (true);

create policy "Public can add eating joints"
  on eating_joints for insert
  with check (true);

create policy "Public can delete eating joints"
  on eating_joints for delete
  using (true);

-- Seed data carried over from the original prototype, optional.
insert into eating_joints (name, emirate, address, lat, lng, specialty, image, tags, rating, reviews_count, contributor, created_at)
values
  ('Al Fanar Restaurant & Cafe', 'Dubai', 'Dubai Festival City Mall, Canal Walk, Dubai', 25.2215, 55.3524, 'Traditional Emirati Lamb Machboos & Luqaimat', 'https://images.unsplash.com/photo-1541518763669-27fef04b14e8?auto=format&fit=crop&q=80&w=800', array['Emirati', 'Breakfast', 'Kunafa', 'Family Friendly'], 4.8, 142, 'Community Seed', '2026-01-15'),
  ('Al Khayma Heritage Restaurant', 'Dubai', 'Building 79, Al Fahidi Historical District, Dubai', 25.2634, 55.2972, 'Charcoal Chicken Kebab & Fresh Regag Bread', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', array['Emirati', 'Outdoor Seating', 'Breakfast', 'Karak Tea'], 4.9, 210, 'Community Seed', '2026-02-01'),
  ('Mina Za''abeel Seafood Restaurant', 'Abu Dhabi', 'Free Port, Mina Zayed, Abu Dhabi', 24.5222, 54.3731, 'Freshly Fried Hamour & Spiced Rice', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800', array['Seafood', 'Buffet', 'Budget Friendly'], 4.6, 88, 'AbuDhabiFoodie', '2026-02-10');
