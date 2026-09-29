import test from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,PHYSICS_VERSION,DECK,UNIT_IDS,SPELL_IDS,UNITS,createMatch} from '../src/game-core.js';
test('v46 package metadata and new cards',()=>{
  assert.equal(VERSION,'46.0.0');
  assert.equal(PHYSICS_VERSION,83);
  assert.equal(DECK.length,83);
  assert.equal(UNIT_IDS.length,71);
  assert.equal(SPELL_IDS.length,12);
  assert.equal(UNITS.hunter.cost,4);
  assert.equal(UNITS.hunter.hp,884);
  assert.equal(UNITS.rocket.cost,6);
  assert.equal(UNITS.rocket.damage,1484);
  assert.equal(UNITS.rocket.towerDamage,343);
});
test('match can be created from the current core',()=>{
  const g=createMatch({seed:4600});
  assert.equal(g.physicsVersion,83);
  assert.equal(g.players.length,2);
  assert.equal(g.towers.length,6);
});
