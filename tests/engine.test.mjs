import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,UNITS,DECK,DEFAULT_DECK,MAX_DECK,normalizeDeck} from '../public/game/units.js';
import {createMatch,tick,deploy,canPlace,viewMatch,runBot,inRiver,finish,distance} from '../public/game/engine.js';
function battle(seed=12){const g=createMatch({seed});g.phase='battle';return g;}
function deckWith(id){return [id,...DECK.filter(k=>k!==id)].slice(0,MAX_DECK);}
function ready(g,o,id){const p=g.players[o],deck=deckWith(id);p.energy=10;p.deck=[...deck];p.hand=deck.slice(0,4);p.queue=deck.slice(4);}
function spawn(g,o,id,x=190,y=o===0?650:390){ready(g,o,id);const r=deploy(g,o,id,x,y);assert.ok(r.ok,r.error);return g.units.at(-1);}
function advance(g,seconds){for(let i=0;i<Math.round(seconds*10);i++)tick(g,.1);}
test('fifteen unique cards, six-card deck rule and valid balance data',()=>{
 assert.equal(DECK.length,15);assert.equal(new Set(DECK).size,15);assert.equal(MAX_DECK,6);assert.equal(DEFAULT_DECK.length,6);assert.deepEqual(normalizeDeck(DEFAULT_DECK),[...DEFAULT_DECK]);
 for(const d of Object.values(UNITS)){assert.ok(d.hp>0&&d.cost>=1&&d.damage>0);assert.equal(d.id,DECK.find(x=>x===d.id));}
});
for(const id of DECK)test(`deploy ${id}: energy, count, card rotation`,()=>{
 const g=battle();ready(g,0,id);const next=g.players[0].queue[0],r=deploy(g,0,id,190,650);
 assert.ok(r.ok);assert.equal(g.units.length,UNITS[id].count);assert.equal(g.players[0].energy,10-UNITS[id].cost);
 assert.equal(g.players[0].hand[0],next);assert.equal(g.players[0].queue.at(-1),id);
 assert.equal(new Set([...g.players[0].hand,...g.players[0].queue]).size,MAX_DECK);
});
test('countdown blocks deployments and becomes battle after three seconds',()=>{
 const g=createMatch();assert.equal(deploy(g,0,g.players[0].hand[0],100,660).ok,false);advance(g,3);assert.equal(g.phase,'battle');
});
test('invalid coordinates, ownership and opponents territory are rejected without spending',()=>{
 const g=battle();ready(g,0,'blade');
 for(const [o,x,y] of [[0,NaN,650],[0,Infinity,650],[0,100,200],[0,-1,650],[0,700,650],[0,100,1000],[2,100,650],[1,100,650]]){
   const before=JSON.stringify(g);assert.ok(canPlace(g,o,'blade',x,y));assert.equal(JSON.stringify(g),before);
 }
});
test('unknown card and non-hand card rejected',()=>{
 const g=battle();ready(g,0,'blade');
 for(const id of ['unknown',null,{},[],{toString:null,valueOf:null},'__proto__','constructor'])assert.ok(canPlace(g,0,id,100,650));
 assert.ok(canPlace(g,0,g.players[0].queue[0],100,650));
});
test('not enough energy never spawns or changes hand',()=>{
 const g=battle();ready(g,0,'knight');g.players[0].energy=4;const before=JSON.stringify(g);
 assert.equal(deploy(g,0,'knight',100,660).ok,false);assert.equal(JSON.stringify(g),before);
});
test('tower and building placement overlap rejected',()=>{
 const g=battle();ready(g,0,'blade');assert.ok(canPlace(g,0,'blade',190,805));
 spawn(g,0,'cannon',100,650);ready(g,0,'blade');assert.ok(canPlace(g,0,'blade',100,650));
});
test('energy regenerates, caps at ten and doubles after two minutes',()=>{
 const g=battle();g.players[0].energy=0;advance(g,1);assert.ok(Math.abs(g.players[0].energy-.625)<1e-8);
 g.time=121;g.players[0].energy=0;advance(g,1);assert.ok(Math.abs(g.players[0].energy-1.25)<1e-8);
 advance(g,20);assert.equal(g.players[0].energy,10);
});
test('friendly ground units move, obey banks and eventually cross a bridge',()=>{
 const g=battle();const u=spawn(g,0,'knight',90,700);let crossed=false;
 for(let i=0;i<400;i++){tick(g,.1);const v=g.units.find(x=>x.id===u.id);if(!v)break;assert.equal(inRiver(v.x,v.y),false);if(v.y<482)crossed=true;}
 assert.ok(crossed);
});
test('flying bats are permitted over the river',()=>{
 const g=battle();const u=spawn(g,0,'bat',350,650);let airborne=false;
 for(let i=0;i<120;i++){tick(g,.1);const v=g.units.find(x=>x.id===u.id);if(v&&v.y>482&&v.y<558)airborne=true;}
 assert.ok(airborne);
});
test('cannon is stationary and expires at 32 seconds',()=>{
 const g=battle();const u=spawn(g,0,'cannon',100,650);advance(g,10);assert.equal(u.x,100);assert.equal(u.y,650);
 advance(g,23);assert.equal(g.units.some(x=>x.id===u.id),false);
});
test('ground-only attacker cannot damage a bat',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'blade',100,650),b=spawn(g,1,'bat',100,390);b.x=100;b.y=645;b.spawn=0;a.spawn=0;
 g.units=g.units.filter(u=>u.id===a.id||u.id===b.id);const hp=b.hp;advance(g,.7);assert.equal(b.hp,hp);
});
test('archer can hit airborne enemies',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'archer',100,650),b=spawn(g,1,'bat',100,390);b.y=560;a.spawn=0;b.spawn=0;b.speed=0;
 g.units=g.units.filter(u=>u.id===a.id||u.id===b.id);const hp=b.hp;advance(g,1.1);assert.ok(b.hp<hp);
});
test('bomber splash damages two close ground targets',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'bomber',100,650),b=spawn(g,1,'knight',100,390),c=spawn(g,1,'blade',150,390);
 b.y=570;c.y=570;a.spawn=b.spawn=c.spawn=0;b.speed=c.speed=0;const hp1=b.hp,hp2=c.hp;
 advance(g,1.2);assert.ok(b.hp<hp1);assert.ok(c.hp<hp2);
});
test('stone golem ignores enemy troops and damages structures only',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const golem=spawn(g,0,'golem',190,650),enemy=spawn(g,1,'blade',190,390);
 golem.spawn=0;enemy.spawn=0;enemy.x=285;enemy.y=600;enemy.speed=0;enemy.damage=0;
 const enemyHp=enemy.hp,target=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),towerHp=target.hp;
 advance(g,32);assert.equal(enemy.hp,enemyHp);assert.ok(target.hp<towerHp,'golem should reach and damage a tower');
});


test('iron boar ignores troops and consumes a charged hit on structures',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const boar=spawn(g,0,'boar',190,650),enemy=spawn(g,1,'blade',190,390);
 boar.spawn=enemy.spawn=0;enemy.damage=0;enemy.speed=0;enemy.x=190;enemy.y=315;
 const target=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),hp=target.hp,enemyHp=enemy.hp;
 boar.x=190;boar.y=295;boar.charged=true;boar.chargeRun=UNITS.boar.chargeDistance;boar.cd=0;
 tick(g,.1);
 assert.equal(enemy.hp,enemyHp);assert.equal(target.hp,hp-Math.round(UNITS.boar.damage*UNITS.boar.chargeMultiplier));
 assert.equal(boar.charged,false);assert.equal(boar.chargeRun,0);
});
test('iron boar earns charge by running toward a building',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const boar=spawn(g,0,'boar',190,650);boar.spawn=0;
 for(let i=0;i<40&&!boar.charged;i++)tick(g,.1);
 assert.equal(boar.charged,true);assert.ok(boar.chargeRun>=UNITS.boar.chargeDistance);
});
test('nightshade prioritizes nearby ranged backline over a closer tank',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const shade=spawn(g,0,'nightshade',190,650),tank=spawn(g,1,'knight',190,390),archer=spawn(g,1,'archer',240,390);
 shade.spawn=tank.spawn=archer.spawn=0;shade.x=190;shade.y=600;tank.x=190;tank.y=555;archer.x=235;archer.y=525;
 tank.speed=archer.speed=0;tank.damage=archer.damage=0;tick(g,.1);
 assert.equal(shade.target,archer.id);
});
test('mossling card spawns five legal individual bodies',()=>{
 const g=battle();ready(g,0,'mossling');const r=deploy(g,0,'mossling',300,680);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.type==='mossling');assert.equal(pack.length,5);
 for(let i=0;i<pack.length;i++)for(let j=i+1;j<pack.length;j++)assert.ok(distance(pack[i],pack[j])>=pack[i].radius+pack[j].radius-.01);
});

test('lumina priest heals a damaged nearby ally but never a building',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const priest=spawn(g,0,'lumina',300,650),tank=spawn(g,0,'knight',330,650);priest.spawn=tank.spawn=0;priest.damage=0;tank.speed=0;
 tank.hp-=500;const before=tank.hp, tower=g.towers.find(t=>t.owner===0&&t.kind==='tower');tower.hp-=300;const towerBefore=tower.hp;
 advance(g,1.4);assert.ok(tank.hp>before);assert.equal(tower.hp,towerBefore);
});
test('frost shaman slows ground movement and strips part of a boar charge',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const frost=spawn(g,0,'frost',190,650),boar=spawn(g,1,'boar',190,390);frost.spawn=boar.spawn=0;frost.x=190;frost.y=590;boar.x=190;boar.y=520;boar.speed=0;boar.charged=true;boar.chargeRun=UNITS.boar.chargeDistance;
 advance(g,1.8);assert.ok((boar.slowUntil||0)>g.time);assert.equal(boar.charged,false);assert.ok(boar.chargeRun<UNITS.boar.chargeDistance);
});
test('storm harpy chain lightning damages up to three clustered enemies',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const harpy=spawn(g,0,'harpy',300,650);harpy.spawn=0;harpy.x=300;harpy.y=590;
 const victims=['mossling','mossling','blade'].map((id,i)=>spawn(g,1,id,270+i*30,390));
 victims.forEach((u,i)=>{u.spawn=0;u.x=285+i*28;u.y=520;u.speed=0;u.damage=0;});
 const hp=victims.map(u=>u.hp);advance(g,1.5);assert.ok(victims.every((u,i)=>u.hp<hp[i]));
});

test('main tower destruction ends match immediately',()=>{
 const g=battle();g.towers.find(t=>t.id==='t12').hp=0;tick(g,.1);assert.equal(g.phase,'ended');assert.equal(g.winner,0);
});
test('simultaneous main tower destruction is a draw',()=>{
 const g=battle();g.towers.filter(t=>t.kind==='core').forEach(t=>t.hp=0);tick(g,.1);assert.equal(g.winner,null);
});
test('three minute unequal tower count decides the winner',()=>{
 const g=battle();g.time=179.9;g.towers.find(t=>t.id==='t10').hp=0;tick(g,.1);assert.equal(g.phase,'ended');assert.equal(g.winner,0);
});
test('equal tower count starts overtime; first tower wins',()=>{
 const g=battle();g.time=179.9;tick(g,.1);assert.equal(g.overtime,true);assert.equal(g.phase,'battle');
 g.towers.find(t=>t.id==='t00').hp=0;tick(g,.1);assert.equal(g.winner,1);
});
test('full timeout uses remaining tower HP and exact tie draws',()=>{
 for(const hp of [1500,1650]){
 const g=battle();g.overtime=true;g.time=239.9;g.towers[0].hp=hp;tick(g,.1);
 assert.equal(g.phase,'ended');assert.equal(g.winner,hp===1650?null:1);
 }
});
test('ended matches do not continue to simulate',()=>{
 const g=battle();finish(g,0,'test');const s=JSON.stringify(g);advance(g,1);assert.equal(JSON.stringify(g),s);
});
test('snapshots never contain seed, enemy hand, queue or damage internals',()=>{
 const g=battle();const s=viewMatch(g,1);
 assert.equal(s.rng,undefined);assert.equal(s.players,undefined);assert.equal(s.queue,undefined);assert.deepEqual(s.hand,g.players[1].hand);
 s.hand[0]='test';assert.notEqual(g.players[1].hand[0],'test');
});
test('same seed plus same commands remains deterministic for four minutes',()=>{
 const a=createMatch({seed:837,bot:true}),b=createMatch({seed:837,bot:true});
 for(let i=0;i<2440;i++){
  tick(a,.1);tick(b,.1);
  if(i%15===0){runBot(a,0);runBot(b,0);}
 }
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.phase,'ended');
});
test('invalid tick duration is rejected',()=>{
 const g=battle();for(const dt of [NaN,-1,0,.3])assert.throws(()=>tick(g,dt),RangeError);
});
test('maximum unit cap rejects a multi-unit card atomically',()=>{
 const g=battle();g.units=Array.from({length:ARENA.maxUnits-1},(_,i)=>({id:i,hp:1,x:60,y:660}));ready(g,0,'bat');
 const energy=g.players[0].energy;assert.equal(deploy(g,0,'bat',190,650).ok,false);assert.equal(g.players[0].energy,energy);
});
