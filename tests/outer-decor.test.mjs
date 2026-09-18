import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');

test('v37.3 arena uses a dedicated non-interactive outer decoration canvas',()=>{
  assert.match(index,/id="arenaDecorCanvas" class="arena-decor"/);
  assert.match(css,/--arena-decor-x:30px/);
  assert.match(css,/background:transparent/);
  assert.match(css,/\.arena-wrap \.arena-decor\{[^}]*pointer-events:none/);
  assert.match(art,/function drawArenaOuterDecor\(mainCanvas,theme\)/);
  assert.match(art,/drawArenaOuterDecor\(canvas,theme\)/);
});

test('v37.3 removes the legacy in-arena edge frame and perimeter grid outline',()=>{
  assert.doesNotMatch(art,/mapEdgeDecor\(q,theme,p,cell\)/);
  assert.match(art,/for\(let col=1;col<ARENA\.cols;col\+\+\)/);
  assert.match(art,/for\(let row=1;row<ARENA\.rows;row\+\+\)/);
});

test('v37.4.2 restores the visual lane paving while leaving it non-colliding',()=>{
  assert.match(art,/Lane paving is visual only/);
  assert.match(art,/roadW=cell\*1\.55/);
  assert.match(art,/q\.globalAlpha=\.18;q\.fillStyle=p\.road/);
});

test('v37.4.2 restores the original home demo frame after the white-line diagnosis',()=>{
  assert.doesNotMatch(index,/id="demoDecorCanvas"/);
  assert.match(index,/<div class="demo-frame"><canvas id="demoCanvas" width="720" height="1280"><\/canvas><\/div>/);
  assert.match(css,/\.demo-frame\{padding:10px;background:#213a44;border:1px solid #142f35;border-radius:27px;box-shadow:0 20px 44px #142f3520,0 2px 3px #fff inset;transform:rotate\(-2deg\)\}/);
});

test('v37.4.2 removes only the legacy 676x1008 foreground rim that ended near grid Y7',()=>{
  assert.doesNotMatch(art,/roundRect\(22,14,676,1008,30\)/);
  assert.doesNotMatch(art,/#d6d6ad55/);
  assert.match(art,/legacy 676x1008 foreground rim removed/);
});
