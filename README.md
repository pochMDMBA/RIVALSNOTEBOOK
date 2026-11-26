# RIVALSNOTEBOOK

**Current deployment package: v13.34.** See `V13.34_RELEASE_NOTES.md` for the corrected pen-width scale, fixed Synergies heading, Playbook Pocket Strat workflow and number-marker resizing.

**v13.30 baseline:** Replaced the six Competitive Domination cover thumbnails with clean crops from the latest unannotated `marvelrivals.gg/maps/` screenshot. All 18 Domination 2D layout URLs and the separate cover/tactical map asset registries are retained. Saved Plays are restricted to one map and its complete Point/Submap plus 2D view set; changing maps from an active saved play prompts to start a new play.

RIVALSNOTEBOOK is the renamed Marvel Rivals counter-pick, synergy, hero-group and tactical whiteboard app. This package adds a Vercel-ready static site and a Supabase backend layer for account sync, shared community votes, public Community Groups, and live collaborative Playbook notebooks.

## Important: what is ready, and what still needs your project

The application code, SQL schema, login UI, private workspace sync, public group directory, global vote handling, share-link flow and Realtime notebook sync are included. Cross-account services become active after you connect your own Supabase project and deploy this folder to Vercel. I cannot activate a Supabase database or publish a Vercel site without access to your projects and credentials.

The app still works locally without a backend connection. My Groups and app data use browser storage until an account backend is connected.

## 1. Create your Supabase project

1. Create a project in Supabase.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the full script in `supabase/schema.sql`.
4. In **Integrations → Data API**, copy the Project URL. In **Settings → API Keys**, copy the **publishable key** (or legacy `anon` key). Do not use the `service_role` key.
5. In **Authentication → URL Configuration**, add your Vercel production URL to the allowed redirect URLs. Add your local preview URL too if you plan to test previews.
6. In **Authentication → Providers**, enable Email. For a production public app, configure the SMTP sender and email confirmation settings you want.

The schema enables row-level security. Private workspaces are account-scoped, Community Groups and aggregate vote counts are publicly readable, and individual vote rows are visible only to the account that cast them. Notebook links let authenticated accounts join as editors. Do not disable RLS.

## 1A. Fixing “Could not find the table in the schema cache”

The app depends on the public tables `notebooks` and `community_groups` (plus their related tables). A `PGRST205` error means the connected Supabase Data API cannot see the table. The browser cannot safely create database tables itself.

Follow these steps in order. Do not skip the project-match check.

1. **Open the Supabase project used by the live website.** In this package, open `config.js`. Read the `supabaseUrl`, which looks like `https://abcdefghijk.supabase.co`. The part before `.supabase.co` is the project reference. Open that exact project in the Supabase Dashboard. If you use the in-app **SIGN IN → CONNECT SUPABASE PROJECT** settings instead, check the URL saved there as well.
2. **Expose the `public` schema.** In the Supabase Dashboard, open **Integrations → Data API → Settings**. Under **Exposed schemas**, make sure `public` is present, then click **Save**. Depending on the Dashboard layout, this setting may appear under **Project Settings → Data API**. If the Dashboard has an **Exposed tables** list, make sure `notebooks` and `community_groups` are enabled too.
3. **Run the full database setup.** Open **SQL Editor → New query** in the same project. Open this package's `supabase/schema.sql`, copy the entire file, paste it into the editor, and click **Run**. Do not run only the last `NOTIFY` line. Wait for the SQL Editor to report success. This script creates `public.notebooks`, `public.community_groups`, their related tables, RLS policies, grants, triggers and the notebook-join function. It is idempotent and safe to run again.
4. **Verify the tables.** In SQL Editor, create another query, paste the entire contents of `supabase/verify_schema.sql`, and click **Run**. The first result should show a non-NULL name in every table column, especially `notebooks` and `community_groups`. The final block should report that the core tables exist. If either is NULL or the query raises a missing-table error, the schema setup did not finish successfully. Check the SQL Editor's error output from step 3 and run the full script again after correcting the reported issue.
5. **Reload the Data API cache.** Run this as a separate SQL query and click **Run**:

   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

   Supabase documents this statement as the way to refresh PostgREST's schema cache. Wait a few seconds, then refresh RIVALSNOTEBOOK. Sign out and sign in again if the page still displays the earlier error.
6. **If the error remains**, re-check the project reference in `config.js` against the Dashboard project you just updated. Make sure the browser deployment contains the same URL and publishable/anon key for that project. If you changed `config.js`, commit it and redeploy to Vercel. Never paste a `service_role` key into the browser app.

Do not create these tables manually in the Table Editor with a different structure. The app's policies, triggers, grants and collaboration RPC function are also required. A schema-cache reload alone cannot create a missing database table.

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

- `index.html` — app interface, Playbook map picker and existing application logic.
- `assets/maps/` — ten full tactical maps and their cover thumbnails in broadly supported JPEG format.
- `map-library.json` — map names, modes, and asset paths.
- `rivalsnotebook.css` — RIVALSNOTEBOOK brand and community styling.
- `rivalsnotebook.js` — Supabase Auth, private data sync, votes, Community Groups and collaboration.
- `config.js` — public Supabase URL and publishable/anon key configuration.
- `supabase/schema.sql` — database tables, RLS policies, triggers, Realtime publication setup and schema-cache reload.
- `supabase/verify_schema.sql` — checks that every required public table exists, then reloads the Data API schema cache.
- `SUPABASE_SETUP_STEPS.md` — step-by-step troubleshooting for the missing Community Groups / notebooks table error.
- `V6_RELEASE_NOTES.md` — this release’s UI, portrait and packaging changes.
- `package.json` — Vercel CLI convenience scripts.
- `vercel.json` — static Vercel deployment configuration.

## Recent interface update

The Playbook pen now has an adjustable 0.5%–5.0% stroke-width control. The selected thickness is saved with each stroke, so older and saved plays retain their own line width when reloaded. A refreshed dark navy / teal interface polish improves the navigation, cards, panels, inputs and board controls.


## Counterpick list improvements

- Every applicable matchup reason is shown directly under its suggested counter hero.
- Each suggested hero can be collapsed or expanded independently to make room for lower-ranked suggestions.
- Matchup labels include the enemy hero portrait beside the `VS` label.
- Counter suggestions and the hero roster use bounded, touch-friendly scroll areas when their lists are long.


## v4: current hero coverage, Pocket Strat layout and Playbook polish

- Expanded built-in counterpick tips by 39 (132 total) and synergies by 29 (162 total). Every one of the 55 heroes is now represented as a suggested counter, a counter target and in at least one community synergy.
- New tips are conservatively tiered and source-labelled. Reddit-informed entries link to player discussions; other gaps are explicitly labelled mechanics-based soft checks rather than being represented as proven counters. New entries start with zero votes.
- Older local and Supabase workspace data merges new built-ins by stable ID, while keeping existing user edits and votes.
- Pocket Strat autogenerated hero tokens are larger, centered and consistently spaced; the notes block is centered and given its own readable area.
- Freehand-arrow and dashed-arrow strokes now meet the triangular arrowhead at its base.
- Active board tools have a stronger selected state. Clear Board removes all board objects, including text and callouts.
- Default pen thickness is 0.5%; explicitly saved per-stroke widths are preserved.
- Hero portrait images across roster, counter suggestions, synergies, groups, and Playbook tokens use centered `object-fit: contain` sizing to avoid clipping.
- See `RESEARCH_NOTES.md` for the full list of additions, evidence labels, caveats and source links.


## v5 Playbook editor update

- Added a screenshot-inspired primary toolbar with active Select, Pen, Eraser, Text, and Image tools.
- Added contextual Type, Color, Opacity, and Thickness controls.
- Rebuilt the tactical shape palette with click-to-place and drag-to-canvas behavior.
- Added editable numeric zoom percentage.
- Fixed text callout save handling so the checkmark creates and persists the callout.
- Improved Pocket Strat auto-layout for hero art and notes in preview and editing.
- Added eraser interaction and extended tactical shape serialization.
- Matched arrow pen shaft termination to the arrowhead base.

The live Supabase project was not changed by this front-end update; no SQL migration is required.


## v5 Playbook editor refresh

- Reorganized the editor into a primary tool row, contextual Type/Color/Opacity/Thickness settings, and a lower shape/stamp palette.
- The Select cursor is active on startup and has a persistent active-state highlight.
- Shapes and tactical stamps can be clicked to place at the canvas center or dragged onto the board at the drop location.
- Added numeric zoom percentage entry.
- Fixed the inline callout editor save action so the checkmark creates and persists text notes.
- Improved Pocket Strat hero-card and note sizing, and retained `layoutRole`, pen, shape, image, and skill metadata during saved-play hydration.
- Set the default pen thickness to 0.5%.

For this front-end update, no new Supabase migration is required. Replace the deployed app files and redeploy through the connected GitHub/Vercel project.


## v6 counter/team layout, portrait framing and sidebar tool fit

- Replaced the Counterpicks roster's left-side `ENEMY TEAM 0/6` tab with a red ENEMY TEAM badge and selection hint, matching the green ALLIED TEAM badge on Synergies. The right-side enemy lineup count remains available beside the lineup.
- Expanded hero-art frames and removed clipping from roster, counter suggestion, Synergy pair and team-lineup portrait wrappers. Hero artwork is centered and scaled with `object-fit: contain`.
- Tightened toolbar icon and settings sizing so primary tools, pen-type buttons, color swatches, sliders and tactical markers stay within their borders in narrow Playbook sidebars.
- Updated the on-screen missing-table guidance and the Supabase setup walkthrough.
- Restored all required static deployment files in the package (`rivalsnotebook.css`, `rivalsnotebook.js`, `config.js`, `package.json`, and `vercel.json`). Earlier v5 ZIP packaging omitted several files referenced by `index.html`; this release includes them.

No new database migration is required if the full `supabase/schema.sql` was already applied. If the Community Groups / notebook table error is still present, follow section 1A and run the full schema against the exact Supabase project configured in `config.js`.


## v8 tactical map library

The Playbook now has a **TACTICAL MAP** picker at the top of the left sidebar. It contains the ten maps supplied in the November 22, 2026 upload: five Convoy maps and five Convergence maps. Each selectable tile uses the matching cover artwork cropped from the supplied map-selection screenshot. Selecting a tile loads the corresponding full annotated tactical map as a fitted whiteboard background.

- Convoy: Yggdrasil Path, Spider-Islands, Midtown, Arakko and Thebes.
- Convergence: Shin-Shibuya, Hall Of Djalia, Central Park, Symbiotic Surface and Heart Of Heaven.
- Domination is intentionally marked as coming soon. Only cover cards appeared in this upload; the full Domination tactical maps have not yet been supplied.

Each saved Playbook stores its selected map using a `mapId` field. The field is retained by local workspace hydration and Supabase notebook snapshots, so shared plays can restore their chosen map. No Supabase schema migration is required because the map ID is part of the existing saved-play JSON.

Map files are stored as `.jpg` in `assets/maps/`; cover thumbnails are `.jpg` in `assets/maps/covers/`. JPEG is used for the bundled map assets for compatibility with static hosting and image-serving pipelines. `map-library.json` lists the metadata and root-absolute asset paths used by the Vercel deployment.


## v10 update

This release embeds every tactical-map JPEG and cover thumbnail directly into `index.html`, so the map picker and board backgrounds do not rely on relative asset paths. The separate `assets/maps/` JPEGs remain included for editing/export. Counterpick and Synergy portrait frames and typography are standardized. Group cards now show heroes by Vanguard, Duelist and Support, with Deadpool shown under all three, and include View Group, Edit and Submit to Community actions.


## v11 update

- Counterpicker and Synergy page columns now use the same two-panel geometry, portrait dimensions (82×104 desktop, 68×88 small screens), and recommendation typography.
- Synergies is the first navigation tab; Counterpicker remains the default landing page.
- Group cards open a full detail view when the card surface is clicked. The view includes applicable Group Synergy Rules and Group Counter Rules with expanded hero combinations.
- Group Synergy Rules are displayed above Group Counter Rules. Group delete control is at the upper-right of each card.
- The Playbook no-map state uses a CSS tactical grid preview instead of an empty image. The Playbook header uses the brand SVG mark.
- Select/Move is the default active whiteboard tool. Pen and eraser are only highlighted when explicitly selected. Multi-selected objects can be dragged together and retain a visible selection outline.
- Deadpool is displayed under Vanguard, Duelist and Support, including the hero dock role filters and group editor role views. No Multi-role filter is shown.
- Default whiteboard zoom is 100%.

No Supabase schema migration is required for these frontend changes. Preserve your existing `config.js` values and Supabase project settings when updating the GitHub repository.


## v12 performance and asset-loading update

- Tactical map metadata is now lightweight; all 10 cover JPEGs and 10 full-map JPEGs are separate files under `assets/maps/` and referenced with root-absolute `/assets/maps/...` URLs. Keep the complete `assets/maps` directory in the Vercel deployment.
- The multi-megabyte Base64 map payload has been removed from the inline JavaScript. Covers are lazy-loaded by the map picker; a full map loads only when selected.
- Supabase JS is dynamically loaded after the page shell has parsed. If the CDN is blocked or slow, the local notebook UI still loads; cloud features show an availability message and can be retried after refreshing.


## Map library and point views (V13.7)

- Existing Convergence overview images remain the **2D** view.
- The uploaded Point A, Point B and Point C screenshots are available as separate selectable views for Central Park, Hall of Djalia, Symbiotic Surface, Heart of Heaven, Shin-Shibuya and Lower Manhattan.
- Lower Manhattan is listed under Convergence and has a hosted cover image. A verified full-map 2D overview was not available for this package, so its 2D option stays disabled while Points A, B and C remain available.
- Map choice and selected point view are saved with the active play and in browser storage.
- User-supplied Point A/B/C screenshots are stored as JPEG files directly under `assets/maps/` beside the established 2D overview images. Flat placement avoids deployment rules that omit nested point-image folders.


## V13.8
See `V13.8_RELEASE_NOTES.md` for the JPEG point-map conversion, group counter rule navigation, consistent Counterpicker hero picker, and Playbook placement/drawing improvements.


## V13.9
See `V13.9_RELEASE_NOTES.md` for the latest changes.


## V13.13

See [V13.13 Release Notes](V13.13_RELEASE_NOTES.md) for deployment-safe embedded Convergence point images and Playbook text styling/editor improvements.


## V13.14

See [V13.14 Release Notes](V13.14_RELEASE_NOTES.md) for the latest Playbook toolbar, themed save actions, Enemy toggle, and editable text-box improvements.


## V13.15

See [V13.15 Release Notes](V13.15_RELEASE_NOTES.md) for bounded Save As controls, compact FILL/BORDER/TEXT controls, reduced Playbook heading spacing, and the corrected Synergies results layout.


## V13.16

See [V13.16 Release Notes](V13.16_RELEASE_NOTES.md) for smaller default hero/enemy tokens, accurate pen-type icons, a green preset swatch, text-box no-fill/no-border options, editable font size, free width/height resizing, and the transparent Recommended Synergies heading.


## V13.17

See [V13.17 Release Notes](V13.17_RELEASE_NOTES.md) for the arrowhead-base connector fix, removed Eraser tool, updated freehand button styling, non-overlapping text font-size controls, and tighter Playbook tool-header spacing.

## V13.18

See [V13.18 Release Notes](V13.18_RELEASE_NOTES.md) for release-time-only arrowheads with exact base connection, simplified live pen previews, and custom text FILL/BORDER color popovers with icon-only no-fill/no-border actions.
