import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,TOWER_GRID,GRID_COLS,GRID_ROWS,GRID_CELL,UNITS,DECK,VERSION,VISION_BY_SIZE,visionSizeFor,visionRangeFor} from '../public/game/units.js';
import {createMatch,tick,deploy,canPlace,viewMatch,distance,runBot} from '../public/game/engine.js';
import {staticFree,terrainFree,staticLineFree,resolveBodies,pairDistance,bodyRadius,footprintRect,moveBody,navigationWaypoint,faceToward,PHYSICS_VERSION,solidStructures} from '../public/game/physics.js';
import {visualFacing,renderOrder} from '../public/game/art.js';
import {RoomModel,newRoom} from '../src/room-model.js';
function game(){const g=createMatch({seed:719});g.phase='battle';for(const t of g.towers)t.damage=0;return g;}
function card(g,id,owner=0){const p=g.players[owner];p.energy=10;p.hand=[id,...DECK.filter(x=>x!==id).slice(0,3)];p.queue=DECK.filter(x=>!p.hand.includes(x));}
function unit(g,type,owner,x,y){card(g,type,owner);const before=g.units.length,safeX=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],safeY=owner===0?ARENA.riverBottom+ARENA.cellSize*3:ARENA.riverTop-ARENA.cellSize*3,r=deploy(g,owner,type,safeX,safeY);assert.ok(r.ok,r.error);const made=g.units.slice(before);for(const u of made){u.spawn=0;u.deploying=false;u.deployRemaining=0;u.deployTotal=0;u.targetable=true;u.collisionDisabled=false;u.x=x;u.y=y;u.lane=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];if(u.sparkUnit&&!Number.isFinite(u.sparkChargeStartAt))u.sparkChargeStartAt=g.time;if(u.summonInterval&&!Number.isFinite(u.summonNextAt))u.summonNextAt=g.time+u.summonInterval;}return made.at(-1);}
function advance(g,n){for(let i=0;i<n;i++)tick(g,.1);}
function body(g,type,owner,x,y){const u={...UNITS[type],id:`u${g.nextId++}`,type,owner,x,y,maxHp:UNITS[type].hp,spawn:0,cd:999,walk:0,age:0,anim:0,hit:0,lane:x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],face:owner===0?-1:1};g.units.push(u);return u;}
function checkStatics(g){for(const u of g.units)if(!u.building&&u.burrowState!=='burrow')assert.ok(staticFree(g,u,u),`${u.id} ${u.type} in static at ${u.x},${u.y}`);}

test('v37.2 physics version and 18x32 grid geometry are explicit',()=>{
 assert.equal(VERSION,'37.2.0');assert.equal(PHYSICS_VERSION,63);assert.equal(GRID_COLS,18);assert.equal(GRID_ROWS,32);assert.equal(GRID_CELL,40);
 assert.equal(ARENA.width,720);assert.equal(ARENA.height,1280);assert.deepEqual(ARENA.riverRows,[16,17]);assert.deepEqual(TOWER_GRID.blue.core,[8,11,2,5]);
 assert.equal(createMatch().physicsVersion,63);
});

test('vision classes are cell based: small 4, medium 5, large 6',()=>{
 assert.deepEqual(VISION_BY_SIZE,{small:160,medium:200,large:240});
 assert.equal(visionSizeFor(UNITS.skeleton),'small');assert.equal(visionRangeFor(UNITS.skeleton),160);
 assert.equal(visionSizeFor(UNITS.knight),'medium');assert.equal(visionRangeFor(UNITS.knight),200);
 assert.equal(visionSizeFor(UNITS.berserker),'large');assert.equal(visionRangeFor(UNITS.berserker),240);
 assert.equal(visionRangeFor(UNITS.nightshade),120,'Yuno keeps its dedicated three-cell sight override');
 assert.ok(visionRangeFor(UNITS.archer)>=UNITS.archer.range,'ranged units must still see far enough to use their weapon');
});
test('ground body edges respect the two-row river while bridge and air remain traversable',()=>{
 const u=UNITS.knight;
 assert.equal(terrainFree(u,{x:360,y:690}),false,'body edge overlaps open river');
 assert.equal(terrainFree(u,{x:360,y:699}),true,'one-cell lawn side is safe after body clearance');
 assert.equal(terrainFree(u,{x:140,y:640}),true,'left lane centre is the two-cell bridge');
 assert.equal(terrainFree(u,{x:190,y:640}),false,'outside the widened bridge is still open water');
 assert.equal(terrainFree(u,{x:580,y:640}),true,'right lane centre is the two-cell bridge');
 assert.equal(terrainFree(u,{x:125,y:640}),true,'left bridge remains traversable across its widened span with body clearance');
 assert.equal(terrainFree(u,{x:155,y:640}),true,'left bridge far side remains traversable across its widened span with body clearance');
 assert.equal(terrainFree(UNITS.bat,{x:360,y:640}),true,'air ignores river collision');
});
test('initial deployment territory ends exactly at the two-row river',()=>{
 const g=game();assert.equal(ARENA.deployBottom,680);assert.equal(ARENA.deployTop,600);
 card(g,'knight',0);assert.equal(canPlace(g,0,'knight',360,681),null);
 card(g,'knight',0);assert.ok(canPlace(g,0,'knight',140,650),'river rows are not initial deployment territory even on bridge');
 card(g,'knight',1);assert.equal(canPlace(g,1,'knight',360,599),null);
 card(g,'knight',1);assert.ok(canPlace(g,1,'knight',580,630));
});
test('riverbank edge placement snaps the body fully back onto its own lawn',()=>{
 for(const owner of [0,1]){
   const g=game();card(g,'knight',owner);const y=owner===0?681:599,r=deploy(g,owner,'knight',360,y);assert.ok(r.ok,r.error);
   const u=g.units.find(v=>v.owner===owner&&v.type==='knight'),br=bodyRadius(u);
   assert.equal(u.y,owner===0?ARENA.riverBottom+br+1:ARENA.riverTop-br-1);assert.ok(terrainFree(u,u));
 }
});
test('group deployment near the bank keeps every member on safe terrain',()=>{
 const g=game();card(g,'archer',0);const r=deploy(g,0,'archer',360,681);assert.ok(r.ok,r.error);
 const pair=g.units.filter(u=>u.type==='archer');assert.equal(pair.length,2);
 for(const u of pair)assert.ok(terrainFree(u,u));
 assert.ok(distance(pair[0],pair[1])>=pairDistance(pair[0],pair[1]));
});
test('one grid row behind each 4x4 core remains troop-deployable',()=>{
 for(const [owner,y] of [[0,1260],[1,20]]){
   const g=game();card(g,'knight',owner);assert.equal(canPlace(g,owner,'knight',360,y),null);
   const r=deploy(g,owner,'knight',360,y);assert.ok(r.ok,r.error);const u=g.units.find(v=>v.owner===owner&&v.type==='knight');assert.ok(staticFree(g,u,u));
 }
});
test('tower footprints block ground deployment but not air deployment',()=>{
 const g=game(),tower=g.towers.find(t=>t.owner===0&&t.slot==='left');assert.deepEqual([tower.x,tower.y,tower.footprintCols,tower.footprintRows],[140,1020,3,3]);
 card(g,'knight',0);assert.ok(canPlace(g,0,'knight',tower.x,tower.y));
 card(g,'bat',0);assert.equal(canPlace(g,0,'bat',tower.x,tower.y),null);assert.ok(deploy(g,0,'bat',tower.x,tower.y).ok);
});
test('default placed building occupies a real 3x3-cell rectangular footprint',()=>{
 const g=game(),c=unit(g,'cannon',0,300,860),r=footprintRect(c);assert.deepEqual([r.l,r.r,r.t,r.b],[240,360,800,920]);
 card(g,'cannon',0);assert.ok(canPlace(g,0,'cannon',300,860),'overlapping footprint must be rejected');
});
test('five-air-unit group deploys legally without overlap on the new field',()=>{
 const g=game();card(g,'bat',0);assert.ok(deploy(g,0,'bat',80,800).ok);assert.equal(g.units.length,5);checkStatics(g);
 for(const a of g.units)for(const b of g.units)if(a!==b)assert.ok(distance(a,b)>=pairDistance(a,b)-.01);
});
test('second ground deployment at the same point shifts to a free body position',()=>{
 const g=game();card(g,'knight',0);assert.ok(deploy(g,0,'knight',300,800).ok);const a=g.units.at(-1);
 card(g,'blade',0);assert.ok(deploy(g,0,'blade',300,800).ok);const b=g.units.at(-1);
 assert.ok(distance(a,b)>=pairDistance(a,b)-.01);assert.notEqual(b.x,300);
});
test('ground navigation routes around a 3x3 side tower and through its lane bridge',()=>{
 for(const owner of [0,1]){
   const g=game(),x=owner===0?140:580,y=owner===0?1140:140,goal={id:`goal-${owner}`,x:owner===0?ARENA.bridges[0]:ARENA.bridges[1],y:owner===0?560:720,radius:0},u=body(g,'knight',owner,x,y),sx=x;
   assert.equal(staticLineFree(g,u,u,goal),false);let lateral=0;
   for(let i=0;i<320&&distance(u,goal)>14;i++){const p=navigationWaypoint(g,u,goal,5);moveBody(g,u,p,.1);g.time+=.1;lateral=Math.max(lateral,Math.abs(u.x-sx));checkStatics(g);}
   assert.ok(distance(u,goal)<18,`route failed: ${u.x},${u.y}`);assert.ok(lateral>60,'must visibly route around the tower footprint');
 }
});
test('air crosses open river and towers in a straight path',()=>{
 const g=game(),u=body(g,'bat',0,360,980),target={id:'goal',x:360,y:350,radius:0};
 for(let i=0;i<90;i++){const p=navigationWaypoint(g,u,target,5);moveBody(g,u,p,.1);g.time+=.1;}
 assert.ok(u.y<600);assert.equal(u.x,360);
});
test('ground and air layers ignore each other for body separation',()=>{
 const g=game(),ground=body(g,'blade',0,300,900),air=body(g,'bat',1,300,860);resolveBodies(g,.1);
 for(let i=0;i<20;i++)moveBody(g,ground,{x:300,y:800},.1);
 assert.ok(ground.y<=801);assert.equal(air.x,300);assert.equal(air.y,860);
});
test('allied ground bodies separate softly with mass-weighted displacement',()=>{
 const g=game(),heavy=body(g,'knight',0,300,850),light=body(g,'archer',0,320,850);resolveBodies(g,.1);
 const heavyMove=300-heavy.x,lightMove=light.x-320;assert.ok(heavyMove>0&&lightMove>0);assert.ok(lightMove>heavyMove*3);assert.ok(distance(heavy,light)>29);
});
test('enemy ground bodies block direct passage but can be walked around',()=>{
 const g=game(),a=body(g,'blade',0,300,900),b=body(g,'knight',1,300,845);let min=Infinity;
 for(let i=0;i<60;i++){moveBody(g,a,{x:300,y:760},.1);min=Math.min(min,distance(a,b));}
 assert.ok(min>=pairDistance(a,b)-.01);assert.ok(a.y<800,'single blocker must not become an infinite wall');
});
test('defeated side tower immediately stops blocking routes and invalidates nav topology',()=>{
 const g=game(),u=body(g,'blade',0,140,1140),target={id:'end',x:140,y:900,radius:0};
 assert.equal(staticLineFree(g,u,u,target),false);const before=navigationWaypoint(g,u,target,5);assert.ok(Math.abs(before.x-140)>50);
 g.towers.find(t=>t.owner===0&&t.slot==='left').hp=0;
 assert.equal(staticLineFree(g,u,u,target),true);const after=navigationWaypoint(g,u,target,5);assert.ok(Math.abs(after.x-140)<.01);
});
test('fully decayed cannon is removed from the solid obstacle set',()=>{
 const g=game(),c=unit(g,'cannon',0,300,860);c.hp=UNITS.cannon.decayPerSecond*.1;c.spawn=0;tick(g,.1);assert.ok(!solidStructures(g).some(x=>x.id===c.id));
});
test('navigation around a 3x3 cannon footprint creates a measurable detour',()=>{
 const g=game(),c=unit(g,'cannon',0,300,860),u=body(g,'blade',0,300,980),target={id:'goal',x:300,y:740,radius:0};c.decayPerSecond=0;
 assert.equal(staticLineFree(g,u,u,target),false);let travel=0,lateral=0;
 for(let i=0;i<170&&distance(u,target)>10;i++){const p=navigationWaypoint(g,u,target,5);travel+=moveBody(g,u,p,.1);g.time+=.1;lateral=Math.max(lateral,Math.abs(u.x-300));checkStatics(g);}
 assert.ok(distance(u,target)<12);assert.ok(travel>280);assert.ok(lateral>60);
});
test('navigation with no accessible open-water target fails closed instead of teleporting',()=>{
 const g=game(),u=body(g,'knight',0,300,800),t={id:'water',x:360,y:640,radius:0};const p=navigationWaypoint(g,u,t,1);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(staticFree(g,u,p));
});
test('zero-distance crowd fixture never produces NaN coordinates',()=>{
 const g=game();for(let i=0;i<6;i++)body(g,'blade',i%2,300,700);
 for(let n=0;n<20;n++)resolveBodies(g,.1);
 for(const u of g.units){assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.y));checkStatics(g);}
});
test('facing retains direction on horizontal movement and tracks rear attacks',()=>{
 const u={x:0,y:0,face:-1};faceToward(u,100,.01);assert.equal(u.face,-1);faceToward(u,0,30);assert.equal(u.face,1);assert.equal(u.facing,Math.PI/2);
});
test('both players see their advancing units from behind and enemies from the front',()=>{
 const a={owner:0,face:-1,facing:-Math.PI/2},b={owner:1,face:1,facing:Math.PI/2};
 assert.equal(visualFacing(a,0).back,true);assert.equal(visualFacing(a,1).back,false);
 assert.equal(visualFacing(b,1).back,true);assert.equal(visualFacing(b,0).back,false);
});
test('unit attacks a rear target with its facing rather than owner-based fixed pose',()=>{
 const g=game(),a=body(g,'blade',0,300,700),b=body(g,'blade',1,300,740);a.cd=0;tick(g,.1);assert.equal(a.face,1);assert.equal(visualFacing(a,0).back,false);
});
test('rendering depth mixes towers and ground troops; air is always after ground',()=>{
 const g={towers:[{id:'tower',x:300,y:700}],units:[{id:'rear',x:300,y:640},{id:'front',x:300,y:760},{id:'air',x:300,y:100,air:true}]};
 assert.deepEqual(renderOrder(g,0).map(x=>x.entity.id),['rear','tower','front','air']);
 assert.deepEqual(renderOrder(g,1).map(x=>x.entity.id),['front','tower','rear','air']);
});
test('server snapshots expose facing/mass/layer but not pathfinding internals',()=>{
 const g=game(),u=unit(g,'knight',0,190,930);advance(g,15);const snap=viewMatch(g,0);assert.equal(snap.physicsVersion,63);
 assert.equal(snap.units[0].mass,6);assert.equal(typeof snap.units[0].facing,'number');assert.ok(!('_nav' in snap.units[0]));
});
test('legacy active matches terminate safely instead of resuming inside new obstacles',()=>{
 const d=newRoom('123456','Rin');d.game=createMatch();delete d.game.physicsVersion;new RoomModel(d);assert.equal(d.game.phase,'ended');assert.equal(d.game.winner,null);
});
test('new physics remains deterministic across JSON save/restore',()=>{
 const a=game();unit(a,'knight',0,190,930);advance(a,35);const b=JSON.parse(JSON.stringify(a));
 for(let n=0;n<250;n++){tick(a,.1);tick(b,.1);}assert.deepEqual(viewMatch(a,0),viewMatch(b,0));
});
test('full mixed-army match stays finite and outside all static obstacles',()=>{
 const g=game();g.bot=true;g.difficulty='hard';
 for(let n=0;n<1400&&g.phase!=='ended';n++){if(n%12===0)runBot(g,0);tick(g,.1);checkStatics(g);for(const u of g.units)assert.ok(Number.isFinite(u.x)&&Number.isFinite(u.y));}
});


test('v26.1 global movement-speed reduction keeps relative roles',()=>{
 assert.equal(UNITS.blade.speed,50);assert.equal(UNITS.miniberserker.speed,46);assert.equal(UNITS.gargoyle.speed,69);assert.equal(UNITS.bombcarrier.speed,79);assert.equal(UNITS.skybomber.speed,51);
 assert.equal(UNITS.cannon.speed,0);assert.equal(UNITS.lasertower.speed,0);assert.equal(UNITS.megaknight.jumpTravelTime,1.5);assert.equal(UNITS.nightshade.dashSpeed,650);
});
