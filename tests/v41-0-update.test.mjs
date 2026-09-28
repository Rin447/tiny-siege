import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VERSION,ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,MAX_DECK,cellsToWorld} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';
import {createMatch,deploy,tick} from '../public/game/engine.js';

function battle(seed=4100){const g=createMatch({seed});g.phase='battle';g.countdown=0;g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}
function deckWith(id){return [id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);}
function ready(g,owner,id){const d=deckWith(id),p=g.players[owner];p.energy=10;p.deck=[...d];p.hand=d.slice(0,4);p.queue=d.slice(4);}
function advance(g,s,step=.01){let left=s;while(left>1e-9){const dt=Math.min(step,left);tick(g,dt);left-=dt;}}
function stage(g,owner,id,x,y){ready(g,owner,id);const r=deploy(g,owner,id,x,y);assert.ok(r.ok,r.error);const u=g.units.at(-1);Object.assign(u,{deploying:false,deployRemaining:0,targetable:true,collisionDisabled:false,spawn:0,speed:0,damage:0,cd:99});return u;}

test('v41.0 roster and rolling spell values are exact',()=>{
  assert.equal(VERSION,'41.2.0');assert.equal(PHYSICS_VERSION,76);
  assert.equal(DECK.length,77);assert.equal(new Set(DECK).size,77);assert.equal(UNIT_IDS.length,66);assert.equal(SPELL_IDS.length,11);
  assert.ok(SPELL_IDS.includes('rollingwood'));assert.ok(SPELL_IDS.includes('rollingbarbarian'));
  const w=UNITS.rollingwood,b=UNITS.rollingbarbarian;
  assert.equal(w.cost,2);assert.equal(w.damage,268);assert.equal(w.rollSpeed,364);assert.equal(w.towerDamage,35);assert.equal(w.widthCells,3.9);assert.equal(w.width,cellsToWorld(3.9));assert.equal(w.travelCells,10.1);assert.equal(w.travelDistance,cellsToWorld(10.1));assert.equal(w.knockbackCells,.5);assert.equal(w.targetsAir,false);assert.equal(w.deploymentZoneOnly,true);
  assert.equal(b.cost,2);assert.equal(b.damage,232);assert.equal(b.rollSpeed,308);assert.equal(b.towerDamage,0);assert.equal(b.widthCells,2.6);assert.equal(b.width,cellsToWorld(2.6));assert.equal(b.travelCells,4.5);assert.equal(b.travelDistance,cellsToWorld(4.5));assert.equal(b.spawnType,'barbarian');assert.equal(b.spawnCount,1);assert.equal(b.knockbackCells,undefined);assert.equal(b.deploymentZoneOnly,true);
});

test('both rolling spells may only start inside the unit deployment zone',()=>{
  for(const [id,seed] of [['rollingwood',4101],['rollingbarbarian',4102]]){
    const g=battle(seed);ready(g,0,id);
    const bad=deploy(g,0,id,ARENA.lanes[0],ARENA.height/2-ARENA.cellSize*2);assert.equal(bad.ok,false);assert.match(bad.error,/召喚できる範囲/);
    ready(g,0,id);const good=deploy(g,0,id,ARENA.lanes[0],ARENA.deployBottom+ARENA.cellSize);assert.equal(good.ok,true);
  }
});

test('Rolling Wood deals 268 once to ground, ignores air, and deals 35 to a tower',()=>{
  const g=battle(4103),x=ARENA.lanes[0];const ground=stage(g,1,'knight',x,560),air=stage(g,1,'bat',x+20,550);ground.hp=ground.maxHp=2000;air.hp=air.maxHp=1000;
  const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===x),towerHp=tower.hp,groundHp=ground.hp,airHp=air.hp;
  ready(g,0,'rollingwood');const r=deploy(g,0,'rollingwood',x,ARENA.deployBottom);assert.ok(r.ok,r.error);advance(g,r.travelTime+.05);
  assert.equal(groundHp-ground.hp,268);assert.equal(airHp-air.hp,0);assert.equal(towerHp-tower.hp,35);
});

test('Rolling Wood gives small, medium and large ground units the same 0.5-cell knockback',()=>{
  const g=battle(4104),y=560,centre=ARENA.lanes[0],cards=[['blowdart',centre-60],['blade',centre],['giant',centre+60]],units=[];
  for(const [id,x] of cards){const u=stage(g,1,id,x,y);u.hp=u.maxHp=2000;units.push(u);}
  const before=units.map(u=>u.y);ready(g,0,'rollingwood');const r=deploy(g,0,'rollingwood',centre,ARENA.deployBottom);assert.ok(r.ok);advance(g,.4);
  const expected=cellsToWorld(.5);for(let i=0;i<units.length;i++){const moved=before[i]-units[i].y;assert.ok(Math.abs(moved-expected)<.05,`${units[i].type} moved ${moved}, expected ${expected}`);}
});

test('Rolling Barbarian deals 232 once, never damages towers, has no knockback, and spawns one normal Barbarian at the end',()=>{
  const g=battle(4105),x=ARENA.lanes[0],victim=stage(g,1,'knight',x,560);victim.y=620;victim.hp=victim.maxHp=2000;const beforeY=victim.y;
  ready(g,0,'rollingbarbarian');const r=deploy(g,0,'rollingbarbarian',x,ARENA.deployBottom+ARENA.cellSize);assert.ok(r.ok,r.error);const projectile=g.projectiles.find(p=>p.spell==='rollingbarbarian');assert.ok(projectile);advance(g,r.travelTime+.02);
  assert.equal(2000-victim.hp,232);assert.equal(victim.y,beforeY);
  const spawned=g.units.filter(u=>u.summonedBy===projectile.id&&u.type==='barbarian');assert.equal(spawned.length,1);assert.equal(spawned[0].owner,0);
  const g2=battle(4108),tower=g2.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===x);tower.y=600;const towerHp=tower.hp;ready(g2,0,'rollingbarbarian');const r2=deploy(g2,0,'rollingbarbarian',x,ARENA.deployBottom+ARENA.cellSize);assert.ok(r2.ok);advance(g2,r2.travelTime+.02);assert.equal(tower.hp,towerHp);
});

test('rolling spell projectiles travel forward from the selected point with the requested width and range',()=>{
  const g=battle(4106),x=ARENA.lanes[1],startY=ARENA.deployBottom+ARENA.cellSize;ready(g,0,'rollingwood');const wr=deploy(g,0,'rollingwood',x,startY),wp=g.projectiles.find(p=>p.spell==='rollingwood');assert.ok(wr.ok&&wp);assert.equal(wp.sx,x);assert.equal(wp.sy,startY);assert.equal(wp.tx,x);assert.equal(wp.ty,startY-cellsToWorld(10.1));assert.equal(wp.hitWidth,cellsToWorld(3.9));assert.ok(wr.travelTime>1&&wr.travelTime<1.2,'Rolling Wood should reflect the 30% speed reduction');
  const g2=battle(4107);ready(g2,0,'rollingbarbarian');const br=deploy(g2,0,'rollingbarbarian',x,startY),bp=g2.projectiles.find(p=>p.spell==='rollingbarbarian');assert.ok(br.ok&&bp);assert.equal(bp.ty,startY-cellsToWorld(4.5));assert.equal(bp.hitWidth,cellsToWorld(2.6));
});

test('v41 visuals include a spiked long log, a trapped rolling Barbarian and lane-strip placement previews',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(art,/function drawRollingWood/);assert.match(art,/Long horizontal log/);assert.match(art,/function drawRollingBarbarian/);assert.match(art,/barbarian wedged sideways/);assert.match(art,/p\.kind==='rollingwood'/);assert.match(art,/p\.kind==='rollingbarbarian'/);assert.match(art,/fillRect\(ghost\.x-width\/2,endY,width,actual\)/);
});
