import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,UNITS,DECK,VERSION} from '../public/game/units.js';
import {createMatch,tick,deploy,canPlace,viewMatch,distance,runBot} from '../public/game/engine.js';
import {staticFree,terrainFree,staticLineFree,resolveBodies,pairDistance,moveBody,navigationWaypoint,faceToward,PHYSICS_VERSION,solidStructures} from '../public/game/physics.js';
import {visualFacing,renderOrder} from '../public/game/art.js';
import {RoomModel,newRoom} from '../src/room-model.js';
function game(){const g=createMatch({seed:719});g.phase='battle';for(const t of g.towers)t.damage=0;return g;}
function card(g,id,owner=0){const p=g.players[owner];p.energy=10;p.hand=[id,...DECK.filter(x=>x!==id).slice(0,3)];p.queue=DECK.filter(x=>!p.hand.includes(x));}
function unit(g,type,owner,x,y){card(g,type,owner);const r=deploy(g,owner,type,x,y);assert.ok(r.ok,r.error);return g.units.at(-1);}
function advance(g,n){for(let i=0;i<n;i++)tick(g,.1);}
function body(g,type,owner,x,y){const u={...UNITS[type],id:`u${g.nextId++}`,type,owner,x,y,maxHp:UNITS[type].hp,spawn:0,cd:999,walk:0,age:0,anim:0,hit:0,lane:x<360?190:530,face:owner===0?-1:1};g.units.push(u);return u;}
function checkStatics(g){for(const u of g.units)if(!u.building&&u.burrowState!=='burrow')assert.ok(staticFree(g,u,u),`${u.id} ${u.type} in static at ${u.x},${u.y}`);}

test('v15 physics version and mass/radius data are explicit',()=>{
 assert.equal(VERSION,'15.0.0');assert.equal(PHYSICS_VERSION,13);
 assert.ok(UNITS.knight.mass>UNITS.archer.mass);assert.ok(UNITS.knight.radius>UNITS.archer.radius);
 assert.equal(createMatch().physicsVersion,13);
});
test('body may not put its edge across the river even if its centre is on land',()=>{
 const u=UNITS.knight;assert.equal(terrainFree(u,{x:350,y:480}),false);
 assert.equal(terrainFree(u,{x:190,y:520}),true);assert.equal(terrainFree(u,{x:225,y:520}),false);
 assert.equal(terrainFree(UNITS.bat,{x:350,y:520}),true);
});
test('ground rejects deployment inside towers; air may fly/deploy over them',()=>{
 const g=game();card(g,'knight');assert.ok(canPlace(g,0,'knight',190,805));
 card(g,'bat');assert.equal(canPlace(g,0,'bat',190,805),null);assert.ok(deploy(g,0,'bat',190,805).ok);
});
test('all three air group members have legal non-overlapping initial positions',()=>{
 const g=game();card(g,'bat');assert.ok(deploy(g,0,'bat',60,605).ok);
 assert.equal(g.units.length,3);checkStatics(g);
 for(const a of g.units)for(const b of g.units)if(a!==b)assert.ok(distance(a,b)>=a.radius+b.radius);
 for(const u of g.units)assert.ok(u.y>=600);
});
test('spawn near a ground ally shifts to free space without spending twice',()=>{
 const g=game(),a=unit(g,'knight',0,150,700);const b=unit(g,'blade',0,150,700);
 assert.ok(distance(a,b)>=a.radius+b.radius);assert.equal(g.players[0].energy,8);assert.equal(a.x,150);
});
test('building cannot be placed underneath an existing ground unit',()=>{
 const g=game();unit(g,'blade',0,300,700);card(g,'cannon');const saved=JSON.stringify(g.players[0]);
 assert.ok(canPlace(g,0,'cannon',300,700));assert.equal(deploy(g,0,'cannon',300,700).ok,false);assert.equal(JSON.stringify(g.players[0]),saved);
});
for(const owner of [0,1])for(const type of ['blade','knight','archer','mage','spear','bomber'])test(`${type} seat ${owner}: rear deployment navigates its tower and bridge`,()=>{
 const g=game(),x=owner===0?190:530,y=owner===0?935:105,u=unit(g,type,owner,x,y);
 // Do not let the enemy shoot; leave obstacles alive and solid.
 const start={x:u.x,y:u.y};let lateral=0;
 for(let n=0;n<260;n++){tick(g,.1);checkStatics(g);lateral=Math.max(lateral,Math.abs(u.x-start.x));if(owner===0?u.y<460:u.y>580)break;}
 assert.ok(owner===0?u.y<460:u.y>580,`did not cross: ${u.x} ${u.y}`);
 assert.ok(lateral>=u.radius+25,`did not go around tower: ${lateral}`);
});
test('air crosses river and a tower in a straight path without ground detours',()=>{
 const g=game(),u=body(g,'bat',0,360,980),target={id:'goal',x:360,y:350,radius:0};
 for(let i=0;i<85;i++){const p=navigationWaypoint(g,u,target,5);moveBody(g,u,p,.1);g.time+=.1;}
 assert.ok(u.y<482);assert.equal(u.x,360);
});
test('ground and air occupying the same point exert no separation force',()=>{
 const g=game(),a=body(g,'blade',0,300,700),b=body(g,'bat',0,300,700);resolveBodies(g,.1);
 assert.equal(a.x,b.x);assert.equal(a.y,b.y);
});
test('ground versus enemy air also does not physically block movement',()=>{
 const g=game(),a=body(g,'blade',0,300,700);body(g,'bat',1,300,660);
 for(let i=0;i<20;i++)moveBody(g,a,{x:300,y:610},.1);
 assert.ok(a.y<640);
});
test('allied ground bodies yield softly and a heavy knight moves less',()=>{
 const g=game(),a=body(g,'knight',0,300,700),b=body(g,'archer',0,332,700);resolveBodies(g,.1);
 assert.ok(a.x<300);assert.ok(b.x>332);assert.ok(b.x-332>(300-a.x)*3);assert.ok(distance(a,b)>32);
});
test('same-air-layer allies separate, without any ground movement',()=>{
 const g=game(),a=body(g,'bat',0,300,700),b=body(g,'bat',0,306,700),floor=body(g,'knight',0,300,700);
 resolveBodies(g,.1);assert.ok(distance(a,b)>6);assert.equal(floor.x,300);assert.equal(floor.y,700);
});
test('enemies cannot tunnel through one another, even with a long requested displacement',()=>{
 const g=game(),a=body(g,'blade',0,300,700),b=body(g,'knight',1,300,655);
 const start={x:a.x,y:a.y};moveBody(g,a,{x:300,y:500},1);
 assert.ok(distance(a,b)>=a.radius+b.radius-.01);assert.ok(distance(start,a)<=a.speed+.001);
});
test('air opponents respect each other while ignoring ground units',()=>{
 const g=game(),a=body(g,'bat',0,300,700),b=body(g,'bat',1,300,665);
 moveBody(g,a,{x:300,y:500},.3);assert.ok(distance(a,b)>=a.radius+b.radius-.01);
});
test('building remains fixed while an ally tries to move into it',()=>{
 const g=game(),c=unit(g,'cannon',0,300,700),u=body(g,'knight',0,300,775);
 for(let i=0;i<45;i++){moveBody(g,u,{x:300,y:640},.1);resolveBodies(g,.1);checkStatics(g);}
 assert.equal(c.x,300);assert.equal(c.y,700);
});
test('enemy bodies block, but are not an infinite wall across the whole lane',()=>{
 const g=game(),a=body(g,'blade',0,300,740),b=body(g,'knight',1,300,685);let passed=false;
 for(let i=0;i<60;i++){moveBody(g,a,{x:300,y:600},.1);assert.ok(distance(a,b)>=a.radius+b.radius-.01);if(a.y<650)passed=true;}
 assert.ok(passed,'should be able to walk around a single blocker');
});
test('iron boar can shove lightweight enemy troops and keep moving through bridge congestion',()=>{
 const g=game(),boar=body(g,'boar',0,190,620);boar.facing=-Math.PI/2;
 const pack=[body(g,'mossling',1,190,584),body(g,'mossling',1,177,575),body(g,'archer',1,203,575)];
 const before=pack.map(u=>({x:u.x,y:u.y}));
 for(let i=0;i<35;i++){moveBody(g,boar,{x:190,y:500},.1);resolveBodies(g,.1);}
 assert.ok(boar.y<585,`boar stuck at ${boar.x},${boar.y}`);
 assert.ok(pack.some((u,i)=>distance(u,before[i])>8),'at least one lightweight blocker should be displaced');
 for(const u of [boar,...pack])assert.ok(staticFree(g,u,u));
});
test('crowd separation does not push units into a solid tower or water',()=>{
 const g=game();
 for(let i=0;i<8;i++)body(g,i%2?'archer':'knight',0,190+(i%3)*8,580+Math.floor(i/3)*10);
 for(let i=0;i<100;i++){resolveBodies(g,.1);checkStatics(g);}
});
test('defeated tower immediately loses collision and invalidates the route cache',()=>{
 const g=game(),u=body(g,'blade',0,190,900),target={id:'end',x:190,y:600,radius:0};
 assert.equal(staticLineFree(g,u,u,target),false);const before=navigationWaypoint(g,u,target,5);assert.ok(Math.abs(before.x-190)>10);
 g.towers.find(t=>t.owner===0&&t.x===190).hp=0;
 assert.equal(staticLineFree(g,u,u,target),true);const after=navigationWaypoint(g,u,target,5);assert.equal(after.x,190);
});
test('fully decayed cannon is removed from the solid obstacle set',()=>{
 const g=game(),c=unit(g,'cannon',0,300,700);c.hp=UNITS.cannon.decayPerSecond*.1;c.spawn=0;tick(g,.1);
 assert.ok(!solidStructures(g).some(x=>x.id===c.id));
});
test('navigation around a cannon produces real extra travel, not a spawn delay',()=>{
 const g=game(),c=unit(g,'cannon',0,300,730),u=body(g,'blade',0,300,825),target={id:'goal',x:300,y:620,radius:0};
 let travel=0;
 for(let n=0;n<100&&u.y>625;n++){const p=navigationWaypoint(g,u,target,5);travel+=moveBody(g,u,p,.1);g.time+=.1;checkStatics(g);}
 assert.ok(u.y<630,`stuck ${u.x},${u.y}`);assert.ok(travel>205);assert.equal(c.x,300);
});
test('navigation with no accessible target fails closed instead of teleporting',()=>{
 const g=game(),u=body(g,'knight',0,300,700),t={id:'water',x:350,y:520,radius:0};
 const p=navigationWaypoint(g,u,t,1);assert.ok(Number.isFinite(p.x));assert.ok(staticFree(g,u,p));
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
 const g=game(),u=unit(g,'knight',0,190,930);advance(g,15);const snap=viewMatch(g,0);assert.equal(snap.physicsVersion,13);
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
