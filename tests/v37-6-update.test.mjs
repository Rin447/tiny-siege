import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,UNITS,DECK,MAX_DECK} from '../public/game/units.js';
import {createMatch,deploy,tick,viewMatch} from '../public/game/engine.js';

function ready(g,o,id){const pool=[id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);g.players[o].energy=10;g.players[o].deck=[...pool];g.players[o].hand=pool.slice(0,4);g.players[o].queue=pool.slice(4);}
function advance(g,sec){for(let i=0;i<Math.ceil(sec/.02);i++)tick(g,Math.min(.02,sec-i*.02));}

test('v37.6 laser tower starts at 42 DPS and deals damage every 0.2 seconds',()=>{
  const g=createMatch({seed:7601});g.phase='battle';g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'lasertower');assert.ok(deploy(g,0,'lasertower',360,820).ok);const laser=g.units.find(u=>u.type==='lasertower');Object.assign(laser,{deploying:false,targetable:true,collisionDisabled:false,spawn:0,decayPerSecond:0,x:360,y:700,firstStrikeDelay:0});
  ready(g,1,'knight');assert.ok(deploy(g,1,'knight',360,520).ok);const target=g.units.find(u=>u.owner===1&&u.type==='knight');Object.assign(target,{deploying:false,targetable:true,collisionDisabled:false,spawn:0,speed:0,damage:0,x:360,y:560});
  const hp=target.hp;tick(g,.1);assert.equal(target.hp,hp);tick(g,.1);assert.ok(Math.abs(target.hp-(hp-8.4))<.02,`${target.hp}`);assert.equal(laser.laserBaseDps,42);assert.equal(laser.laserDamageTick,.2);
});

test('v37.6 fireball waits 1.26 seconds, then flies from core and radially knocks small/medium survivors',()=>{
  const g=createMatch({seed:7602});g.phase='battle';g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'fireball');const targetX=360,targetY=760;const result=deploy(g,0,'fireball',targetX,targetY);assert.ok(result.ok);assert.equal(result.launchDelay,1.26);assert.equal(UNITS.fireball.radiusCells,2.5);
  const p=g.projectiles.find(p=>p.spell==='fireball');assert.equal(p.launched,false);advance(g,1.2);assert.equal(p.launched,false);advance(g,.08);assert.equal(p.launched,true);
  const g2=createMatch({seed:7603});g2.phase='battle';g2.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g2,1,'knight');assert.ok(deploy(g2,1,'knight',500,520).ok);const victim=g2.units.find(u=>u.owner===1&&u.type==='knight');victim.deploying=false;victim.targetable=true;victim.collisionDisabled=false;victim.spawn=0;victim.hp=2000;victim.maxHp=2000;victim.x=400;victim.y=760;ready(g2,0,'fireball');deploy(g2,0,'fireball',360,760);const beforeX=victim.x;advance(g2,4);assert.ok(victim.x>beforeX+20,`expected radial knockback, ${beforeX} -> ${victim.x}`);
});

test('v37.6 arrow rain has 3.5-cell radius, 1.1s launch delay, and distance-based core flight',()=>{
  assert.equal(UNITS.arrowrain.radiusCells,3.5);const g=createMatch({seed:7604});g.phase='battle';g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'arrowrain');const r=deploy(g,0,'arrowrain',ARENA.lanes[0],640);assert.ok(r.ok);assert.equal(r.launchDelay,1.1);assert.ok(r.flightTime>1.4&&r.flightTime<1.5,`bridge flight ${r.flightTime}`);
  const g2=createMatch({seed:7605});g2.phase='battle';g2.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g2,0,'arrowrain');const enemyCore=g2.towers.find(t=>t.owner===1&&t.kind==='core'),r2=deploy(g2,0,'arrowrain',enemyCore.x,enemyCore.y);assert.ok(r2.ok);assert.ok(Math.abs(r2.flightTime-2.4)<.001,`enemy core flight ${r2.flightTime}`);
});

test('v37.6 elixir pump generates one energy every 13s, decays 11.5 HP/s, and grants one on death',()=>{
  const g=createMatch({seed:7606});g.phase='battle';g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'elixirpump');const r=deploy(g,0,'elixirpump',300,860);assert.ok(r.ok,r.error);const pump=g.units.find(u=>u.type==='elixirpump');pump.deploying=false;pump.targetable=true;pump.collisionDisabled=false;pump.spawn=0;pump.energyNextAt=g.time+13;const hp0=pump.hp;advance(g,12.9);assert.ok(Math.abs(pump.hp-(hp0-11.5*12.9))<1);g.players[0].energy=0;advance(g,.12);assert.ok(g.players[0].energy>1&&g.players[0].energy<1.2,`cycle grant plus normal regen: ${g.players[0].energy}`);const view=viewMatch(g,0),pv=view.units.find(u=>u.type==='elixirpump');assert.ok(pv.energyPumpProgress>=0&&pv.energyPumpProgress<=1);
  g.players[0].energy=0;pump.hp=.5;tick(g,.1);assert.ok(g.players[0].energy>1&&g.players[0].energy<1.1,'death grant should add one energy plus normal regen');
});
