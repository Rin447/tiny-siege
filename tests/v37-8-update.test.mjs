import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,UNITS,DECK,MAX_DECK,MELEE_RANGE_CELLS} from '../public/game/units.js';
import {createMatch,deploy,tick} from '../public/game/engine.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';

function ready(g,o,id){const pool=[id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);g.players[o].energy=10;g.players[o].deck=[...pool];g.players[o].hand=pool.slice(0,4);g.players[o].queue=pool.slice(4);}
function advance(g,sec){let left=sec;while(left>1e-9){const dt=Math.min(.02,left);tick(g,dt);left-=dt;}}
function battle(seed=7801){const g=createMatch({seed});g.phase='battle';g.countdown=0;g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}
function makeReady(u){Object.assign(u,{deploying:false,targetable:true,collisionDisabled:false,spawn:0,firstStrikeDelay:0});}

test('v37.8 melee range tiers and Prince stats are exact',()=>{
  assert.equal(VERSION,'38.0.0');assert.equal(PHYSICS_VERSION,72);
  assert.deepEqual(MELEE_RANGE_CELLS,{close:1,medium:1.5,long:2});
  assert.equal(UNITS.knight.meleeTier,'close');assert.equal(UNITS.spear.meleeTier,'medium');assert.equal(UNITS.megagargoyle.meleeTier,'long');
  const p=UNITS.prince;assert.equal(p.cost,5);assert.equal(p.hp,1920);assert.equal(p.damage,392);assert.equal(p.cooldown,1.4);assert.equal(p.rangeCells,2);assert.equal(p.meleeRangeLabel,'\u9577\u8ddd\u96e2');
  assert.equal(p.meleeTier,'long');assert.equal(p.chargeDistanceCells,2.5);assert.equal(p.chargeDamage,784);assert.equal(p.targetsAir,false);assert.equal(p.visionSize,'medium');
  const d=UNITS.darkprince;assert.equal(d.cost,4);assert.equal(d.hp,1200);assert.equal(d.shieldMax,240);assert.equal(d.damage,266);assert.equal(d.cooldown,1.4);assert.equal(d.rangeCells,1.5);assert.equal(d.meleeTier,'medium');assert.equal(d.meleeSplash,40);assert.equal(d.chargeDistanceCells,2);assert.equal(d.chargeDamage,532);assert.equal(d.shieldNoOverflow,true);
});

test('v37.8 Prince charges after 2.5 cells of real continuous movement and first charge hit is 784',()=>{
  const g=battle(7802);ready(g,0,'prince');assert.ok(deploy(g,0,'prince',360,900).ok);const p=g.units.find(u=>u.owner===0&&u.type==='prince');makeReady(p);
  ready(g,1,'knight');assert.ok(deploy(g,1,'knight',360,500).ok);const t=g.units.find(u=>u.owner===1&&u.type==='knight');makeReady(t);Object.assign(t,{x:360,y:680,speed:0,damage:0,hp:5000,maxHp:5000});
  advance(g,2.4);assert.equal(p.charged,false);assert.ok(p.chargeRun>90&&p.chargeRun<100,`chargeRun=${p.chargeRun}`);
  advance(g,.1);assert.equal(p.charged,true);assert.equal(p.chargeRun,p.chargeDistance);assert.equal(t.hp,5000);
  let guard=0;while(t.hp===5000&&guard++<500)tick(g,.02);
  assert.equal(t.hp,5000-784);assert.equal(p.charged,false);assert.equal(p.chargeRun,0);
});

test('v37.8 an ordinary Prince attack resets partial charge distance to zero',()=>{
  const g=battle(7803);ready(g,0,'prince');assert.ok(deploy(g,0,'prince',360,800).ok);const p=g.units.find(u=>u.owner===0&&u.type==='prince');makeReady(p);Object.assign(p,{x:360,y:760,chargeRun:90,charged:false});
  ready(g,1,'knight');assert.ok(deploy(g,1,'knight',360,500).ok);const t=g.units.find(u=>u.owner===1&&u.type==='knight');makeReady(t);Object.assign(t,{x:360,y:690,speed:0,damage:0,hp:5000,maxHp:5000});
  tick(g,.02);assert.equal(t.hp,5000-392);assert.equal(p.chargeRun,0);assert.equal(p.charged,false);
});

test('v37.8 stun resets an active mounted charge',()=>{
  const g=battle(7804);ready(g,0,'prince');assert.ok(deploy(g,0,'prince',360,800).ok);const p=g.units.find(u=>u.owner===0&&u.type==='prince');makeReady(p);p.chargeRun=p.chargeDistance;p.charged=true;
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',p.x,p.y).ok);assert.equal(p.charged,false);assert.equal(p.chargeRun,0);assert.ok(p.stunUntil>g.time);
});

test('v37.8 Dark Prince shield discards overflow from the hit that breaks it',()=>{
  const g=battle(7805);ready(g,0,'darkprince');assert.ok(deploy(g,0,'darkprince',360,800).ok);const d=g.units.find(u=>u.owner===0&&u.type==='darkprince');makeReady(d);d.speed=0;d.shieldHp=50;
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',d.x,d.y).ok);assert.equal(d.shieldHp,0);assert.equal(d.hp,1200);
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',d.x,d.y).ok);assert.equal(d.hp,1200-UNITS.zap.damage);
});

test('v37.8 Dark Prince charged attack deals 532 splash and resets charge',()=>{
  const g=battle(7806);ready(g,0,'darkprince');assert.ok(deploy(g,0,'darkprince',360,800).ok);const d=g.units.find(u=>u.owner===0&&u.type==='darkprince');makeReady(d);Object.assign(d,{x:360,y:760,chargeRun:d.chargeDistance,charged:true});
  ready(g,1,'knight');assert.ok(deploy(g,1,'knight',360,500).ok);const main=g.units.find(u=>u.owner===1&&u.type==='knight');makeReady(main);Object.assign(main,{x:360,y:700,speed:0,damage:0,hp:5000,maxHp:5000});
  ready(g,1,'blade');assert.ok(deploy(g,1,'blade',390,500).ok);const side=g.units.find(u=>u.owner===1&&u.type==='blade');makeReady(side);Object.assign(side,{x:390,y:700,speed:0,damage:0,hp:5000,maxHp:5000});
  tick(g,.02);assert.equal(main.hp,5000-532);assert.equal(side.hp,5000-532);assert.equal(d.charged,false);assert.equal(d.chargeRun,0);
});
