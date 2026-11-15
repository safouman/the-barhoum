// Preserve approved raster geometry and color reconstruction on white. The
// border-connected neutral matte is cleared. White-matte unmixing keeps
// pale gradient transitions smooth instead of hard-cutting their edges.
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const names=['emotional-intelligence','organizational-dynamics','communication-influence','performance-focus','wellbeing-self-regulation','professional-growth'];
const manifest=[];
for(const name of names){
 const source=new URL(`../public/images/brand-icons/${name}.png`,import.meta.url);
 const {data,info}=await sharp(await readFile(source)).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info;const total=width*height;const matte=new Uint8Array(total);const queue=[];
 const neutral=i=>{const p=i*3,r=data[p],g=data[p+1],b=data[p+2];return r>=230&&g>=230&&b>=225&&g-r<14&&b-r<14&&Math.max(r,g,b)-Math.min(r,g,b)<=28;};
 const add=i=>{if(!matte[i]&&neutral(i)){matte[i]=1;queue.push(i);}};
 for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
 for(let q=0;q<queue.length;q++){const i=queue[q],x=i%width,y=Math.floor(i/width);if(x)add(i-1);if(x<width-1)add(i+1);if(y)add(i-width);if(y<height-1)add(i+width);}
 const rgba=Buffer.alloc(total*4);let fringe=0,unchanged=0;
 for(let i=0;i<total;i++){
  const p=i*3,o=i*4;
  const alpha=matte[i]?0:1-Math.min(data[p],data[p+1],data[p+2])/255;
  if(alpha>0&&alpha<1)fringe++;
  for(let c=0;c<3;c++)rgba[o+c]=alpha>0?Math.round(Math.max(0,Math.min(255,(data[p+c]-255*(1-alpha))/alpha))):0;
  rgba[o+3]=Math.round(alpha*255);if(alpha===1)unchanged++;
 }
 const output=await sharp(rgba,{raw:{width,height,channels:4}}).png({compressionLevel:9}).toBuffer();
 const src=`/images/brand-icons/transparent/${name}.png`;
 await writeFile(new URL('../public'+src,import.meta.url),output);
 manifest.push({name,src,width,height,sha256:createHash('sha256').update(output).digest('hex'),transparentPixels:queue.length,alphaAdjustedPixels:fringe,unchangedOpaquePixels:unchanged});
}
await writeFile(new URL('../public/images/brand-icons/transparent/source.json',import.meta.url),JSON.stringify({method:'Border-connected neutral background removal and white-matte color-to-alpha unmixing. Native dimensions and geometry retained without resampling. Pale highlights blend with the page; original source PNGs retained. Compositing onto white reconstructs retained source colors within rounding.',icons:manifest},null,2)+'\n');
console.log(JSON.stringify(manifest));
