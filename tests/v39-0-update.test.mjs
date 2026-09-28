import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,MAX_DECK,cellsToWorld} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';
import {createMatch,deploy,tick,targetGap} from '../public/game/engine.js';

function battle(seed=3900){const g=createMatch({seed});g.phase='battle';g.countdown=0;g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}
function deckWith(id){return [id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);}
function ready(g,owner,id){const d=deckWith(id),p=g.players[owner];p.energy=10;p.deck=[...d];p.hand=d.slice(0,4);p.queue=d.slice(4);}
function forceReady(u,g){u.spawn=0;u.deploying=false;u.deployRemaining=0;u.deployTotal=0;u.targetable=true;u.collisionDisabled=false;u.firstStrikeReadyAt=0;if(u.summonInterval&&!Number.isFinite(u.summonNextAt))u.summonNextAt=g.time+u.summonInterval;return u;}
function spawn(g,owner,id,x,y){ready(g,owner,id);const n=g.units.length,r=deploy(g,owner,id,owner===0?190:580,owner===0?800:480);assert.ok(r.ok,r.error);const u=g.units.slice(n).find(v=>v.type===id)||g.units.at(-1);forceReady(u,g);u.x=x;u.y=y;u.lane=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];return u;}
function advance(g,s,step=.02){let left=s;while(left>1e-9){const dt=Math.min(step,left);tick(g,dt);left-=dt;}}
function inert(u,hp=5000){Object.assign(u,{hp,maxHp:hp,speed:0,damage:0,range:0,cd:99,collisionDisabled:true});return u;}

test('v39.0 roster, physics and Giant/Balloon/spell values are exact',()=>{
 assert.equal(VERSION,'41.2.0');assert.equal(PHYSICS_VERSION,76);
 assert.equal(DECK.length,77);assert.equal(new Set(DECK).size,77);assert.equal(UNIT_IDS.length,66);assert.equal(SPELL_IDS.length,11);
 const giant=UNITS.giant;assert.equal(giant.cost,5);assert.equal(giant.hp,3968);assert.equal(giant.damage,254);assert.equal(giant.cooldown,1.5);assert.equal(giant.speed,27);assert.equal(giant.rangeCells,1.5);assert.equal(giant.range,cellsToWorld(1.5));assert.equal(giant.buildingOnly,true);assert.equal(giant.air,false);assert.equal(giant.targetsAir,false);assert.equal(giant.meleeTier,'medium');
 const balloon=UNITS.airballoon;assert.equal(balloon.speed,38);assert.equal(balloon.rangeCells,.25);assert.equal(balloon.range,cellsToWorld(.25));assert.equal(balloon.overheadAttack,true);assert.equal(balloon.buildingOnly,true);
 assert.equal(UNITS.fireball.launchDelay,1.1);assert.equal(UNITS.arrowrain.launchDelay,.9);
});

test('Air Balloon flies over the structure edge and only begins its attack almost directly above the centre',()=>{
 const g=battle(3901),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===ARENA.lanes[0]);
 const balloon=spawn(g,0,'airballoon',tower.x,tower.y+80);balloon.lane=tower.x;balloon.cd=0;balloon.firstStrikeReadyAt=0;
 const initialGap=targetGap(balloon,tower);assert.equal(initialGap,80);assert.ok(initialGap>balloon.range);
 const towerHp=tower.hp;advance(g,.5);assert.equal(tower.hp,towerHp,'must not damage while still away from the centre');
 let hitGap=null;
 for(let i=0;i<300&&tower.hp===towerHp;i++){
   tick(g,.02);
   if(tower.hp<towerHp)hitGap=targetGap(balloon,tower);
 }
 assert.equal(tower.hp,towerHp-640,'Balloon should eventually drop its 640-damage bomb');assert.ok(hitGap<=balloon.range+.75,`hit gap ${hitGap} > attack range ${balloon.range}`);
 assert.ok(Math.abs(balloon.x-tower.x)<=balloon.range+.75);assert.ok(Math.abs(balloon.y-tower.y)<=balloon.range+.75);
});

test('Giant ignores nearby troops and punches the building for 254 from medium melee range',()=>{
 const g=battle(3902),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===ARENA.lanes[0]);
 const giant=spawn(g,0,'giant',tower.x,tower.y+90);giant.lane=tower.x;Object.assign(giant,{speed:0,cd:0,firstStrikeReadyAt:0});
 const guard=inert(spawn(g,1,'knight',tower.x,tower.y+70));
 assert.ok(targetGap(giant,tower)<=giant.range,`giant gap ${targetGap(giant,tower)} > ${giant.range}`);
 const th=tower.hp,gh=guard.hp;advance(g,.6);
 assert.equal(tower.hp,th-254);assert.equal(guard.hp,gh);assert.equal(giant.target,tower.id);
});

test('Fireball and Arrow Rain use the faster 1.1s and 0.9s launch warnings',()=>{
 const fire=battle(3903);ready(fire,0,'fireball');const fr=deploy(fire,0,'fireball',360,500);assert.ok(fr.ok);assert.equal(fr.launchDelay,1.1);const fp=fire.projectiles.find(p=>p.spell==='fireball');assert.ok(fp&&!fp.launched);advance(fire,1.05);assert.equal(fp.launched,false);advance(fire,.1);assert.equal(fp.launched,true);
 const arrows=battle(3904);ready(arrows,0,'arrowrain');const ar=deploy(arrows,0,'arrowrain',360,500);assert.ok(ar.ok);assert.equal(ar.launchDelay,.9);const ap=arrows.projectiles.find(p=>p.spell==='arrowrain');assert.ok(ap&&!ap.launched);advance(arrows,.85);assert.equal(ap.launched,false);advance(arrows,.1);assert.equal(ap.launched,true);
});
