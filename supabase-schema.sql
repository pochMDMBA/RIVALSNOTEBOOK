-- OLFACULATOR personal fragrance library and saved combinations
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.fragrances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fragrances_user_id_idx on public.fragrances(user_id);
alter table public.fragrances enable row level security;

drop policy if exists "Users can read their own fragrances" on public.fragrances;
create policy "Users can read their own fragrances" on public.fragrances for select using (auth.uid() = user_id);
drop policy if exists "Users can create their own fragrances" on public.fragrances;
create policy "Users can create their own fragrances" on public.fragrances for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own fragrances" on public.fragrances;
create policy "Users can update their own fragrances" on public.fragrances for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own fragrances" on public.fragrances;
create policy "Users can delete their own fragrances" on public.fragrances for delete using (auth.uid() = user_id);

create table if not exists public.saved_combinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  fragrance_a jsonb not null,
  fragrance_b jsonb not null,
  score integer not null check (score between 0 and 100),
  tier text not null check (tier in ('S','A','B','C','F')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_combinations_user_id_idx on public.saved_combinations(user_id);
alter table public.saved_combinations enable row level security;

drop policy if exists "Users can read their own saved combinations" on public.saved_combinations;
create policy "Users can read their own saved combinations" on public.saved_combinations for select using (auth.uid() = user_id);
drop policy if exists "Users can create their own saved combinations" on public.saved_combinations;
create policy "Users can create their own saved combinations" on public.saved_combinations for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own saved combinations" on public.saved_combinations;
create policy "Users can update their own saved combinations" on public.saved_combinations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own saved combinations" on public.saved_combinations;
create policy "Users can delete their own saved combinations" on public.saved_combinations for delete using (auth.uid() = user_id);


-- Table privileges are separate from RLS policies. These grants let signed-in
-- users reach the tables through the Supabase Data API; RLS above still limits
-- every operation to rows owned by auth.uid(). Do not grant these to anon.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.fragrances to authenticated;
grant select, insert, update, delete on table public.saved_combinations to authenticated;
