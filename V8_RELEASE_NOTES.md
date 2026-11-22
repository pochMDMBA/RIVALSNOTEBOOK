# RIVALSNOTEBOOK v8 release notes

## Tactical map library added

- Added a map picker at the upper-left of the Playbook sidebar.
- Added ten uploaded tactical maps, grouped into Convoy and Convergence.
- Cropped map cover art from the supplied map-selection screenshot and paired each cover with its full annotated tactical map.
- Selecting a map sets it as a fitted background layer under whiteboard objects. Markers, heroes, notes, shapes, paths, and images remain editable above it.
- Added a current-map preview and a Remove Map action in the sidebar.
- Saved plays now retain their selected map with a `mapId` property; the play normalizer preserves it across reloads and Supabase snapshot hydration.
- Domination is shown as coming soon. Its cover cards were visible in the reference screenshot, but no full tactical map images for Domination were included in this batch.

## Included map sets

**Convoy:** Yggdrasil Path, Spider-Islands, Midtown, Arakko, Thebes.

**Convergence:** Shin-Shibuya, Hall Of Djalia, Central Park, Symbiotic Surface, Heart Of Heaven.

## Deployment

- Added optimized WebP tactical map backgrounds and cover thumbnails under `assets/maps/`.
- Added `map-library.json` as a readable map inventory.
- No Supabase migration is required. Map selection is stored in the existing saved-play JSON.
- Replace the files in the existing RIVALSNOTEBOOK GitHub repository and let Vercel redeploy. Keep the existing `config.js` Supabase URL and publishable/anon key values.

## Validation

The package is checked for JavaScript syntax, HTML structure, map inventory consistency, image asset references, and ZIP integrity. Live Supabase collaboration requires testing against the user's configured project.

## Final map-rendering polish

- Added an explicit fitted underlay style for the tactical map image (`object-fit: contain`) so the full map is visible without distortion and remains beneath selectable whiteboard objects.
- Kept the map layer non-interactive so it does not intercept selection, drawing, or drag actions.
- Adjusted the map chooser to occupy the board region on desktop and become a full-screen dialog on narrow/mobile layouts.
