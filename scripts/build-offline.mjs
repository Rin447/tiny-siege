import fs from 'node:fs/promises';
const base=new URL('../',import.meta.url);
let html=await fs.readFile(new URL('public/index.html',base),'utf8');
const css=await fs.readFile(new URL('public/styles.css',base),'utf8');
const paths=['public/game/units.js','public/game/physics.js','public/game/engine.js','public/game/art.js','public/app.js'];
let js='window.TINY_OFFLINE=true;\n';
for(const p of paths){
  let s=await fs.readFile(new URL(p,base),'utf8');
  s=s.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'');
  js+=s+'\n';
}
html=html.replace(/<link rel="icon"[^>]*>/,'').replace('<link rel="stylesheet" href="/styles.css">',`<style>${css}</style>`)
.replace('<script type="module" src="/app.js"></script>',`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`);
await fs.writeFile(new URL('PLAY-OFFLINE.html',base),html);
console.log('Built PLAY-OFFLINE.html (self-contained CPU practice).');
