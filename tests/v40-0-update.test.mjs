import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VERSION,ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,MAX_DECK,cellsToWorld} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';
import {createMatch,deploy,tick,inRiver} from '../public/game/engine.js';

function battle(seed=4000){const g=createMatch({seed});g.phase='battle';g.countdown=0;g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}
function deckWith(id){return [id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);}
function ready(g,owner,id){const d=deckWith(id),p=g.players[owner];p.energy=10;p.deck=[...d];p.hand=d.slice(0,4);p.queue=d.slice(4);}
function advance(g,s,step=.01){let left=s;while(left>1e-9){const dt=Math.min(step,left);tick(g,dt);left-=dt;}}
function castAndLand(g,owner,x,y){ready(g,owner,'goblinbarrel');const r=deploy(g,owner,'goblinbarrel',x,y);assert.ok(r.ok,r.error);const p=g.projectiles.find(q=>q.spell==='goblinbarrel');assert.ok(p);advance(g,r.travelTime+.015);const spawned=g.units.filter(u=>u.summonedBy===p.id&&u.type==='goblin_melee');return {r,p,spawned};}

test('v40.0 roster, Goblin Barrel and physics values are exact',()=>{
  assert.equal(VERSION,'41.2.0');assert.equal(PHYSICS_VERSION,76);
  assert.equal(DECK.length,77);assert.equal(new Set(DECK).size,77);assert.equal(UNIT_IDS.length,66);assert.equal(SPELL_IDS.length,11);assert.ok(SPELL_IDS.includes('goblinbarrel'));
  const d=UNITS.goblinbarrel;
  assert.equal(d.cardType,'spell');assert.equal(d.spell,'goblinbarrel');assert.equal(d.cost,3);
  assert.equal(d.radiusCells,2.2);assert.equal(d.radius,cellsToWorld(2.2));assert.equal(d.launchDelay,UNITS.fireball.launchDelay);assert.equal(d.launchDelay,1.1);
  assert.equal(d.spawnType,'goblin_melee');assert.equal(d.spawnCount,3);assert.equal(d.damage,0);assert.equal(d.buildingDamage,0);
});

test('Goblin Barrel launches from own core with exactly the same delay and flight speed as Fireball',()=>{
  const target={x:ARENA.lanes[1],y:340};
  const gb=battle(4001);ready(gb,0,'goblinbarrel');const gr=deploy(gb,0,'goblinbarrel',target.x,target.y);assert.ok(gr.ok);
  const gp=gb.projectiles.find(p=>p.spell==='goblinbarrel'),core=gb.towers.find(t=>t.owner===0&&t.kind==='core');assert.ok(gp&&core);
  assert.equal(gp.sx,core.x);assert.equal(gp.sy,core.y);assert.equal(gp.x,core.x);assert.equal(gp.y,core.y);
  const fb=battle(4002);ready(fb,0,'fireball');const fr=deploy(fb,0,'fireball',target.x,target.y);assert.ok(fr.ok);
  assert.equal(gr.launchDelay,fr.launchDelay);assert.equal(gr.flightTime,fr.flightTime);assert.equal(gr.travelTime,fr.travelTime);
  advance(gb,1.05);assert.equal(gp.launched,false);advance(gb,.06);assert.equal(gp.launched,true);
});

test('Goblin Barrel creates three normal goblins in a triangle on an ordinary target point',()=>{
  const g=battle(4003),x=ARENA.midX,y=430;const {spawned}=castAndLand(g,0,x,y);
  assert.equal(spawned.length,3);assert.ok(spawned.every(u=>u.owner===0&&u.type==='goblin_melee'));
  const xs=spawned.map(u=>u.x),ys=spawned.map(u=>u.y);
  assert.ok(Math.max(...xs)-Math.min(...xs)>30,'triangle should have meaningful horizontal spread');
  assert.ok(Math.max(...ys)-Math.min(...ys)>20,'triangle should have front/back spread');
  assert.ok(spawned.every(u=>Math.hypot(u.x-x,u.y-y)<=UNITS.goblinbarrel.radius+10));
});

test('A centre tower cast surrounds the tower with one goblin on each side and one toward the attacker',()=>{
  const g=battle(4004),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===ARENA.lanes[1]);assert.ok(tower);
  const {spawned}=castAndLand(g,0,tower.x,tower.y);assert.equal(spawned.length,3);
  assert.ok(spawned.some(u=>u.x<tower.x-20),'one goblin should spawn on the left');
  assert.ok(spawned.some(u=>u.x>tower.x+20),'one goblin should spawn on the right');
  assert.ok(spawned.some(u=>u.y<tower.y-20),'one goblin should spawn on the attacker-facing side');
  const ev=g.events.find(e=>e.type==='goblinbarrel-impact');assert.equal(ev?.mode,'surround');
});

test('Offset tower casts cluster all three goblins on the selected left or right side',()=>{
  for(const [side,seed,mode] of [[1,4005,'right-cluster'],[-1,4006,'left-cluster']]){
    const g=battle(seed),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===ARENA.lanes[1]);assert.ok(tower);
    const {spawned}=castAndLand(g,0,tower.x+side*50,tower.y);assert.equal(spawned.length,3);
    assert.ok(spawned.every(u=>side>0?u.x>tower.x:u.x<tower.x),`${mode} should stay on selected side`);
    const ev=g.events.find(e=>e.type==='goblinbarrel-impact');assert.equal(ev?.mode,mode);
  }
});

test('Goblin Barrel may target water and still resolves its goblins onto valid ground',()=>{
  const g=battle(4007),x=ARENA.midX,y=(ARENA.riverTop+ARENA.riverBottom)/2;assert.equal(inRiver(x,y),true);
  const {spawned}=castAndLand(g,0,x,y);assert.equal(spawned.length,3);assert.ok(spawned.every(u=>!inRiver(u.x,u.y)),'spawned goblins must land on ground');
});

test('v40 visuals use a front/back Siege Barbarian pair and a spinning wooden Goblin Barrel',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const siege=art.slice(art.indexOf('function drawSiegeBarbarian'),art.indexOf('function drawOven'));
  assert.match(siege,/carrierRows=\[\{x:2,y:-25/);assert.match(siege,/\{x:-2,y:8/);assert.doesNotMatch(siege,/translate\(side\*12,-17\)/);
  assert.match(art,/function drawGoblinBarrel/);assert.match(art,/progress\*TAU\*3\.6/);assert.match(art,/drawGoblinBarrel\(c,pos\.x,pos\.y-18-arc/);
});
