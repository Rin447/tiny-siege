import fs from 'node:fs/promises';
const base=new URL('../',import.meta.url);
let html=await fs.readFile(new URL('public/index.html',base),'utf8');
const marker='<script type="module">';
if(!html.includes(marker))throw new Error('Module script marker was not found.');
html=html.replace(marker,marker+'window.TINY_OFFLINE=true;\n');
await fs.writeFile(new URL('PLAY-OFFLINE.html',base),html);
console.log('Built PLAY-OFFLINE.html from public/index.html');
