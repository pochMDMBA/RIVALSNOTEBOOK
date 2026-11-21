# RIVALSNOTEBOOK v6

## Counterpick and Synergy layout

- Replaced the Counterpicks roster's left-side `ENEMY TEAM 0/6` selector tab with a red `ENEMY TEAM` badge and a short instruction, matching the green `ALLIED TEAM` badge in the Synergies roster.
- Kept the right-side enemy lineup and its count, so the six-slot team editor still shows its current occupancy.

## Hero image framing

- Increased the visible portrait area in roster tiles and counter suggestion cards.
- Increased the portrait area for Synergy pair tiles and team lineup slots.
- Removed clipping from portrait containers and consistently centered all artwork using `object-fit: contain` and `object-position: center`.
- Added smaller-screen sizing to prevent the larger images from breaking narrow layouts.

## Playbook sidebar toolbar

- Reduced primary and shape icon dimensions to stay inside their button boxes on narrow sidebars.
- Reduced toolbar button padding and clipped only the button glyph bounds, preventing icons from overlapping adjacent button borders.
- Reflowed Type, Color, Opacity and Thickness settings within the available sidebar width; color swatches now use a compact seven-column row.
- Kept the five-column shape palette and preserved click-to-place and drag-to-canvas behavior.

## Supabase setup guidance

- Updated the in-app `PGRST205` message with clearer checks for the project URL, complete schema setup, exposed schemas/tables, verification query and schema-cache reload.
- Updated `supabase/verify_schema.sql` to display the required table names, reload PostgREST's schema cache and raise a clear error if either `public.notebooks` or `public.community_groups` is missing.
- Added a dedicated step-by-step Supabase setup document.
- No new database migration is required when the existing full `supabase/schema.sql` has already been applied successfully.

## Deployment package repair

The v5 ZIP omitted files referenced by the HTML. v6 includes the complete static project dependencies:

- `index.html`
- `rivalsnotebook.css`
- `rivalsnotebook.js`
- `config.js`
- `package.json`
- `vercel.json`
- Supabase schema and verification SQL
- Research and release notes

**Important:** The included `config.js` is a blank template. Before deploying, preserve the working Supabase project URL and publishable/anon key from your existing GitHub repository's `config.js`, or enter them in the app's Connect Supabase Project window. Never use a service-role key in the browser.
