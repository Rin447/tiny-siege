import test from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,PHYSICS_VERSION,DECK,UNIT_IDS,SPELL_IDS,UNITS,ARENA,createMatch,validateDeck} from '../src/game-core.js';

test('v46 release metadata is internally consistent',()=>{
  assert.equal(VERSION,'46.0.0');
  assert.equal(PHYSICS_VERSION,83);
  assert.equal(DECK.length,83);
  assert.equal(UNIT_IDS.length,71);
  assert.equal(SPELL_IDS.length,12);
  assert.equal(new Set(DECK).size,DECK.length);
  assert.equal(validateDeck(DECK.slice(0,8)).length,8);
});

test('Hunter matches v46 shotgun specification',()=>{
  const d=UNITS.hunter;
  assert.equal(d.cost,4);
  assert.equal(d.hp,884);
  assert.equal(d.damage,84);
  assert.equal(d.pelletCount,10);
  assert.equal(d.damage*d.pelletCount,840);
  assert.equal(d.cooldown,2.2);
  assert.equal(d.speed,40);
  assert.equal(d.rangeCells,4);
  assert.equal(d.pelletRangeCells,6.5);
  assert.equal(d.targetsAir,true);
  assert.equal(d.air,false);
  assert.equal(d.scatterShot,true);
});

test('Rocket and rolling spell values match v46',()=>{
  const r=UNITS.rocket;
  assert.equal(r.cost,6);
  assert.equal(r.damage,1484);
  assert.equal(r.towerDamage,343);
  assert.equal(r.radiusCells,2);
  assert.equal(r.targetsAir,true);
  assert.equal(UNITS.rollingwood.rollSpeed,165);
  assert.equal(UNITS.rollingbarbarian.rollSpeed,140);
});

test('match boots with current physics and six towers',()=>{
  const g=createMatch({seed:4600,decks:[DECK.slice(0,8),DECK.slice(8,16)]});
  assert.equal(g.physicsVersion,83);
  assert.equal(g.players.length,2);
  assert.equal(g.towers.length,6);
  assert.equal(g.players[0].deck.length,8);
  assert.equal(g.players[1].deck.length,8);
  assert.equal(ARENA.cols,18);
  assert.equal(ARENA.rows,32);
});
