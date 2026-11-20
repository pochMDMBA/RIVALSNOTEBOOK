# RIVALSNOTEBOOK

RIVALSNOTEBOOK is the renamed Marvel Rivals counter-pick, synergy, hero-group and tactical whiteboard app. This package adds a Vercel-ready static site and a Supabase backend layer for account sync, shared community votes, public Community Groups, and live collaborative Playbook notebooks.

## Important: what is ready, and what still needs your project

The application code, SQL schema, login UI, private workspace sync, public group directory, global vote handling, share-link flow and Realtime notebook sync are included. Cross-account services become active after you connect your own Supabase project and deploy this folder to Vercel. I cannot activate a Supabase database or publish a Vercel site without access to your projects and credentials.

The app still works locally without a backend connection. My Groups and app data use browser storage until an account backend is connected.

## 1. Create your Supabase project

1. Create a project in Supabase.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the full script in `supabase/schema.sql`.
4. In **Project Settings → API**, copy the Project URL and the **publishable key** (or legacy `anon` key). Do not use the `service_role` key.
5. In **Authentication → URL Configuration**, add your Vercel production URL to the allowed redirect URLs. Add your local preview URL too if you plan to test previews.
6. In **Authentication → Providers**, enable Email. For a production public app, configure the SMTP sender and email confirmation settings you want.

The schema enables row-level security. Private workspaces are account-scoped, Community Groups and aggregate vote counts are publicly readable, and individual vote rows are visible only to the account that cast them. Notebook links let authenticated accounts join as editors. Do not disable RLS.

## 1A. Fixing “Could not find the table in the schema cache”

The app depends on the public tables `notebooks` and `community_groups` (plus their related tables). A `PGRST205` error means the connected Supabase Data API cannot see the table. The browser cannot safely create database tables itself.

1. Check that `config.js` points to the same Supabase project where you are running SQL.
2. Run the **entire** `supabase/schema.sql` script in that project's SQL Editor. It is designed to be safe to run again and ends by asking PostgREST to reload its schema cache.
3. Run `supabase/verify_schema.sql`. Each required table should show a non-null relation name.
4. In Project Settings → Data API, confirm `public` is included in Exposed schemas. If the tables exist but the app still reports `PGRST205`, run `NOTIFY pgrst, 'reload schema';` in SQL Editor and refresh the website.

Do not create these tables manually in the Table Editor with a different structure. The app's policies, triggers, grants and collaboration RPC function are also required.

## 2. Connect the app to Supabase

Edit `config.js` and fill the values:

```js
window.RIVALSNOTEBOOK_CONFIG = {
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
};
```

Only the publishable/anon key belongs in this browser file. The database policies in `supabase/schema.sql` protect the data. Never place a service-role key in `config.js`, HTML, JavaScript, or any Vercel public environment variable.

You can also enter the project URL and publishable/anon key from **SIGN IN → CONNECT SUPABASE PROJECT**. That method stores the configuration in the current browser only. Editing `config.js` is the right option for a public Vercel deployment so every visitor receives the same backend configuration.

## 3. Deploy to Vercel

### Dashboard deployment

1. Put this folder in a Git repository.
2. Import the repository into Vercel.
3. Set the project root to this folder if the repository contains other folders.
4. Select **Other** as the framework preset. No build command is required; the site is static HTML, CSS and JavaScript.
5. Deploy.

### Vercel CLI

From this folder, run:

```bash
npm install
npx vercel
npx vercel --prod
```

The included `vercel.json` applies static-site headers and clean URLs. Vercel's standard static deployment serves `index.html` at the project root.

## 4. How the account features work

### Private account workspace

After sign-in, RIVALSNOTEBOOK loads the account's `user_workspaces` record and saves changes back to it. This includes My Groups, counter tips, synergies and saved plays. My Groups are private to their owner under RLS. A new account starts with a clean workspace; the sign-in window offers an explicit **IMPORT THIS DEVICE'S LOCAL DATA** action when local data exists, so one account's private data is never silently copied into another account.

### Community upvotes

Upvotes require an account. Each account can have one vote per content item. The app stores individual votes in `community_votes` and maintains public aggregate totals in `community_vote_totals`. Aggregate counts are readable by everyone, including signed-out visitors, while voter IDs are not exposed through the app's read policy. Realtime updates refresh vote totals while the app is open.

The built-in counter tips and synergies use stable IDs, so their vote totals are shared across all accounts. Custom locally-authored tips and synergies are still in the owner's private workspace unless separately made into community content in a future update.

### My Groups and Community Groups

- **My Groups** are private to the signed-in account.
- **Community Groups** are publicly readable and sorted by upvotes.
- **Submit to Community** publishes a copy of a private group.
- **Add to My Groups** copies a public group into the signed-in user's private collection.
- Community group votes are one per signed-in account and visible in the public vote count.

### Live collaborative notebooks

Press **COLLABORATE** while signed in and create a share link. Friends open that unique URL, create or sign in to their own accounts, and join the notebook. Notebook membership is recorded in `notebook_members`; edits to the Playbook name and whiteboard objects sync through Supabase Realtime. The shared notebook contains Playbook data only. It does not expose the owner's private My Groups or private account workspace.

The current collaboration layer synchronizes the notebook document state after an app save/action. It is a shared live board with last-save-wins behavior for overlapping edits, not a character-by-character text CRDT like Google Docs. Avoid editing the same object at the exact same time. Users can collaborate in one shared notebook with two or more accounts.

## 5. Quick test checklist

1. Deploy and connect Supabase.
2. Create two accounts using separate browser profiles.
3. On account A, make a private group. Confirm it appears in My Groups.
4. Submit that group. Open Community Groups from account B and confirm it is visible.
5. Upvote from account B. Refresh account A and confirm the count is visible there too.
6. From account A, open Playbook → Collaborate → Create Share Link.
7. Open the link in account B. Confirm B joins and can move or add an object on the board; verify the change appears in account A.
8. Confirm account B cannot see A's private My Groups unless A explicitly submits them to Community Groups.

## Files

- `index.html` — app interface and existing application logic.
- `rivalsnotebook.css` — RIVALSNOTEBOOK brand and community styling.
- `rivalsnotebook.js` — Supabase Auth, private data sync, votes, Community Groups and collaboration.
- `config.js` — public Supabase URL and publishable/anon key configuration.
- `supabase/schema.sql` — database tables, RLS policies, triggers, Realtime publication setup and schema-cache reload.
- `supabase/verify_schema.sql` — checks that every required public table exists, then reloads the Data API schema cache.
- `vercel.json` — static Vercel deployment configuration.

## Recent interface update

The Playbook pen now has an adjustable 0.5%–5.0% stroke-width control. The selected thickness is saved with each stroke, so older and saved plays retain their own line width when reloaded. A refreshed dark navy / teal interface polish improves the navigation, cards, panels, inputs and board controls.
