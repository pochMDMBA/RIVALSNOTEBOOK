-- RIVALSNOTEBOOK v13.37: account-scoped upvotes and downvotes.
-- Existing community votes are preserved as upvotes (vote_value defaults to +1).
-- Run this migration once in the Supabase SQL Editor for the project in config.js.

alter table public.community_votes
  add column if not exists vote_value smallint not null default 1;

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

drop policy if exists "Members can update their own community vote direction" on public.community_votes;
create policy "Members can update their own community vote direction" on public.community_votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant update (vote_value) on public.community_votes to authenticated;
grant insert (content_type, content_id, user_id, vote_value) on public.community_votes to authenticated;

-- vote_count now means net score (upvotes minus downvotes), so a negative
-- aggregate is valid. Existing totals already equal the number of existing
-- upvotes and therefore remain correct after the new vote_value default.
alter table public.community_vote_totals
  drop constraint if exists community_vote_totals_vote_count_check;

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

notify pgrst, 'reload schema';
