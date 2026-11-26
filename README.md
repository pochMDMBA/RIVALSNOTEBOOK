# Competitive Domination area screenshot slots

The six competitive Domination maps each have three numbered area controls. Selecting a number opens its reserved in-game screenshot slot. Selecting the **2D** button directly beneath that number opens the corresponding top-down layout image.

When adding in-game screenshots, use these filenames:

- `royal-palace-area-1.jpg`, `royal-palace-area-2.jpg`, `royal-palace-area-3.jpg`
- `birnin-tchalla-area-1.jpg`, `birnin-tchalla-area-2.jpg`, `birnin-tchalla-area-3.jpg`
- `hells-heaven-area-1.jpg`, `hells-heaven-area-2.jpg`, `hells-heaven-area-3.jpg`
- `krakoa-area-1.jpg`, `krakoa-area-2.jpg`, `krakoa-area-3.jpg`
- `celestial-husk-area-1.jpg`, `celestial-husk-area-2.jpg`, `celestial-husk-area-3.jpg`
- `god-quarry-area-1.jpg`, `god-quarry-area-2.jpg`, `god-quarry-area-3.jpg`

Place the files in this directory, then update the corresponding `points` values for keys `1`, `2`, and `3` in both the inline map registry in `index.html` and `map-library.json`. The 2D plan URLs are stored separately in each map's `layouts` object and should be retained.

Map-card covers are embedded in `index.html` as data URLs to avoid broken relative-path requests on GitHub Pages and Vercel.
