import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function loadTypeScript(file, imports = {}) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const result = {};
  new Function("exports", "require", compiled)(result, (name) => {
    if (name in imports) return imports[name];
    throw new Error("Unexpected test import " + name);
  });
  return result;
}

test("all three supported languages are enabled with Arabic as the default", () => {
  const keys = ["NEXT_PUBLIC_LOCALIZATION_AVAILABLE_LOCALES", "NEXT_PUBLIC_LOCALIZATION_DEFAULT_LOCALE", "NEXT_PUBLIC_LOCALIZATION_ENABLED_LOCALES"];
  const previous = keys.map(key => process.env[key]);
  keys.forEach(key => delete process.env[key]);
  try {
    const { localizationConfig } = loadTypeScript("../../config/localization.ts");
    assert.deepEqual(localizationConfig.enabledLocales, ["ar", "en", "fr"]);
    assert.equal(localizationConfig.defaultLocale, "ar");
  } finally {
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});

test("request handoff removes an untrusted header and accepts only configured query languages", () => {
  const { proxy } = loadTypeScript("../../proxy.ts", {
    "next/server": { NextResponse: { next: value => value } },
    "@/lib/i18n": { isLocale: value => ["ar", "en", "fr"].includes(value) },
  });
  for (const [query, expected] of [["en", "en"], ["fr", "fr"], ["ar", "ar"], ["bad", null], [null, null]]) {
    const headers = new Headers({ "x-barhoum-locale": "fr", "x-unrelated": "retain" });
    const response = proxy({ headers, nextUrl: { searchParams: new URLSearchParams(query ? { lang: query } : {}) } });
    assert.equal(response.request.headers.get("x-barhoum-locale"), expected);
    assert.equal(response.request.headers.get("x-unrelated"), "retain");
  }
});

test("server locale prioritizes URL then proxy then cookie then browser preference", async () => {
  let header = null;
  const { resolveLocale } = loadTypeScript("../../lib/i18n.server.ts", {
    "server-only": {},
    "next/headers": {
      cookies: async () => ({ get: () => ({ value: "ar" }) }),
      headers: async () => ({ get: name => name === "x-barhoum-locale" ? header : "fr-FR,en;q=0.8" }),
    },
    "./i18n": { DEFAULT_LOCALE: "ar", isLocale: value => ["ar", "en", "fr"].includes(value) },
  });
  assert.equal(await resolveLocale(new URLSearchParams("lang=en&returnTo=%2Faccount&token=fixture")), "en");
  header = "fr";
  assert.equal(await resolveLocale(), "fr");
  header = null;
  assert.equal(await resolveLocale(), "ar");
});

test("hero translations retain the approved English copy and use Latin digits", () => {
  const { brandCopy } = loadTypeScript("../../lib/brand-copy.ts");
  assert.equal(brandCopy.en.hero.title, "Human Intelligence");
  assert.equal(brandCopy.en.hero.emphasis, "Professional Evolution.");
  assert.equal(brandCopy.en.hero.action, "Explore the Program");
  for (const language of ["ar", "en", "fr"]) {
    assert.ok(brandCopy[language].nav.entry);
    assert.doesNotMatch(JSON.stringify(brandCopy[language]), /[٠-٩۰-۹]/);
  }
});


test("only the checkout return route receives the fixed-English rendering marker", () => {
  const { proxy } = loadTypeScript("../../proxy.ts", {
    "next/server": { NextResponse: { next: value => value } },
    "@/lib/i18n": { isLocale: value => ["ar", "en", "fr"].includes(value) },
  });
  for (const pathname of ["/checkout/return", "/login", "/account"]) {
    const result = proxy({
      headers: new Headers({ "x-barhoum-checkout": "1" }),
      nextUrl: { pathname, searchParams: new URLSearchParams("lang=fr") },
    });
    assert.equal(result.request.headers.get("x-barhoum-checkout"), pathname === "/checkout/return" ? "1" : null);
  }
});
