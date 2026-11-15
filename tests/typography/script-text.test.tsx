import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ArabicText } from "../../components/ArabicText";

for (const text of ["Human Intelligence", "Évolution professionnelle 2026", "EUR 19.99 · qa@example.test"]) {
  assert.equal(renderToStaticMarkup(<ArabicText text={text} />), text);
}
for (const text of ["العَرَبِيَّة", "تعلّم مع Ibrahim · progrès 2026", "برنامج مدّته 6 ساعات"]) {
  const html = renderToStaticMarkup(<ArabicText text={text} />);
  assert.equal(html.replace(/<[^>]*>/g, ""), text);
  assert.match(html, /class="arabic-script-run"/);
  assert.doesNotMatch(html, /class="arabic-script-run">[^<]*(?:Ibrahim|progrès|2026|6)/);
  assert.doesNotMatch(html, /dir=/);
}
console.log("PASS Unicode tracking runs: text and shaping marks preserved; Latin text/digits untouched; no bidi direction override.");
