# OLFACULATOR · Gradient & Combination Tier Repair

This release repairs the live Fragrance A / Fragrance B note-family gradients and improves the tier identity on saved combinations.

## Changes

- Restored note-colour gradients on both fragrance workspaces. A forced neutral `background: ... !important` rule was overriding the inline layered gradients written by `applyFragranceAtmosphere()`. The forced neutral surface now applies only to non-fragrance panels.
- Increased the saved-combination tier letter and score display. The letter now has tier-specific metallic/neutral/distressed coloring and matching glow: gold S, silver A, bronze B, neutral C, and distressed F.
- Preserved the current scoring, profile storage, Supabase credentials, account logic, responsive layout, manifest, icons and SQL files.
- Bumped the service-worker cache to `olfaculator-shell-v14`.

## Deploy

1. Replace the repository root `index.html` and `service-worker.js` with the files in this project.
2. Keep `manifest.webmanifest`, the complete `icons/` directory, `supabase-schema.sql` and `supabase-permissions-fix.sql`.
3. Commit and push to GitHub / Vercel.
4. Hard-refresh the site. On an installed PWA, allow the new service worker to activate; close and reopen the app if the previous stylesheet remains cached.

No Supabase SQL migration is required.
