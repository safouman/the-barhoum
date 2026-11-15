// Pin the same Latin subset preloads used by the accepted website.
export function LatinFontPreloads() {
  return <>
    <link rel="preload" href="/fonts/brand-latin/inter-5400fa9987a75418.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="preload" href="/fonts/brand-latin/playfair-14f17d6e37ba9d18.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="preload" href="/fonts/brand-latin/playfair-0906aa3e711ad6cd.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
  </>;
}
