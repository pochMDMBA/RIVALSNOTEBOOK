# RIVALSNOTEBOOK v9 — JPEG map assets

## Fix

- Converted all ten full tactical map backgrounds from WebP to JPEG.
- Converted all ten map cover thumbnails from WebP to JPEG.
- Updated the built-in map picker paths in `index.html`.
- Updated `map-library.json` and the README asset inventory.
- Removed the old bundled WebP map and cover files so the deployment package contains one canonical format.

## Compatibility note

The bundled tactical map library now uses `.jpg` / `image/jpeg`. External Marvel hero portraits and skill icons are still sourced from their existing CDN URLs and were not altered by this map-asset conversion.

## Deployment

Replace the complete project folder in the existing GitHub repository with the contents of this package, commit to `main`, and allow Vercel to redeploy. No Supabase schema migration is required. Make sure the `assets/maps/` directory is committed, including the `covers/` subdirectory.
