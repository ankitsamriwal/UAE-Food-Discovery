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
  created_at timestamptz not null default now(),
  dietary_tags text[] not null default '{}',
  pod_features text[] not null default '{}',
  location_type text,
  status text not null default 'approved'
);

-- If you ran an earlier version of this schema, bring an existing table up
-- to date instead of dropping it:
-- alter table eating_joints add column if not exists story text not null default '';
-- alter table eating_joints add column if not exists is_late_night boolean not null default false;
-- alter table eating_joints add column if not exists is_under_20 boolean not null default false;
-- alter table eating_joints add column if not exists dietary_tags text[] not null default '{}';
-- alter table eating_joints add column if not exists pod_features text[] not null default '{}';
-- alter table eating_joints add column if not exists location_type text;
-- alter table eating_joints add column if not exists status text not null default 'approved';
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

-- Powers the map view's "spots near me" radius search: filters by dietary/
-- POD/location-type tags and computes each match's distance (Haversine,
-- so no PostGIS extension required) from the visitor's coordinates.
create or replace function get_spots_within_radius(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  selected_tags text[] default '{}',
  selected_pod text[] default '{}',
  selected_types text[] default '{}'
)
returns table (
  id uuid,
  name text,
  emirate text,
  address text,
  lat double precision,
  lng double precision,
  specialty text,
  story text,
  image text,
  tags text[],
  rating numeric,
  is_late_night boolean,
  is_under_20 boolean,
  contributor text,
  created_at timestamptz,
  dietary_tags text[],
  pod_features text[],
  location_type text,
  status text,
  distance_km double precision
)
language sql stable
as $$
  with scored as (
    select
      ej.*,
      round(
        (6371 * acos(
          least(1::double precision, greatest(-1::double precision,
            cos(radians(user_lat)) * cos(radians(ej.lat)) * cos(radians(ej.lng) - radians(user_lng))
            + sin(radians(user_lat)) * sin(radians(ej.lat))
          ))
        ))::numeric, 1
      )::double precision as distance_km
    from eating_joints ej
    where ej.status = 'approved'
      and (selected_tags = '{}' or ej.dietary_tags && selected_tags)
      and (selected_pod = '{}' or ej.pod_features @> selected_pod)
      and (selected_types = '{}' or ej.location_type = any(selected_types))
  )
  select
    id, name, emirate, address, lat, lng, specialty, story, image, tags, rating,
    is_late_night, is_under_20, contributor, created_at, dietary_tags, pod_features,
    location_type, status, distance_km
  from scored
  where distance_km <= radius_km
  order by distance_km asc;
$$;

grant execute on function get_spots_within_radius(double precision, double precision, double precision, text[], text[], text[]) to anon, authenticated;

-- Seed data, optional.
insert into eating_joints (name, emirate, address, lat, lng, specialty, story, image, tags, rating, is_late_night, is_under_20, contributor, created_at, dietary_tags, pod_features, location_type)
values
  ('Al Muraqqabat Karak & Cafeteria', 'Dubai', 'Al Muraqqabat Street, Deira, Dubai', 25.2671, 55.3235, 'Cardamom Karak Tea & Fresh Oman Chips Regag', 'The uncle here has been pulling tea since 1998. Order off-menu: ask for extra cheese and hot sauce in your regag bread.', 'https://images.unsplash.com/photo-1541518763669-27fef04b14e8?auto=format&fit=crop&q=80&w=800', array['Karak Tea', 'Under AED 20', 'Late Night', 'Cafeteria Vibe', 'Regag Bread'], 4.9, true, true, 'DeiraLocal', '2026-01-15', array['halal', 'non_veg'], array[]::text[], null),
  ('Al Khayma Heritage Restaurant', 'Dubai', 'Building 79, Al Fahidi Historical District, Dubai', 25.2634, 55.2972, 'Charcoal Lamb Machboos & Hot Luqaimat', 'Set inside a windtower courtyard. Best place to take visiting friends for real Emirati hospitality.', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800', array['Emirati Heritage', 'Kunafa', 'Shisha Courtyard', 'Hidden Gem'], 4.8, false, false, 'Community Seed', '2026-02-01', array['halal', 'non_veg'], array['wheelchair_ramp', 'highchair'], null),
  ('Bu Qtair Seafood Shack', 'Dubai', 'Old 32B Street, Fishing Harbour 2, Umm Suqeim, Dubai', 25.1412, 55.1915, 'Deep-Fried Fresh Hamour in Secret Spices & Paratha', 'No menu. You pick raw fish by weight at the port counter, they fry it crispy with Indian spices.', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800', array['Seafood Market', 'Budget Feast', 'Hidden Gem'], 4.7, false, false, 'JumeirahFoodie', '2026-02-10', array['non_veg'], array[]::text[], 'beachfront');
