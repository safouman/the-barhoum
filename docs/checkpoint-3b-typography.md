# Checkpoint 3B — Arabic typography candidate

Development only. Visual acceptance remains pending. The owner approved presenting Tajawal samples because the supplied raster Design System PDF contains English UI and Arabic only inside the preserved logo; it does not provide an Arabic heading/body specimen for exact text comparison.

## Font selection

- `lib/fonts.ts` self-hosts Tajawal's official Arabic WOFF2 subsets via Next's local font loader: 400 body, 500/700 UI, 700 headings, 800 homepage hero. The four unique files total about 35.4 KiB.
- Explicit Arabic Unicode ranges include Arabic letters, marks, shaping/presentation characters and joiners, while excluding ASCII digits and Latin letters. Font selection works inside one mixed-script text element on EN/FR/AR pages.
- Inter or Playfair is first in each role's font stack. Broad automatic metric fallback faces are disabled for Tajawal: an Arial-like generated face must not intercept Latin text. The Latin declarations likewise contain only their actual script ranges before the Arabic fallback.
- Arabic heading and hero roles have dedicated single-weight faces, so existing Latin CSS weights remain unchanged while actual Arabic glyphs resolve to Bold 700 or ExtraBold 800. UI face selection is Medium 500 or Bold 700. Body Regular is 400, with existing semantic emphasis preserved.
- `styles/brand/tokens.css` defines shared body/display/hero/UI stacks. Former page-language font-family overrides and scattered Noto stacks were removed. RTL and existing layout rules remain; Arabic mobile hero leading is raised to 1.2 because its ~53.5 px glyph ink exceeded the old 48 px line box. Other line heights and all authored content are unchanged.
- `ArabicText` wraps only Arabic runs inside tracked course display titles to reset letter-spacing. It does not pick fonts, alter text or add bidi direction overrides. Unwrapped mixed text also resolves fonts correctly through Unicode ranges.
- Existing Arabic signature text uses Tajawal; the image logo is unchanged. No icon changes.

## Latin preservation

Fresh Google downloads were not byte-identical to the existing Development font assets. To avoid an unrelated Latin update, Inter and Playfair files were pinned verbatim from accepted commit `9b781d5`, including their existing script ranges, normal/italic faces, weight descriptors and Latin preloads. SHA-256 source records and OFL licenses are included. No new font family or external runtime service was introduced. Additional scripts already covered by those Latin fonts are retained.

## Verification

`tests/typography/rendered-fonts.browser.mjs` reads Chrome CSS.getPlatformFontsForNode results: actual rendered glyph counts, font family and PostScript name. It checks representative real page elements and explicitly labeled transient font specimens, including native input values, unsplit mixed text, Latin digits, currencies, email and URL text. Network requests or computed font-family alone are not acceptance evidence.

The browser script is restricted to localhost and the Development hostname. It only reads hosted content; specimen changes exist in the isolated test tab's DOM, with no application route or server write. Authentication UI regressions use existing mocked localhost endpoints and do not send emails or modify students.

Commands (use the existing Playwright runtime path if not installed in the checkout):

- `npm run check`
- `node --import tsx tests/typography/script-text.test.tsx`
- `node tests/typography/font-assets.test.mjs`
- `TYPOGRAPHY_ORIGIN=http://localhost:4147 TYPOGRAPHY_OUTPUT=/absolute/evidence/path PLAYWRIGHT_MODULE=/absolute/playwright/index.mjs node tests/typography/rendered-fonts.browser.mjs`

No schema, authentication, payment, entitlement, course content, progress or Production changes are included. The previously reported paid Vimeo login blocker is outside this typography change.
