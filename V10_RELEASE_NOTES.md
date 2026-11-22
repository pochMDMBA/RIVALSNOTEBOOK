# RIVALSNOTEBOOK v10 release notes

## Map image reliability
- Embedded all 10 tactical map JPEGs and all 10 cover thumbnails directly into `index.html` as JPEG data URIs.
- The map selector and tactical board no longer depend on relative `/assets/maps/...` URLs, Vercel clean URL behavior, or a nested project root for runtime map images.
- Kept the original JPEG assets in `assets/maps/` for portability and future editing.

## Counterpick / Synergy parity
- Standardized counterpick and synergy hero portrait frames to 82 × 104 px on desktop and 68 × 88 px on narrow layouts.
- Harmonized hero-name, role-label and reason typography.

## Hero Groups
- Rebuilt group cards with a separate top-left delete control.
- Added symmetrical, equal-width VIEW GROUP / EDIT / SUBMIT TO COMMUNITY actions.
- Added a full group details modal with full description and members arranged under Vanguard, Duelist and Support.
- Hero portraits are smaller in card summaries.
- Deadpool appears in all three role categories in group cards, rather than a separate Multi-role category. The global hero record remains Multi-role for the multi-kit selector and ability metadata.

## Data / compatibility
- No Supabase schema migration is required.
- Existing group IDs, group names, icons, descriptions and membership are retained.
- Map selections continue to save by map ID.
