# RIVALSNOTEBOOK v11 release notes

## Navigation and layout
- Synergies tab appears before Counterpicker. Counterpicker remains the default landing page.
- Synergy workspace now uses the same two-column panel geometry as Counterpicker.
- Synergy recommendation portraits use the Counterpicker frame size: 82×104 px desktop and 68×88 px on small screens. Text sizing for hero names, roles and recommendation reasons is matched.

## Groups
- Clicking the body of a Hero Group card opens its detail view. The VIEW GROUP action remains available.
- The group detail view lists every applicable Group Synergy Rule and Group Counter Rule, including expanded member-to-member combinations and the rule description.
- Group Synergy Rules appear before Group Counter Rules.
- The red delete X is positioned at the upper-right of each group card.
- Deadpool is displayed across Vanguard, Duelist and Support role groupings. The Multi-role filter is removed from the hero dock.

## Playbook
- The no-map state renders a CSS tactical-grid canvas preview rather than an empty image element. Selecting a map hides the preview and displays the selected cover.
- Replaced the text-only RN mark in the Playbook title with the RivalsNotebook SVG logo, using a unique gradient ID.
- Select/Move is the only initially active tool. Freehand pen and eraser highlights appear only when those tools are selected.
- Default zoom is 100%.
- Dragging any member of a multi-selection moves the entire selected set. All selected objects retain a visible gold selection outline.

## Deployment
- Frontend-only update. No Supabase schema migration is required.
- Keep the existing `config.js` Supabase URL and publishable/anon key. Do not replace them with the blank template.
- Replace the existing repository files with this package and redeploy through Vercel.

## Validation
- Static HTML parse, duplicate-ID scan, JavaScript syntax checks, CSS parsing and ZIP integrity checks passed.
- A full live browser interaction test and live Supabase connection test were not performed in this environment.
