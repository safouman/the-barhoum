import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import sharp from 'sharp';
const manifest=JSON.parse(await readFile(new URL('../../public/images/brand-icons/transparent/source.json',import.meta.url)));
test('Six transparent derivatives retain native geometry and reconstruct source colors on white',async()=>{
 assert.equal(manifest.icons.length,6);
 for(const icon of manifest.icons){
  const bytes=await readFile(new URL('../../public'+icon.src,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),icon.sha256);
  const result=await sharp(bytes).raw().toBuffer({resolveWithObject:true});
  assert.equal(result.info.channels,4);assert.equal(result.info.width,icon.width);assert.equal(result.info.height,icon.height);
  const source=await sharp(new URL('../../public/images/brand-icons/'+icon.name+'.png',import.meta.url).pathname).removeAlpha().raw().toBuffer();
  let clear=0;
  for(let i=0;i<icon.width*icon.height;i++){
   const p=i*4,s=i*3,a=result.data[p+3]/255,x=i%icon.width,y=Math.floor(i/icon.width);
   if(x===0||y===0||x===icon.width-1||y===icon.height-1)assert.equal(a,0,icon.name+' border must be clear');
   if(a===0)clear++;
   if(Math.min(...source.subarray(s,s+3))<220)assert.ok(a>0,icon.name+' visible source shape removed');
   if(a>0)for(let c=0;c<3;c++)assert.ok(Math.abs(result.data[p+c]*a+255*(1-a)-source[s+c])<1.6,icon.name+' source gradient changed');
  }
  assert.ok(clear>icon.width*icon.height*.3);
 }
});
