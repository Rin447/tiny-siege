import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('v37.6.0 building ghost exposes a grid-snapped 3x3 placement reservation preview',async()=>{
  const art=await readFile(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(art,/show the grid-snapped 3x3 placement reservation/);
  assert.match(art,/設置スペース \$\{cols\}×\$\{rows\}/);
  assert.match(art,/c\.fillRect\(l,t,w,h\)/);
});

test('v37.6.0 building deployment snaps to grid centres while towers block by hitbox only',async()=>{
  const physics=await readFile(new URL('../public/game/physics.js',import.meta.url),'utf8');
  assert.match(physics,/if\(u\?\.building\)\{/);
  assert.match(physics,/ARENA\.cellSize\)\+\.5\)\*ARENA\.cellSize/);
  assert.match(physics,/const sr=s\.kind\?hitboxRect\(s\):footprintRect\(s\)/);
});
