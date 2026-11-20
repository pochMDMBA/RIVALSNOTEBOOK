-- Run after schema.sql. All expected objects should report true.
select
  to_regclass('public.user_workspaces') as user_workspaces,
  to_regclass('public.notebooks') as notebooks,
  to_regclass('public.notebook_members') as notebook_members,
  to_regclass('public.community_votes') as community_votes,
  to_regclass('public.community_vote_totals') as community_vote_totals,
  to_regclass('public.community_groups') as community_groups,
  to_regclass('public.community_group_votes') as community_group_votes;

-- If tables exist but the Data API still reports PGRST205, refresh the cache.
NOTIFY pgrst, 'reload schema';
