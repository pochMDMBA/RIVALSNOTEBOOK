# RIVALSNOTEBOOK v7 release notes

## Group card identity and actions

- Group card headers now keep the group icon and name in a dedicated row.
- Edit, Delete (×), and Submit to Community actions occupy a separate row below the header on desktop and mobile. The delete control is explicitly returned to normal document flow so it cannot float over the name or icon.
- The group editor captures the group's immutable ID and a snapshot when Edit is opened. Save and delete resolve against that ID, preserving the original group record and metadata.
- Community submission now publishes a detached snapshot of the private group and stops the action event from bubbling into unrelated group controls. Publishing does not mutate the private group's name, icon, or members.

## Playbook tool state and eraser

- Select is the sole active tool on initial load and when entering Playbook.
- Pen and Eraser are not highlighted at startup. Choosing a tool updates the active highlight.
- Eraser removes board geometry and marks only: shapes, freehand strokes/arrows, arrows, walls, broken lines, pits, and number markers.
- Eraser ignores hero portraits, skill/ability icons, inserted images, and text callouts.

## Synergy heading

- Allied Team now uses a green, icon-led badge at the upper-left of the Synergies panel, matching the presentation of the Enemy Team badge.

## Validation performed

- `rivalsnotebook.js` and all inline JavaScript blocks pass `node --check`.
- HTML parsing found no duplicate IDs.
- Browser interaction tests confirmed group create/edit/cancel/delete preserves group name and icon, only Select is active at startup, tool switching updates the active state, and erasing a test shape leaves a callout, hero portrait, skill icon, and inserted image intact.
- Desktop and mobile layout checks confirmed the Edit, Delete and Submit controls sit below the group name/icon without overlap.
- Supabase publish behavior was hardened to submit a detached record snapshot; live publishing still requires the user's configured Supabase project and authentication.

No database migration is required for v7.
