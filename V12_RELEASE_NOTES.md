# RIVALSNOTEBOOK v12

## Browser hang / startup performance

- Removed the 6.8 MB inline Base64 block containing ten full maps and ten cover thumbnails. The application HTML now references the existing JPEG assets under `/assets/maps/` and `/assets/maps/covers/`.
- Switched to root-absolute image paths so the map assets still resolve on Vercel clean URLs and nested page routes.
- Map covers remain lazy-loaded. Full tactical maps are loaded only when selected and use asynchronous image decoding.
- Removed the parser-blocking Supabase CDN script tag. The Supabase SDK is now loaded asynchronously only when a Supabase project is configured. A CDN failure no longer blocks the local app from initializing.

## Deployment notes

- Replace the existing project files with this package.
- Keep the entire `assets/maps/` directory.
- Preserve the user's existing `config.js` values and Vercel environment settings.
- No Supabase migration is required.

## Validation

- Verified all 20 JPEG files exist and can be decoded.
- Verified all ten map metadata entries point to root-absolute paths matching the supplied JPEG files.
- Verified the inline map payload was removed and the Supabase SDK is no longer parser-blocking.
- Run the application in a real browser after deployment to confirm the CDN and Vercel asset requests complete in the user's environment.
