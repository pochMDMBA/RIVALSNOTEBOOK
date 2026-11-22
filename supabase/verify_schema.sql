-- Run this in the SAME Supabase project configured in config.js, after schema.sql.
-- Each table column should show its qualified name, not NULL.
select
  to_regclass('public.user_workspaces') as user_workspaces,
  to_regclass('public.notebooks') as notebooks,
  to_regclass('public.notebook_members') as notebook_members,
  to_regclass('public.community_votes') as community_votes,
  to_regclass('public.community_vote_totals') as community_vote_totals,
  to_regclass('public.community_groups') as community_groups,
  to_regclass('public.community_group_votes') as community_group_votes;

-- Ask the Supabase Data API (PostgREST) to refresh its table cache.
NOTIFY pgrst, 'reload schema';

-- Fail clearly if either missing-table error would still occur.
do $$
begin
  if to_regclass('public.notebooks') is null then
    raise exception 'Missing public.notebooks. Run the complete supabase/schema.sql in this project.';
  end if;
  if to_regclass('public.community_groups') is null then
    raise exception 'Missing public.community_groups. Run the complete supabase/schema.sql in this project.';
  end if;
  raise notice 'RIVALSNOTEBOOK core tables exist. If the browser still reports PGRST205, check Data API exposed schemas and the project URL in config.js.';
end $$;
