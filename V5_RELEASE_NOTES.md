# RIVALSNOTEBOOK v5 release notes

## Playbook editor
- New screenshot-inspired toolbar: Select, Pen, Eraser, Text, Image.
- Select is the default mode and uses a mouse-cursor icon. Active tools have a cyan/gold focus treatment.
- Context settings expose pen type, color, opacity, and thickness.
- Numeric zoom percentage is directly editable from the canvas zoom control.
- Tactical marker palette is a two-row grid; items can be clicked to place at canvas centre or dragged to a canvas position.
- Added area, downward triangle, pin, warning, flag, anchor, target, and additional existing shapes.
- Text callout checkmark now returns to Select and creates/persists the text object without a block-scope reference error.
- Arrow and dashed-arrow freehand line terminates at the arrowhead base, with a butt cap to avoid running through the triangular head.
- Pen color, opacity, and width are stored on strokes.
- Eraser removes board objects by click/drag.

## Pocket Strat
- Generated hero icons use a fixed card footprint with contained imagery and a visible name label.
- Notes use an explicit width and left position instead of a translate transform, so edit handles and saved positions remain stable.
- Pocket Strat preview includes an EDIT IN PLAYBOOK action.

## Deployment
- No Supabase SQL migration is needed for these client-side changes.
- Keep existing Vercel environment variables and Supabase URL / publishable key.
- Replace the GitHub project files and allow Vercel to redeploy.

## Validation
- JavaScript syntax and archive integrity are checked during packaging.
- Live Supabase authentication, multi-account collaboration, and real-browser pointer interactions require deployment/browser testing and are not claimed as verified here.


## Final persistence and startup-hydration fix
- Expanded the earliest saved-play normalizer to preserve all board item types and fields, especially `layoutRole`, pen paths/styles, image data, shape kind, and Pocket Strat dimensions. This prevents startup hydration from silently discarding editor objects or Pocket Strat layout metadata.
- Kept the intermediate editor normalizer as a pass-through until the full board schema normalizer is active.
- Tightened Pocket Strat image containment and callout wrapping in preview/edit mode.
- Reinforced the default Select cursor active styling and drag/drop affordances.
