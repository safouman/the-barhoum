// Fonts are selected by Unicode ranges, not this component. Only Arabic runs in
// tracked display text need a span so Latin tracking cannot break Arabic shaping.
const arabicRuns = /([\p{Script_Extensions=Arabic}\u200C\u200D]+(?:[ \u00A0]+[\p{Script_Extensions=Arabic}\u200C\u200D]+)*)/u;
const containsArabic = /\p{Script_Extensions=Arabic}/u;

export function ArabicText({ text }: { text: string }) {
  if (!containsArabic.test(text)) return text;
  return text.split(arabicRuns).map((run, index) => containsArabic.test(run)
    ? <span className="arabic-script-run" key={index}>{run}</span>
    : run);
}
