import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VERSION,DECK,UNIT_IDS,SPELL_IDS} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';

test('v39.1.0 is a visual-only team visibility update',()=>{
  assert.equal(VERSION,'41.2.0');
  assert.equal(PHYSICS_VERSION,76);
  assert.equal(DECK.length,77);assert.equal(UNIT_IDS.length,66);assert.equal(SPELL_IDS.length,11);
});

test('battle units hide generic team bands and identify sides with persistent HP bars',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.ok((art.match(/previousHideTeamBands=c\.__hideTeamBands;c\.__hideTeamBands=true;drawUnit/g)||[]).length>=2);
  assert.doesNotMatch(art,/TEAM_COLORS\[owner\]\+'b0'[\s\S]{0,140}ellipse\(p\.x,p\.y\+4,u\.radius\+4/);
  assert.match(art,/if\(!u\.building\|\|hp<\.999\)\{const hpY=/);
});

test('Air Balloon keeps its inherent blue/red balloon appearance',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const block=art.slice(art.indexOf('function drawAirBalloon'),art.indexOf('function drawLumberjack'));
  assert.match(block,/owner===0\?\{base:'#4f9dff'/);
  assert.match(block,/base:'#ff5f68'/);
});
