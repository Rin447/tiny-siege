import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,MAX_DECK,cellsToWorld} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';
import {createMatch,deploy,tick} from '../public/game/engine.js';

function battle(){const g=createMatch({seed:379});g.phase='battle';g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}
function deckWith(id){return [id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);}
function ready(g,owner,id){const d=deckWith(id),p=g.players[owner];p.energy=10;p.deck=[...d];p.hand=d.slice(0,4);p.queue=d.slice(4);}
function forceReady(u,g){u.spawn=0;u.deploying=false;u.deployRemaining=0;u.deployTotal=0;u.targetable=true;u.collisionDisabled=false;if(u.summonInterval&&!Number.isFinite(u.summonNextAt))u.summonNextAt=g.time+u.summonInterval;return u;}
function spawn(g,owner,id,x,y){ready(g,owner,id);const n=g.units.length,r=deploy(g,owner,id,owner===0?190:580,owner===0?800:480);assert.ok(r.ok,r.error);const u=g.units.slice(n).find(v=>v.type===id)||g.units.at(-1);forceReady(u,g);u.x=x;u.y=y;u.lane=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];return u;}
function advance(g,s){for(let i=0;i<Math.round(s*10);i++)tick(g,.1);}

test('v37.9 roster and Cyclone/Falche/Rage card values are explicit',()=>{
  assert.equal(VERSION,'38.0.0');assert.equal(PHYSICS_VERSION,72);
  assert.equal(DECK.length,73);assert.equal(UNIT_IDS.length,65);assert.equal(SPELL_IDS.length,8);assert.ok(SPELL_IDS.includes('rage'));
  assert.equal(UNITS.cyclone.radiusCells,5.5);assert.equal(UNITS.cyclone.radius,cellsToWorld(5.5));assert.equal(UNITS.cyclone.zoneDuration,1);assert.equal(UNITS.cyclone.damage,84);assert.equal(UNITS.cyclone.buildingDamage,58);assert.equal(UNITS.cyclone.pullSpeed,210);
  assert.equal(UNITS.falche.cost,5);assert.equal(UNITS.falche.hp,1280);assert.equal(UNITS.falche.damage,179);assert.equal(UNITS.falche.cooldown,2.4);assert.equal(UNITS.falche.rangeCells,4.5);assert.equal(UNITS.falche.axeTravelRangeCells,7);assert.equal(UNITS.falche.axeHitWidthCells,2);
  assert.equal(UNITS.rage.cost,2);assert.equal(UNITS.rage.radiusCells,3);assert.equal(UNITS.rage.damage,179);assert.equal(UNITS.rage.buildingDamage,45);assert.equal(UNITS.rage.placementTime,.5);assert.equal(UNITS.rage.activationDelay,1.5);assert.equal(UNITS.rage.zoneDuration,4.5);assert.equal(UNITS.rage.boostMultiplier,1.3);
});

test('Falche stays planted while the axe pierces on the way out and back',()=>{
  const g=battle();
  const f=spawn(g,0,'falche',360,700),a=spawn(g,1,'knight',360,540),b=spawn(g,1,'blade',360,460);
  Object.assign(f,{speed:0,cd:0,firstStrikeReadyAt:0});for(const u of [a,b])Object.assign(u,{speed:0,damage:0,cd:99,hp:5000,maxHp:5000});
  const fx=f.x,fy=f.y;advance(g,.5);assert.equal(f.axeInFlight,true);assert.equal(f.x,fx);assert.equal(f.y,fy);
  advance(g,2.0);assert.equal(f.axeInFlight,false);assert.equal(a.hp,5000-358);assert.equal(b.hp,5000-358);
});

test('Rage waits 1.5 seconds, then deals impact damage and speeds actions without increasing natural decay',()=>{
  const g=battle();
  const own=spawn(g,0,'cannon',360,800),enemy=spawn(g,1,'knight',390,800);
  Object.assign(own,{hp:1000,maxHp:1000,decayPerSecond:30,damage:0,range:0,cd:2});Object.assign(enemy,{hp:2000,maxHp:2000,speed:0,damage:0,cd:99});
  ready(g,0,'rage');assert.ok(deploy(g,0,'rage',360,800).ok);const eh=enemy.hp;
  advance(g,1.4);assert.equal(enemy.hp,eh);advance(g,.2);assert.equal(enemy.hp,eh-179);
  own.hp=1000;own.cd=2;const t0=g.time;advance(g,1);assert.ok(g.time>=t0+1-.001);assert.ok(Math.abs(own.hp-970)<.01,`hp=${own.hp}`);assert.ok(Math.abs(own.cd-.7)<.03,`cd=${own.cd}`);
});

test('Rage accelerates elixir-pump generation progress but not its HP decay rate',()=>{
  const g=battle(),pump=spawn(g,0,'elixirpump',360,800);Object.assign(pump,{hp:1070,maxHp:1070,decayPerSecond:11.5,energyNextAt:g.time+13});g.players[0].energy=0;
  ready(g,0,'rage');assert.ok(deploy(g,0,'rage',360,800).ok);advance(g,1.6);const hp=pump.hp,start=g.time;pump.energyNextAt=g.time+1.3;g.players[0].energy=0;advance(g,1);
  assert.ok(g.players[0].energy>=1,`energy=${g.players[0].energy}`);assert.ok(Math.abs((hp-pump.hp)-11.5)<.05,`decay=${hp-pump.hp}`);assert.ok(g.time>=start+1-.001);
});
