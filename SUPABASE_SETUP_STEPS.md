# Fix the missing `public.community_groups` / `public.notebooks` error

The message `Could not find the table 'public.community_groups' in the schema cache` is a Supabase Data API (PostgREST) error. RIVALSNOTEBOOK's bundled `supabase/schema.sql` already defines both required tables. The database script must be run in the exact Supabase project that the deployed website uses, and `public` must be exposed by that project's Data API.

## Step 1: Identify the correct Supabase project

1. Open the RIVALSNOTEBOOK project files in GitHub.
2. Open `config.js`. The two values are intentionally blank until the project owner configures them.
3. Set `supabaseUrl` to the Supabase project URL. It looks like `https://YOUR_PROJECT_REF.supabase.co`.
4. Set `supabaseAnonKey` to that project's publishable key (or legacy anon key).
5. Open the Supabase Dashboard and select the project with that same project reference.
6. Commit the configured `config.js` and allow Vercel to redeploy. The in-app **Connect Supabase Project** panel is hidden in v13.38, so configure the client here instead.

Never put the Supabase `service_role` key in `config.js`, HTML, JavaScript or any browser-visible file.

If the project reference does not match, you may have run SQL in one project while the deployed site is calling another.

## Step 2: Expose the `public` schema

1. In the correct Supabase project, open **Integrations → Data API → Settings**.
2. Find **Exposed schemas**.
3. Make sure `public` is included.
4. Click **Save**.
5. If your Dashboard also shows **Exposed tables**, make sure `notebooks` and `community_groups` are enabled.

Some Dashboard layouts may place the Data API setting under **Project Settings → Data API**.

## Step 3: Run the complete database schema

1. In the same project, open **SQL Editor**.
2. Click **New query**.
3. Open `supabase/schema.sql` from the RIVALSNOTEBOOK v6 package.
4. Copy the entire file, from the first line to the final `NOTIFY pgrst` statement.
5. Paste it into SQL Editor.
6. Click **Run** and wait for success. If an error occurs, read the first SQL error and fix that before continuing.

This script creates `public.notebooks`, `public.community_groups` and their supporting tables, policies, grants, triggers and functions. Running only the schema-cache reload statement does not create missing tables.

## Step 4: Verify the required tables

1. In SQL Editor, open another **New query**.
2. Open `supabase/verify_schema.sql` from the same package.
3. Copy and run the complete file.
4. In the first result, check `notebooks` and `community_groups`.
5. Both must display their qualified table names, not `NULL`.
6. The final `DO` block should complete without a missing-table exception.

If either table is `NULL`, return to Step 3 and inspect the SQL Editor error output. Do not proceed until both tables exist.

## Step 5: Reload the Data API schema cache

Run this as its own query in SQL Editor:

```sql
NOTIFY pgrst, 'reload schema';
```

Supabase documents this as the command to reload the PostgREST schema cache. Wait a few seconds for the API to refresh.

## Step 6: Retest RIVALSNOTEBOOK

1. Open the deployed RIVALSNOTEBOOK website.
2. Refresh the page.
3. Open **Groups → Community Groups** again.
4. Test **Playbook → Collaborate** by creating a notebook link.
5. If the error remains, compare the live `config.js` project URL with the Supabase project where you ran the SQL. Also check the Exposed schemas / Exposed tables settings again.

## Step 7: If you changed `config.js`

Commit the updated `config.js` to GitHub and let Vercel redeploy. The browser file must contain the project's URL and publishable/anon key. Never paste the Supabase `service_role` key into `config.js`, HTML, JavaScript, GitHub browser code or Vercel public client variables.

## Expected result

The verification query shows both `public.notebooks` and `public.community_groups`; the website can load Community Groups and create collaborative notebooks without the PGRST205 schema-cache error.
