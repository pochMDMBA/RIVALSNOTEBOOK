-- Repair Supabase table privileges for signed-in OLFACULATOR users.
-- Run in Supabase Dashboard > SQL Editor.
-- RLS must remain enabled; these grants do not bypass the ownership policies.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.fragrances to authenticated;
grant select, insert, update, delete on table public.saved_combinations to authenticated;
