import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VERSION,ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS} from '../public/game/units.js';
import {createMatch} from '../public/game/engine.js';
import {PHYSICS_VERSION,deploymentPreviewPoint} from '../public/game/physics.js';

function battle(){const g=createMatch({seed:412});g.phase='battle';g.countdown=0;return g;}

test('v41.2.0 changes summon preview only and keeps combat sync version',()=>{
  assert.equal(VERSION,'41.2.0');
  assert.equal(PHYSICS_VERSION,76);
  assert.equal(DECK.length,77);assert.equal(UNIT_IDS.length,66);assert.equal(SPELL_IDS.length,11);
});

test('normal unit preview exists only inside legal deployment geometry',()=>{
  const g=battle(),d=UNITS.knight,x=ARENA.width/2;
  const legal=deploymentPreviewPoint(g,0,d,x,ARENA.deployBottom+80);
  assert.ok(legal);assert.ok(legal.y>=ARENA.deployBottom);
  const enemySide=deploymentPreviewPoint(g,0,d,x,ARENA.riverTop-80);
  assert.equal(enemySide,null);
});

test('open-river drag projects the unit back to the legal own bank',()=>{
  const g=battle(),d=UNITS.knight,x=ARENA.midX;
  // midX is open water rather than one of the bridges.
  const p=deploymentPreviewPoint(g,0,d,x,ARENA.riverBottom-10);
  assert.ok(p);assert.ok(p.y>ARENA.riverBottom,'body must remain fully clear of open water');
});

test('building preview requires the full 3x3 footprint to fit in the deployment zone',()=>{
  const g=battle(),d=UNITS.cannon,x=ARENA.midX;
  assert.equal(deploymentPreviewPoint(g,0,d,x,ARENA.deployBottom+20),null);
  const p=deploymentPreviewPoint(g,0,d,x,ARENA.deployBottom+100);
  assert.ok(p);assert.equal((p.x/ARENA.cellSize)%1,.5);assert.equal((p.y/ARENA.cellSize)%1,.5);
});

test('spells do not use the unit summon projection helper and retain their own targeting rules',()=>{
  const g=battle();
  assert.equal(deploymentPreviewPoint(g,0,UNITS.fireball,ARENA.midX,ARENA.riverTop-100),null);
  assert.equal(deploymentPreviewPoint(g,0,UNITS.rollingwood,ARENA.midX,ARENA.deployBottom+80),null);
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(app,/if\(!d\.spell&&!d\.tunnelAnywhere\)\{\s*const projected=deploymentPreviewPoint/);
  assert.match(app,/if\(!projected\)\{[\s\S]{0,420}hover\?\.card===selected&&hover\?\.summonPreview/);
  assert.match(app,/return \{\.\.\.hover,placementLocked:true\}/);
});
