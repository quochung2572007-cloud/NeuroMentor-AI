-- NeuroMentor AI persistence layer for Supabase.
--
-- Supabase Auth owns credentials in auth.users, including password hashes.
-- The public.profiles table is an application profile mirror used for account
-- metadata only. Do not duplicate password hashes in public tables.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null default current_date,
  focus_score integer not null check (focus_score between 0 and 100),
  fatigue_score integer not null check (fatigue_score between 0 and 100),
  distraction_score integer not null check (distraction_score between 0 and 100),
  burnout_score integer not null check (burnout_score between 0 and 100),
  productive_ratio numeric(6, 5) not null default 0 check (productive_ratio between 0 and 1),
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  total_minutes integer not null default 0 check (total_minutes >= 0),
  model_version text not null default 'shared-snapshot-v2',
  source text not null default 'manual',
  context jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  extraction jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create table if not exists public.behavior_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid references public.snapshots(id) on delete set null,
  snapshot_date date not null default current_date,
  social_minutes integer not null default 0 check (social_minutes >= 0),
  productivity_minutes integer not null default 0 check (productivity_minutes >= 0),
  learning_minutes integer not null default 0 check (learning_minutes >= 0),
  entertainment_minutes integer not null default 0 check (entertainment_minutes >= 0),
  gaming_minutes integer not null default 0 check (gaming_minutes >= 0),
  health_minutes integer not null default 0 check (health_minutes >= 0),
  app_switches integer not null default 0 check (app_switches >= 0),
  deep_work_minutes integer not null default 0 check (deep_work_minutes >= 0),
  late_night_minutes integer not null default 0 check (late_night_minutes >= 0),
  reported_total_minutes integer check (reported_total_minutes is null or reported_total_minutes >= 0),
  source text not null default 'manual',
  extraction jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date,
  role text not null check (role in ('user', 'mentor', 'system')),
  content text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists snapshots_user_date_idx
  on public.snapshots (user_id, snapshot_date desc);

create index if not exists behavior_metrics_user_date_idx
  on public.behavior_metrics (user_id, snapshot_date desc);

create index if not exists mentor_messages_user_created_idx
  on public.mentor_messages (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists snapshots_set_updated_at on public.snapshots;
create trigger snapshots_set_updated_at
before update on public.snapshots
for each row execute function public.set_updated_at();

drop trigger if exists behavior_metrics_set_updated_at on public.behavior_metrics;
create trigger behavior_metrics_set_updated_at
before update on public.behavior_metrics
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, coalesce(new.email, ''), coalesce(new.created_at, now()))
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.snapshots enable row level security;
alter table public.behavior_metrics enable row level security;
alter table public.mentor_messages enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can read own snapshots" on public.snapshots;
create policy "Users can read own snapshots"
on public.snapshots for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own snapshots" on public.snapshots;
create policy "Users can insert own snapshots"
on public.snapshots for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own snapshots" on public.snapshots;
create policy "Users can update own snapshots"
on public.snapshots for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own behavior metrics" on public.behavior_metrics;
create policy "Users can read own behavior metrics"
on public.behavior_metrics for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own behavior metrics" on public.behavior_metrics;
create policy "Users can insert own behavior metrics"
on public.behavior_metrics for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own behavior metrics" on public.behavior_metrics;
create policy "Users can update own behavior metrics"
on public.behavior_metrics for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read own mentor messages" on public.mentor_messages;
create policy "Users can read own mentor messages"
on public.mentor_messages for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own mentor messages" on public.mentor_messages;
create policy "Users can insert own mentor messages"
on public.mentor_messages for insert
with check (auth.uid() = user_id);
