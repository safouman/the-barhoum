import localFont from "next/font/local";

// Arabic-only ranges are deliberate: ASCII digits, Latin letters and punctuation
// must fall through to the role's existing Inter / Playfair face. No broad
// metric fallback is generated, because that fallback could capture Latin glyphs.
export const tajawal = localFont({
  src: [
    { path: "./fonts/Tajawal-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Tajawal-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Tajawal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tajawal",
  display: "swap", adjustFontFallback: false, fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF,U+0750-077F,U+0870-089F,U+08A0-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFF" }],
});

// A dedicated single-weight Arabic face keeps headings bold without changing
// the Latin weight declarations used by the existing editorial design.
export const tajawalHeading = localFont({
  src: "./fonts/Tajawal-700.woff2", weight: "700", style: "normal",
  variable: "--font-tajawal-heading",
  display: "swap", adjustFontFallback: false, fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF,U+0750-077F,U+0870-089F,U+08A0-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFF" }],
});
export const tajawalHero = localFont({
  src: "./fonts/Tajawal-800.woff2", weight: "800", style: "normal",
  variable: "--font-tajawal-hero",
  display: "swap", adjustFontFallback: false, fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF,U+0750-077F,U+0870-089F,U+08A0-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFF" }],
});
export const tajawalUI = localFont({
  src: [
    { path: "./fonts/Tajawal-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Tajawal-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-tajawal-ui",
  display: "swap", adjustFontFallback: false, fallback: [],
  declarations: [{ prop: "unicode-range", value: "U+0600-06FF,U+0750-077F,U+0870-089F,U+08A0-08FF,U+200C-200F,U+FB50-FDFF,U+FE70-FEFF" }],
});
// Latin faces are pinned in styles/brand/latin-fonts.css from baseline 9b781d5.
export const siteFontClassName = [tajawal.variable, tajawalHeading.variable, tajawalHero.variable, tajawalUI.variable].join(" ");
