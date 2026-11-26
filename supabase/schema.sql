-- RIVALSNOTEBOOK Supabase schema
-- Run this complete script in Supabase Dashboard > SQL Editor.
-- The browser must use only a publishable key / legacy anon key. Never use service_role here.

create extension if not exists pgcrypto;

-- One private workspace per account. Includes personal MY GROUPS, counter data and plays.
create table if not exists public.user_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_workspaces enable row level security;
drop policy if exists "Users can read their own workspace" on public.user_workspaces;
create policy "Users can read their own workspace" on public.user_workspaces
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their own workspace" on public.user_workspaces;
create policy "Users can create their own workspace" on public.user_workspaces
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their own workspace" on public.user_workspaces;
create policy "Users can update their own workspace" on public.user_workspaces
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.user_workspaces to authenticated;

-- Shared notebook records hold only the Playbook canvas and saved plays.
create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  share_token uuid not null unique default gen_random_uuid(),
  title text not null default 'RivalsNotebook',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.notebook_members (
  notebook_id uuid not null references public.notebooks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner','editor')),
  joined_at timestamptz not null default now(),
  primary key (notebook_id, user_id)
);

create or replace function public.is_notebook_member(p_notebook_id uuid)
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.notebook_members m
    where m.notebook_id = p_notebook_id and m.user_id = auth.uid()
  );
$$;
revoke all on function public.is_notebook_member(uuid) from public;
grant execute on function public.is_notebook_member(uuid) to authenticated;

create or replace function public.add_notebook_owner_member()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.notebook_members(notebook_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (notebook_id, user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists notebooks_add_owner_member on public.notebooks;
create trigger notebooks_add_owner_member after insert on public.notebooks
for each row execute function public.add_notebook_owner_member();

alter table public.notebooks enable row level security;
alter table public.notebook_members enable row level security;
drop policy if exists "Notebook members can read notebooks" on public.notebooks;
create policy "Notebook members can read notebooks" on public.notebooks
  for select to authenticated using (public.is_notebook_member(id));
drop policy if exists "Signed-in users can create notebooks they own" on public.notebooks;
create policy "Signed-in users can create notebooks they own" on public.notebooks
  for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists "Notebook members can update shared notebooks" on public.notebooks;
create policy "Notebook members can update shared notebooks" on public.notebooks
  for update to authenticated using (public.is_notebook_member(id)) with check (public.is_notebook_member(id));
drop policy if exists "Notebook owners can delete notebooks" on public.notebooks;
create policy "Notebook owners can delete notebooks" on public.notebooks
  for delete to authenticated using (owner_id = auth.uid());
drop policy if exists "Notebook members can see their member list" on public.notebook_members;
create policy "Notebook members can see their member list" on public.notebook_members
  for select to authenticated using (public.is_notebook_member(notebook_id));

revoke all on public.notebooks from anon, authenticated;
grant select, delete on public.notebooks to authenticated;
grant insert (owner_id, share_token, title, data) on public.notebooks to authenticated;
grant update (title, data, updated_at) on public.notebooks to authenticated;
grant select on public.notebook_members to authenticated;

-- Anyone with a share token can join, but a valid account is required.
create or replace function public.join_notebook_by_token(p_share_token uuid)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  found_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in is required to join a shared notebook';
  end if;
  select n.id into found_id
  from public.notebooks n
  where n.share_token = p_share_token;
  if found_id is null then
    raise exception 'This notebook link is invalid or has been revoked';
  end if;
  insert into public.notebook_members(notebook_id, user_id, role)
  values (found_id, auth.uid(), 'editor')
  on conflict (notebook_id, user_id) do nothing;
  return found_id;
end;
$$;
revoke all on function public.join_notebook_by_token(uuid) from public;
grant execute on function public.join_notebook_by_token(uuid) to authenticated;

-- Shared community upvotes for stable public counter / synergy item IDs.
create table if not exists public.community_votes (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('counter_tip','synergy','group_counter','group_synergy')),
  content_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_value smallint not null default 1 constraint community_votes_vote_value_check check (vote_value in (-1,1)),
  created_at timestamptz not null default now(),
  unique (content_type, content_id, user_id)
);
alter table public.community_votes add column if not exists vote_value smallint not null default 1;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'community_votes_vote_value_check'
      and conrelid = 'public.community_votes'::regclass
  ) then
    alter table public.community_votes
      add constraint community_votes_vote_value_check check (vote_value in (-1,1));
  end if;
end $$;

create index if not exists community_votes_content_idx on public.community_votes(content_type, content_id);
alter table public.community_votes enable row level security;
drop policy if exists "Members can read only their own community votes" on public.community_votes;
create policy "Members can read only their own community votes" on public.community_votes
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Members can add their own community votes" on public.community_votes;
create policy "Members can add their own community votes" on public.community_votes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members can update their own community vote direction" on public.community_votes;
create policy "Members can update their own community vote direction" on public.community_votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Members can remove their own community votes" on public.community_votes;
create policy "Members can remove their own community votes" on public.community_votes
  for delete to authenticated using (user_id = auth.uid());
revoke all on public.community_votes from anon, authenticated;
grant select, delete on public.community_votes to authenticated;
grant insert (content_type, content_id, user_id, vote_value) on public.community_votes to authenticated;
grant update (vote_value) on public.community_votes to authenticated;

-- Public aggregate score exposes net upvotes minus downvotes without exposing voters' account IDs.
create table if not exists public.community_vote_totals (
  content_type text not null,
  content_id text not null,
  vote_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (content_type, content_id)
);
alter table public.community_vote_totals
  drop constraint if exists community_vote_totals_vote_count_check;
alter table public.community_vote_totals enable row level security;
drop policy if exists "Anyone can read aggregate community votes" on public.community_vote_totals;
create policy "Anyone can read aggregate community votes" on public.community_vote_totals
  for select to anon, authenticated using (true);
grant select on public.community_vote_totals to anon, authenticated;

create or replace function public.refresh_community_vote_total()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  vote_type text;
  vote_content_id text;
  delta integer;
begin
  if tg_op = 'INSERT' then
    vote_type := new.content_type;
    vote_content_id := new.content_id;
    delta := new.vote_value;
  elsif tg_op = 'DELETE' then
    vote_type := old.content_type;
    vote_content_id := old.content_id;
    delta := -old.vote_value;
  else
    vote_type := new.content_type;
    vote_content_id := new.content_id;
    delta := new.vote_value - old.vote_value;
  end if;

  if delta <> 0 then
    insert into public.community_vote_totals(content_type, content_id, vote_count, updated_at)
    values (vote_type, vote_content_id, delta, now())
    on conflict (content_type, content_id) do update
      set vote_count = public.community_vote_totals.vote_count + excluded.vote_count,
          updated_at = now();
  end if;

  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists community_vote_total_after_change on public.community_votes;
create trigger community_vote_total_after_change
after insert or update of vote_value or delete on public.community_votes
for each row execute function public.refresh_community_vote_total();

-- Public Community Groups; private My Groups remain in user_workspaces only.
create table if not exists public.community_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_group_id text,
  name text not null check (char_length(name) between 1 and 50),
  icon text not null default '✦',
  description text not null default '' check (char_length(description) <= 160),
  members text[] not null default '{}',
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, source_group_id)
);
create index if not exists community_groups_votes_idx on public.community_groups(vote_count desc, created_at desc);
alter table public.community_groups enable row level security;
drop policy if exists "Community groups are publicly readable" on public.community_groups;
create policy "Community groups are publicly readable" on public.community_groups
  for select to anon, authenticated using (true);
drop policy if exists "Members can publish their own groups" on public.community_groups;
create policy "Members can publish their own groups" on public.community_groups
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "Members can update their own community groups" on public.community_groups;
create policy "Members can update their own community groups" on public.community_groups
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "Members can delete their own community groups" on public.community_groups;
create policy "Members can delete their own community groups" on public.community_groups
  for delete to authenticated using (owner_id = auth.uid());
revoke all on public.community_groups from anon, authenticated;
grant select on public.community_groups to anon, authenticated;
grant insert (owner_id, source_group_id, name, icon, description, members) on public.community_groups to authenticated;
grant update (owner_id, source_group_id, name, icon, description, members, updated_at) on public.community_groups to authenticated;
grant delete on public.community_groups to authenticated;

create table if not exists public.community_group_votes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);
create index if not exists community_group_votes_group_idx on public.community_group_votes(group_id);
alter table public.community_group_votes enable row level security;
drop policy if exists "Members can read only their own group votes" on public.community_group_votes;
create policy "Members can read only their own group votes" on public.community_group_votes
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Members can upvote as themselves" on public.community_group_votes;
create policy "Members can upvote as themselves" on public.community_group_votes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Members can remove their own group votes" on public.community_group_votes;
create policy "Members can remove their own group votes" on public.community_group_votes
  for delete to authenticated using (user_id = auth.uid());
revoke all on public.community_group_votes from anon, authenticated;
grant select, delete on public.community_group_votes to authenticated;
grant insert (group_id, user_id) on public.community_group_votes to authenticated;

create or replace function public.refresh_community_group_vote_count()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target_id uuid;
  delta integer;
begin
  if tg_op = 'INSERT' then target_id := new.group_id; delta := 1;
  else target_id := old.group_id; delta := -1;
  end if;
  update public.community_groups
    set vote_count = greatest(0, vote_count + delta), updated_at = now()
    where id = target_id;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists community_group_vote_count_after_change on public.community_group_votes;
create trigger community_group_vote_count_after_change after insert or delete on public.community_group_votes
for each row execute function public.refresh_community_group_vote_count();

-- Realtime publishes notebook edits and community counter changes.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notebooks') then
    alter publication supabase_realtime add table public.notebooks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_vote_totals') then
    alter publication supabase_realtime add table public.community_vote_totals;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_groups') then
    alter publication supabase_realtime add table public.community_groups;
  end if;
end $$;

-- Required grants for Supabase's Data API. RLS still governs row access.
grant usage on schema public to anon, authenticated;


-- Refresh the Supabase Data API schema cache so newly created tables are visible immediately.
NOTIFY pgrst, 'reload schema';
