# Checkpoint 3C — Original branded iconography

Development-only implementation. Owner visual acceptance remains pending.

## Source and fidelity

The attached `Ibrahim_Ben_Abdallah_Icon_System_APPROVED.pdf` contains one embedded 1774 × 887 RGB raster board, rather than individual vector icons. Ten native-resolution, lossless PNG crops retain the original background, colors, gradients, proportions and pixels. No tracing, redrawing, recoloring, transparency conversion or resampling was applied. Next Image uses `unoptimized` with `object-fit: contain` to avoid lossy conversion or distortion. The supplied artwork has a baked-in light background; it is deliberately retained.

`public/images/brand-icons/source.json` records the source PDF/image hashes, exact crop rectangles, native dimensions and asset hashes. `scripts/verify-brand-icon-source.py <approved.pdf>` verifies decoded pixel equality against the PDF; Pillow and pypdf are audit tools, not application dependencies. `node --test tests/brand-icons/assets.test.mjs` guards the extracted file bytes and dimensions.

## Placement map

| Original icon | Existing placement |
| --- | --- |
| Emotional Intelligence | Program module: Understand Yourself to Act Better |
| People Management | Organizations: Human ↔ Human |
| Organizational Dynamics | Program module: Decode Organizational Dynamics |
| Professional Growth | Program module: Build Your Professional Growth Plan |
| Performance & Focus | Program module: Master Your Presence in Meetings |
| Communication & Influence | Program module: Communicate with Intelligence |
| Leadership | About: Clarity, judgment, and human relationships |
| Learning & Development | Resources: Free course previews |
| Wellbeing & Self-Regulation | Program module: Manage Pressure & Difficult Relationships |
| Mind–Heart Integration | About: The future is artificial. The difference is human. |

The six existing module headings and ordering remain Payload-backed. Artwork is assigned by the current approved module title, only on the featured program. Reordering preserves the association; a renamed/unrecognized module receives no misleading replacement icon. This is a presentation mapping, without schema or course-data changes. Public-page mappings apply to the corresponding existing EN/FR/AR sections.

## Accessibility and scope

Icons accompany existing visible headings, so they have empty alt text and are hidden from assistive technology. They are decorative, not controls. Module numbers, native accordion summaries, carets, lock/play/list/download/arrow icons and focus behavior are preserved. Artwork never flips in RTL. Existing fonts, colors, logo, content, links and actions remain unchanged.

No dependencies, migrations, database writes, environment changes, purchase changes or Production changes. No artwork was added to the homepage hero or standard functional controls.

## Verification

- Ten extracted PNGs verified pixel-for-pixel against the embedded PDF image.
- Lint, types and Next.js webpack build passed.
- Read-only Chrome placement checks cover About, Organizations, Resources and the actual Payload-backed featured course in EN/FR/AR at 1440, 390 and 320 px (36 combinations).
- Checks cover image loading/proportions, unchanged bytes over HTTP, no horizontal overflow, decorative accessibility and keyboard accordion toggling.
- Desktop/mobile screenshots include collapsed and expanded curriculum states. Hosted evidence is recorded separately after deployment.
- Existing commerce, authentication, progress and media behavior are outside the changed files; no full backend audit or purchase was repeated for this presentation-only task.
