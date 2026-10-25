// Builds the offline app bundle from game/gnomes-of-hollowmere.html:
//  - three.js and OrbitControls are inlined, so nothing is fetched from a CDN
//  - the two typefaces are embedded, so the game looks right with no internet
//  - www/ gets the installable web app files (manifest, service worker, icons)
//  - dist/gnomes-of-hollowmere-standalone.html is a single file that runs from any folder
// Usage: node tools/build-www.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rd = p => readFileSync(join(root, p), 'utf8');
const b64 = p => readFileSync(join(root, p)).toString('base64');

let src = rd('game/gnomes-of-hollowmere.html');
const version = (src.match(/<meta name="game-version" content="(\d+)/) || [, 'dev'])[1];

const swap = (from, to) => {
  if (!src.includes(from)) throw new Error('Build anchor not found: ' + from.slice(0, 80));
  src = src.replace(from, () => to);
};

// 1. Libraries inline
const three = rd('tools/vendor/three.min.js'), orbit = rd('tools/vendor/OrbitControls.js');
for (const t of [three, orbit]) if (/<\/script/i.test(t)) throw new Error('library contains a closing script tag');
swap('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
  '<script>/* three.js r128, MIT licence (see tools/vendor/THREE-LICENSE) */\n' + three + '\n</script>');
swap('<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>',
  '<script>\n' + orbit + '\n</script>');

// 2. Fonts embedded (SIL Open Font Licence, see tools/fonts)
src = src.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\s*/, '')
         .replace(/<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>\s*/, '');
const face = (family, weight, file) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${b64('tools/fonts/' + file)}) format("woff2")}`;
const fonts = '<style>' + [
  face('IM Fell English SC', 400, 'im-fell-english-sc-latin-400-normal.woff2'),
  face('Alegreya Sans', 400, 'alegreya-sans-latin-400-normal.woff2'),
  face('Alegreya Sans', 500, 'alegreya-sans-latin-500-normal.woff2'),
  face('Alegreya Sans', 700, 'alegreya-sans-latin-700-normal.woff2'),
].join('\n') + '</style>\n';

const headCommon = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#120c1c">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Hollowmere">
<meta name="description" content="A 3D fantasy board game: race your gnome past monsters to the Summit Hearth.">`;

// Installable web app: register the service worker only on a real https site (not inside the Android or Windows app shells)
const pwaScript = `<script>
(function(){
  var h=location.hostname;
  if('serviceWorker' in navigator && location.protocol==='https:' && h!=='localhost' && !/tauri/.test(h))
    addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
  // "Install app" button appears when the browser offers installation
  var deferred=null;
  addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;var t=document.querySelector('.tools');if(!t||document.getElementById('bInstall'))return;
    var b=document.createElement('button');b.className='btn';b.id='bInstall';b.textContent='⬇ Install app';b.title='Install Gnomes of Hollowmere as an app';
    b.onclick=function(){if(!deferred)return;deferred.prompt();deferred.userChoice.finally(function(){deferred=null;b.remove();});};t.prepend(b);});
  addEventListener('appinstalled',function(){var b=document.getElementById('bInstall');if(b)b.remove();});
})();
</script>`;

const wrap = (head, body) => `<!doctype html>\n<html lang="en">\n<head>\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

mkdirSync(join(root, 'www'), { recursive: true });
mkdirSync(join(root, 'dist'), { recursive: true });

const appHead = headCommon + `
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">`;
writeFileSync(join(root, 'www/index.html'), wrap(appHead, fonts + src + '\n' + pwaScript));
writeFileSync(join(root, 'dist/gnomes-of-hollowmere-standalone.html'), wrap(headCommon, fonts + src));

writeFileSync(join(root, 'www/manifest.webmanifest'), JSON.stringify({
  name: 'Gnomes of Hollowmere',
  short_name: 'Hollowmere',
  description: 'A 3D fantasy board game: race your gnome past monsters to the Summit Hearth.',
  id: './',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  display_override: ['fullscreen', 'standalone'],
  orientation: 'any',
  background_color: '#0d0915',
  theme_color: '#120c1c',
  categories: ['games', 'entertainment'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// Service worker: everything the game needs is cached on first visit, so it then runs offline.
// A new game version gets a new cache name, so players receive updates automatically.
writeFileSync(join(root, 'www/sw.js'), `const CACHE='hollowmere-v${version}';
const FILES=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);if(url.origin!==location.origin)return;
  // Network first for the page itself (so updates arrive), cache first for everything else
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put('index.html',c));return r;}).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
`);

const kb = n => Math.round(n / 1024) + ' KB';
console.log(`Gnomes of Hollowmere v${version}: www/index.html ${kb(readFileSync(join(root, 'www/index.html')).length)}, standalone ${kb(readFileSync(join(root, 'dist/gnomes-of-hollowmere-standalone.html')).length)}`);
