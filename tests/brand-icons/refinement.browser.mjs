import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const origin=process.env.ICON_ORIGIN??'http://localhost:4147';assert.match(origin,/^(http:\/\/localhost:4147|https:\/\/dev\.ibrahimbenabdallah\.com)$/);
const output=process.env.ICON_OUTPUT;assert.ok(output);await mkdir(output,{recursive:true});
const slug='human-intelligence-for-your-professional-evolution';
const routes=[['/about',0],['/organizations',0],['/resources',0],['/courses/'+slug,6],['/courses/'+slug+'/lessons/21',6],['/courses/'+slug+'/lessons/22',6]];
const manifest=JSON.parse(await readFile(new URL('../../public/images/brand-icons/transparent/source.json',import.meta.url)));
const browser=await chromium.launch({channel:'chrome'});const results=[];
try{for(const lang of ['en','fr','ar'])for(const width of [1440,390,320]){
 const context=await browser.newContext({viewport:{width,height:width===1440?1000:844}});await context.addCookies([{name:'barhoum_consent',value:'rejected',url:origin}]);const page=await context.newPage();
 for(const [route,count]of routes){
  const response=await page.goto(origin+route+'?lang='+lang,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
  if(route.includes('/lessons/')&&width<1024){const outer=page.locator('main details:has(>nav) > summary');await outer.focus();await page.keyboard.press('Enter');assert.equal(await outer.evaluate(el=>el.parentElement.open),true);}
  const icons=page.locator('main [data-module-icon] img:visible');assert.equal(await icons.count(),count,route+lang+width);
  if(count===0)assert.equal(await page.locator('main img[src*="brand-icons"]').count(),0);
  for(const image of await icons.all()){await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());const state=await image.evaluate(el=>({src:el.getAttribute('src'),width:el.getBoundingClientRect().width,fit:getComputedStyle(el).objectFit,transform:getComputedStyle(el).transform,alt:el.alt,hidden:el.getAttribute('aria-hidden')}));assert.ok(state.src.startsWith('/images/brand-icons/transparent/'));assert.ok(state.width>=(route.includes('/lessons/')?44:width<640?48:64)-.1);assert.equal(state.fit,'contain');assert.equal(state.transform,'none');assert.equal(state.alt,'');assert.equal(state.hidden,'true');}
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+lang+width+' overflow');
  if(count){const summary=page.locator('main [data-module-icon] > summary:visible').first();const wasOpen=await summary.evaluate(el=>el.parentElement.open);await summary.focus();await page.keyboard.press('Enter');assert.notEqual(await summary.evaluate(el=>el.parentElement.open),wasOpen);await page.keyboard.press('Enter');assert.equal(await summary.evaluate(el=>el.parentElement.open),wasOpen);await summary.evaluate(el=>el.blur());}
  if(route.endsWith('/lessons/22'))assert.equal(await page.locator('main iframe[src*="player.vimeo.com"]').count(),0,'anonymous paid video leaked');
  {
   const stem=route.includes('/lessons/')?'lesson-'+route.split('/').at(-1):route.split('/').at(-1);
   if(count){await page.screenshot({path:output+'/'+stem+'-'+lang+'-'+width+'.png',fullPage:true,animations:'disabled'});if(!route.includes('/lessons/')){const summary=page.locator('[data-module-icon] > summary').first();await summary.click();await summary.evaluate(el=>el.blur());await page.mouse.move(0,0);await page.screenshot({path:output+'/'+stem+'-'+lang+'-'+width+'-expanded.png',fullPage:true,animations:'disabled'});}}
  }
  results.push({route,lang,width,visibleIcons:count,status:'passed'});
 }
 await context.close();
}
for(const icon of manifest.icons){const context=await browser.newContext();const response=await context.request.get(origin+icon.src);assert.equal(response.status(),200);assert.equal(createHash('sha256').update(await response.body()).digest('hex'),icon.sha256);await context.close();}
}finally{await browser.close();await writeFile(output+'/results.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify({passed:results.length,origin,assetHashes:6}));
