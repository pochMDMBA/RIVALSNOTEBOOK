# Domination submap screenshot slots

The v13.26 map library has six competitive Domination maps and three independent submap views per map. The views are already selectable and display the submap name. Their screenshot paths are deliberately empty until images are supplied.

When adding the screenshots, use these suggested filenames:

- `royal-palace-submap-1.jpg`, `royal-palace-submap-2.jpg`, `royal-palace-submap-3.jpg`
- `birnin-tchalla-submap-1.jpg`, `birnin-tchalla-submap-2.jpg`, `birnin-tchalla-submap-3.jpg`
- `hells-heaven-submap-1.jpg`, `hells-heaven-submap-2.jpg`, `hells-heaven-submap-3.jpg`
- `krakoa-submap-1.jpg`, `krakoa-submap-2.jpg`, `krakoa-submap-3.jpg`
- `celestial-husk-submap-1.jpg`, `celestial-husk-submap-2.jpg`, `celestial-husk-submap-3.jpg`
- `god-quarry-submap-1.jpg`, `god-quarry-submap-2.jpg`, `god-quarry-submap-3.jpg`

Place the image files in this directory, then update the corresponding `points` values for keys `1`, `2`, and `3` in both the inline `MAPS` registry in `index.html` and `map-library.json`. For example, Royal Palace Submap 1 should use `assets/maps/domination/royal-palace-submap-1.jpg`. Supported formats are JPEG, PNG, and WebP. Keep the map-level cover SVGs in `assets/maps/covers/` unchanged.
