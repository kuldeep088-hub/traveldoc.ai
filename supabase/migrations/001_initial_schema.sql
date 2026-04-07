-- TravelDoc AI — Initial Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- DOCTORS
-- ─────────────────────────────────────────
create table if not exists public.doctors (
  id                uuid primary key default uuid_generate_v4(),
  google_place_id   text unique not null,
  name              text not null,
  specialty         text[] not null default '{}',
  address           text not null default '',
  city              text not null default '',
  phone             text,
  website           text,
  rating            numeric(3, 1),
  reviews_count     integer,
  languages         text[] not null default '{}',
  photo_url         text,
  lat               numeric(10, 7),
  lng               numeric(10, 7),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists doctors_updated_at on public.doctors;
create trigger doctors_updated_at
  before update on public.doctors
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────
-- APPOINTMENTS
-- ─────────────────────────────────────────
create table if not exists public.appointments (
  id          uuid primary key default uuid_generate_v4(),
  doctor_id   uuid references public.doctors(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  date        date not null,
  time        time not null,
  status      text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- AI RECOMMENDATIONS (cache)
-- ─────────────────────────────────────────
create table if not exists public.ai_recommendations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete set null,
  query       text not null,
  city        text not null,
  result      jsonb not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

-- Doctors: public read, no direct user write (managed by server)
alter table public.doctors enable row level security;
drop policy if exists "Doctors are publicly readable" on public.doctors;
drop policy if exists "Service role can manage doctors" on public.doctors;
create policy "Doctors are publicly readable"
  on public.doctors for select using (true);
create policy "Service role can manage doctors"
  on public.doctors for all using (auth.role() = 'service_role');

-- Appointments: users can only see/manage their own
alter table public.appointments enable row level security;
drop policy if exists "Users can read own appointments" on public.appointments;
drop policy if exists "Users can create own appointments" on public.appointments;
drop policy if exists "Users can update own appointments" on public.appointments;
create policy "Users can read own appointments"
  on public.appointments for select using (auth.uid() = user_id);
create policy "Users can create own appointments"
  on public.appointments for insert with check (auth.uid() = user_id);
create policy "Users can update own appointments"
  on public.appointments for update using (auth.uid() = user_id);

-- AI recommendations: users can read their own
alter table public.ai_recommendations enable row level security;
drop policy if exists "Users can read own recommendations" on public.ai_recommendations;
drop policy if exists "Service role can manage recommendations" on public.ai_recommendations;
create policy "Users can read own recommendations"
  on public.ai_recommendations for select using (auth.uid() = user_id);
create policy "Service role can manage recommendations"
  on public.ai_recommendations for all using (auth.role() = 'service_role');

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
create index if not exists doctors_city_idx on public.doctors (city);
create index if not exists doctors_google_place_id_idx on public.doctors (google_place_id);
create index if not exists appointments_user_id_idx on public.appointments (user_id);
create index if not exists appointments_date_idx on public.appointments (date);
