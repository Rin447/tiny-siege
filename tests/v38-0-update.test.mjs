import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,MAX_DECK,cellsToWorld} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';
import {createMatch,deploy,tick,viewMatch} from '../public/game/engine.js';

function battle(seed=3800){const g=createMatch({seed});g.phase='battle';g.countdown=0;g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}
function deckWith(id){return [id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);}
function ready(g,owner,id){const d=deckWith(id),p=g.players[owner];p.energy=10;p.deck=[...d];p.hand=d.slice(0,4);p.queue=d.slice(4);}
function forceReady(u,g){u.spawn=0;u.deploying=false;u.deployRemaining=0;u.deployTotal=0;u.targetable=true;u.collisionDisabled=false;u.firstStrikeReadyAt=0;if(u.summonInterval&&!Number.isFinite(u.summonNextAt))u.summonNextAt=g.time+u.summonInterval;return u;}
function spawn(g,owner,id,x,y){ready(g,owner,id);const n=g.units.length,r=deploy(g,owner,id,owner===0?190:580,owner===0?800:480);assert.ok(r.ok,r.error);const u=g.units.slice(n).find(v=>v.type===id)||g.units.at(-1);forceReady(u,g);u.x=x;u.y=y;u.lane=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];return u;}
function advance(g,s){let left=s;while(left>1e-9){const dt=Math.min(.05,left);tick(g,dt);left-=dt;}}
function inert(u,hp=5000){Object.assign(u,{hp,maxHp:hp,speed:0,damage:0,range:0,cd:99,collisionDisabled:true});return u;}

 test('v38.0 roster and Air Balloon/Lumberjack values are exact',()=>{
  assert.equal(VERSION,'38.0.0');assert.equal(PHYSICS_VERSION,72);
  assert.equal(DECK.length,73);assert.equal(UNIT_IDS.length,65);assert.equal(SPELL_IDS.length,8);
  const b=UNITS.airballoon;assert.equal(b.cost,5);assert.equal(b.hp,1676);assert.equal(b.damage,640);assert.equal(b.cooldown,2);assert.equal(b.speed,40);assert.equal(b.rangeCells,1);assert.equal(b.range,cellsToWorld(1));assert.equal(b.air,true);assert.equal(b.buildingOnly,true);assert.equal(b.targetsAir,false);assert.equal(b.deathBombDamage,240);assert.equal(b.deathBombRadiusCells,1);assert.equal(b.deathBombDelay,2);assert.equal(b.deathBombKind,'airballoonbomb');
  const l=UNITS.lumberjack;assert.equal(l.cost,4);assert.equal(l.hp,1282);assert.equal(l.damage,255);assert.equal(l.cooldown,.8);assert.equal(l.speed,79);assert.equal(l.rangeCells,1);assert.equal(l.air,false);assert.equal(l.targetsAir,false);assert.equal(l.deathRage,true);
});

test('Air Balloon death bomb waits 2 seconds, damages ground and structures for 240, and ignores air',()=>{
  const g=battle(3801),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower');
  const balloon=spawn(g,0,'airballoon',tower.x,tower.y);balloon.hp=1;
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',balloon.x,balloon.y).ok);assert.equal(balloon.hp,0);
  const bomb=g.zones.find(z=>z.kind==='airballoonbomb');assert.ok(bomb);assert.equal(bomb.damage,240);assert.equal(bomb.radius,cellsToWorld(1));assert.ok(Math.abs(bomb.detonateAt-g.time-2)<1e-8);
  const ground=inert(spawn(g,1,'knight',tower.x+10,tower.y));
  const air=inert(spawn(g,1,'harpy',tower.x-10,tower.y));
  tower.hp=5000;tower.maxHp=5000;const gh=ground.hp,ah=air.hp,th=tower.hp;
  advance(g,1.95);assert.equal(ground.hp,gh);assert.equal(air.hp,ah);assert.equal(tower.hp,th);
  advance(g,.10);assert.equal(ground.hp,gh-240);assert.equal(air.hp,ah);assert.equal(tower.hp,th-240);
});

test('Lumberjack death drops the existing Rage with a 1.5 second delay and normal Rage values',()=>{
  const g=battle(3802),jack=spawn(g,0,'lumberjack',360,800);jack.hp=1;
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',jack.x,jack.y).ok);assert.equal(jack.hp,0);
  const zone=g.zones.find(z=>z.kind==='rage'&&z.source==='lumberjack');assert.ok(zone);assert.equal(zone.radius,UNITS.rage.radius);assert.equal(zone.damage,UNITS.rage.damage);assert.equal(zone.buildingDamage,UNITS.rage.buildingDamage);assert.equal(zone.total,UNITS.rage.zoneDuration);assert.equal(zone.boostMultiplier,UNITS.rage.boostMultiplier);assert.ok(Math.abs(zone.activateAt-g.time-1.5)<1e-8);
  const enemy=inert(spawn(g,1,'knight',360,800));
  const ally=inert(spawn(g,0,'knight',370,800));
  const eh=enemy.hp;advance(g,1.45);assert.equal(enemy.hp,eh);
  advance(g,.10);assert.equal(enemy.hp,eh-UNITS.rage.damage);
  const snap=viewMatch(g,0),allyView=snap.units.find(u=>u.id===ally.id),zoneView=snap.zones.find(z=>z.id===zone.id);assert.equal(zoneView.active,true);assert.equal(zoneView.boostMultiplier,UNITS.rage.boostMultiplier);assert.equal(allyView.rageActive,true);
});


test('Air Balloon ignores nearby troops and attacks the lane structure',()=>{
  const g=battle(3803),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===ARENA.lanes[0]);
  const balloon=spawn(g,0,'airballoon',tower.x,tower.y+20);balloon.lane=tower.x;Object.assign(balloon,{speed:0,cd:0,firstStrikeReadyAt:0});
  const troop=inert(spawn(g,1,'knight',tower.x,tower.y+18));troop.hp=5000;troop.maxHp=5000;
  const th=tower.hp;advance(g,.60);
  assert.equal(tower.hp,th-640);assert.equal(troop.hp,5000);assert.equal(balloon.target,tower.id);
});
