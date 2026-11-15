import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const origin = process.env.ICON_ORIGIN ?? 'http://localhost:4147';
assert.match(origin, /^(http:\/\/localhost:4147|https:\/\/dev\.ibrahimbenabdallah\.com)$/);
const output = process.env.ICON_OUTPUT;
assert.ok(output); await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(new URL('../../public/images/brand-icons/source.json', import.meta.url)));
const routes = [
  ['/about',2], ['/organizations',1], ['/resources',1],
  ['/courses/human-intelligence-for-your-professional-evolution',6],
];
const browser = await chromium.launch({channel:'chrome'});
const results = [];
try {
  for (const lang of ['en','fr','ar']) for (const width of [1440,390,320]) {
    const context = await browser.newContext({viewport:{width,height:width===1440?1000:844}});
    await context.addCookies([{name:'barhoum_consent',value:'rejected',url:origin}]);
    const page = await context.newPage();
    for (const [route,count] of routes) {
      const response = await page.goto(origin+route+'?lang='+lang,{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200);
      await page.evaluate(()=>document.fonts.ready);
      const icons = page.locator('main img[src^="/images/brand-icons/"]');
      assert.equal(await icons.count(),count,route);
      for(const icon of await icons.all()) {
        await icon.scrollIntoViewIfNeeded();
        await icon.evaluate(image=>image.decode());
        const state = await icon.evaluate(image=>({src:image.getAttribute('src'),alt:image.alt,hidden:image.getAttribute('aria-hidden'),fit:getComputedStyle(image).objectFit,filter:getComputedStyle(image).filter,transform:getComputedStyle(image).transform,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight}));
        const asset = manifest.icons.find(asset=>asset.src===state.src);
        assert.ok(asset);assert.equal(state.alt,'');assert.equal(state.hidden,'true');assert.equal(state.fit,'contain');assert.equal(state.filter,'none');assert.equal(state.transform,'none');assert.equal(state.naturalWidth,asset.width);assert.equal(state.naturalHeight,asset.height);
      }
      assert.equal(await page.locator('html').getAttribute('lang'),lang);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+lang+width+' overflow');
      const stem = route.split('/').at(-1)+'-'+lang+'-'+width;
      if (route.startsWith('/courses/')) {
        const summaries=page.locator('[data-featured-module] > summary');
        assert.equal(await summaries.count(),6);
        const first=summaries.first();await first.focus();await page.keyboard.press('Enter');
        assert.equal(await first.evaluate(el=>el.parentElement.open),true);
        assert.ok(await page.locator('[data-featured-module]').first().locator('a[href*="/lessons/"]').count());
        if(lang==='en'||lang==='ar') await page.screenshot({path:output+'/'+stem+'-expanded.png',fullPage:true,animations:'disabled'});
        await first.focus();await page.keyboard.press('Enter');
        assert.equal(await first.evaluate(el=>el.parentElement.open),false);
      }
      if (lang==='en'||lang==='ar') await page.screenshot({path:output+'/'+stem+'.png',fullPage:true,animations:'disabled'});
      results.push({route,lang,width,icons:count,reflow:'passed'});
    }
    await context.close();
  }
  for(const asset of manifest.icons) {
    const response=await browser.newContext().then(async context=>{const r=await context.request.get(origin+asset.src);const data=await r.body();await context.close();return {status:r.status(),hash:createHash('sha256').update(data).digest('hex')};});
    assert.equal(response.status,200);assert.equal(response.hash,asset.sha256);
  }
} finally { await browser.close();await writeFile(output+'/results.json',JSON.stringify(results,null,2)); }
console.log(JSON.stringify({passed:results.length,assetHashes:10,origin}));
