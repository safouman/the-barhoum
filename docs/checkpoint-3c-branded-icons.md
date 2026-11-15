# Checkpoint 3C — Course-only iconography refinement

Supersedes the visually rejected placements at `7d4cf29`. Development only; owner visual acceptance remains required.

## Placement and shared curriculum

Branded artwork is removed from About, Organizations and Resources. People Management, Leadership, Learning & Development and Mind–Heart Integration remain available as original assets, without placements.

The six approved module icons appear only within the existing featured program, using its actual Payload module titles and structure:

| Module title | Icon |
| --- | --- |
| Understand Yourself to Act Better | Emotional Intelligence |
| Decode Organizational Dynamics | Organizational Dynamics |
| Communicate with Intelligence | Communication & Influence |
| Master Your Presence in Meetings | Performance & Focus |
| Manage Pressure & Difficult Relationships | Wellbeing & Self-Regulation |
| Build Your Professional Growth Plan | Professional Growth |

The public course, owner course view and lesson-player navigation reuse the same `CurriculumList` mapping. Reordering retains the title association. An unrecognized/renamed module gets no misleading fallback icon. Displayed titles, lesson relationships and ordering remain Payload-driven; there is no second curriculum or schema change.

## Transparent source treatment

The approved PDF contains a raster board, with no original alpha/vector layers. All ten pixel-exact native crops and their original provenance remain unchanged in `public/images/brand-icons/`. Six transparent derivatives are stored separately under `transparent/`.

Image-editing background removal was trialed but introduced speckling and was rejected. The shipped derivatives instead use deterministic source-raster alpha refinement: clear border-connected neutral background pixels, then unmix the white matte into RGB/alpha. This avoids redrawing, resampling, background recoloring, CSS blend modes and white containers. Native canvas dimensions, coordinates and proportions remain unchanged. Pale highlights blend smoothly with the page; reconstructed transparency cannot be claimed to be the unavailable original alpha layer.

`scripts/prepare-module-icon-alpha.mjs` reproduces the six derivatives from retained originals using the existing Sharp installation. There is no new runtime dependency. `transparent/source.json` records output dimensions and hashes. Tests verify transparent outer borders, retention of visible source geometry and source-color reconstruction on white within 1.6 RGB levels of rounding. The cream/dark review sheet exposes edge and matte behavior.

## Composition and accessibility

Public rows use 64px artwork on desktop and 48px on narrow mobile. Student navigation uses 44px artwork. A separate 12px (11px in student navigation) ordinal sits above the module title, leaving the title dominant. Existing editorial fonts, colors, module separators, free/locked/completed lesson controls and native summary interactions are retained.

Decorative images retain empty alt text and `aria-hidden`; existing visible module headings provide meaning. Artwork is not mirrored in RTL. Functional SVG icons, keyboard focus, lesson links and completion logic are unchanged.

## Focused verification

- Original ten files pass exact hash/native-dimension checks; all six derivatives pass alpha/source-color fidelity checks.
- Lint, types and Next.js webpack build pass.
- Read-only responsive checks cover removed public placements, public curriculum, actual free lesson and locked paid lesson in EN/FR/AR at 1440, 390 and 320 px (54 combinations).
- Checks cover loaded assets, image sizes/proportions, no horizontal overflow, decorative accessibility, native keyboard accordion interaction and anonymous paid-embed denial.
- Actual signed-in Development QA browser evidence is captured separately after deployment; no synthetic ownership fixtures are substituted.
- No purchases or completion changes are made for icon verification. Native lesson visits may update the QA student's last-visited lesson through existing behavior.
- No migrations, course edits, commerce/authentication/progress implementation changes, environment changes or Production deployment.

Hosted screenshots and measured results are delivered in the companion evidence folder. External Vimeo playback is not re-certified by this visual task.
