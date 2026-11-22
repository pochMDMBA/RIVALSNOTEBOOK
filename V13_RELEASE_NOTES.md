# RIVALSNOTEBOOK v13 release notes

## Recovery basis

- Rebuilt from the original V10 deployment package as the clean baseline.
- Applied the intended V11 navigation, hero-group, Deadpool role presentation, group-detail, Synergy layout, and Playbook interaction refinements.
- Applied the V12 map-asset and Supabase SDK loading improvements.
- Retained the original V10 `config.js`, Supabase SQL schema, verification SQL, Vercel configuration, package deployment scripts, and all map JPEG assets.

## Corrective fixes made during recovery

- Fixed a roster `MutationObserver` feedback loop: the Support role label is now changed only when it does not already read Support. The prior implementation rewrote the same text on every observer callback, which could continuously retrigger itself and hang the page.
- Group-synergy details now deduplicate unordered hero pairs in the same way as the Synergy calculation, avoiding mirrored duplicates when two groups share members. Counter-rule pairings remain directional.
- Corrected the page title, README current-package label, and package version to V13.

## Map and startup behavior

- The 10 full tactical maps and 10 covers remain separate JPEG assets under `assets/maps/` and `assets/maps/covers/`. All 20 files are included.
- The map metadata and HTML use root-absolute `/assets/maps/...` URLs. Covers are lazy-loaded and full maps are loaded only on selection.
- Supabase JS is loaded asynchronously only when a Supabase project is configured. A CDN failure does not prevent the local notebook UI from initializing.

## Database and deployment

- No Supabase schema migration is required for these frontend changes.
- The original V10 `config.js` values and Supabase schema files are preserved byte-for-byte.
- The original V10 `vercel.json` and deploy scripts are preserved.
- This package has not been deployed and does not modify the live Supabase project.

## Validation performed

- ZIP structure and integrity checks.
- JavaScript syntax checks for all inline scripts, `rivalsnotebook.js`, and `config.js`.
- HTML duplicate-ID scan.
- JSON parsing and map metadata path checks.
- JPEG signature and image decoding checks for all 20 map assets.
- Byte-for-byte comparison of `config.js`, Supabase schema and verification SQL, Vercel configuration, and deploy dependencies/scripts against V10 (except package version metadata).

A live Vercel deployment test, authenticated Supabase connection test, and full manual interaction test require your actual hosted environment and have not been performed here.
